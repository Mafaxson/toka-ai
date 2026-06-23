import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { getServerConfig } from "@/lib/config.server";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseUrl, supabasePublishableKey, lovableApiKey } = getServerConfig();

        // --- Authenticate the caller (RLS applies as this user) ---
        const authHeader = request.headers.get("authorization") ?? "";
        if (!authHeader.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice("Bearer ".length);

        if (!supabaseUrl || !supabasePublishableKey) {
          return new Response("Backend not configured", { status: 500 });
        }

        const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });

        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        const userId = userData?.user?.id;
        if (userError || !userId) {
          return new Response("Unauthorized", { status: 401 });
        }

        // --- Validate input ---
        const body = (await request.json()) as unknown;
        const requestSchema = z.object({
          conversationId: z.string().uuid(),
          messages: z
            .array(
              z.object({
                role: z.enum(["system", "user", "assistant"]),
                parts: z
                  .array(
                    z.union([
                      z.object({
                        type: z.literal("text"),
                        text: z.string(),
                      }),
                      z.object({
                        type: z.literal("file"),
                        filename: z.string().optional(),
                        mediaType: z.string().optional(),
                        url: z.string().optional(),
                      }),
                      z.object({
                        type: z.string(),
                      }).passthrough(),
                    ]),
                  )
                  .nonempty(),
              }),
            )
            .min(1),
        });

        const parsed = requestSchema.safeParse(body);
        if (!parsed.success) {
          return new Response("Invalid request", { status: 400 });
        }

        const conversationId = parsed.data.conversationId;
        const messages = parsed.data.messages.slice(-30);

        // --- Verify the conversation belongs to this user ---
        const { data: conversation } = await supabase
          .from("conversations")
          .select("id, message, ai_response")
          .eq("id", conversationId)
          .eq("user_id", userId)
          .maybeSingle();
        if (!conversation) {
          return new Response("Conversation not found", { status: 404 });
        }

        const { data: profile } = await supabase
          .from("users")
          .select("currency, business_name, full_name, preferred_language")
          .eq("id", userId)
          .maybeSingle();
        const currency = profile?.currency ?? "USD";

        // --- Persist the incoming user message ---
        const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
        if (!lastUserMessage) return new Response("Invalid request", { status: 400 });

        if (!lovableApiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
        const gateway = createLovableAiGatewayProvider(lovableApiKey);

        const tools = {
          record_transaction: tool({
            description:
              "Record a business income (money earned: sales, payments received) or expense (money spent: stock, transport, rent, supplies) for the user. Use this immediately whenever the user mentions earning or spending money.",
            inputSchema: z.object({
              type: z.enum(["income", "expense"]),
              amount: z.number().positive().describe("The amount of money, as a number"),
              category: z
                .string()
                .min(1)
                .max(60)
                .describe(
                  "Short category, e.g. Sales, Stock, Transport, Rent, Food, Supplies, Utilities, Other",
                ),
              description: z
                .string()
                .max(300)
                .optional()
                .describe("Short note about what was sold or bought"),
              date: z
                .string()
                .optional()
                .describe("ISO date (YYYY-MM-DD) only if the user mentioned a specific day"),
            }),
            execute: async ({ type, amount, category, description, date }) => {
              const occurredAt = date ? new Date(date) : new Date();
              const { data, error } = await supabase
                .from("transactions")
                .insert({
                  user_id: userId,
                  type,
                  amount,
                  category,
                  description: description ?? null,
                  transaction_date: Number.isNaN(occurredAt.getTime())
                    ? new Date().toISOString()
                    : occurredAt.toISOString(),
                })
                .select("id, type, amount, category, description, transaction_date")
                .single();
              if (error) return { success: false, error: error.message };
              return { success: true, transaction: data, currency };
            },
          }),
          query_transactions: tool({
            description:
              "Look up the user's recorded transactions and totals for a date range. Use this to answer questions about sales, expenses, profit, or business performance.",
            inputSchema: z.object({
              start_date: z.string().describe("Start date inclusive, ISO format YYYY-MM-DD"),
              end_date: z
                .string()
                .optional()
                .describe("End date inclusive, ISO format. Omit for up to now."),
              type: z.enum(["income", "expense"]).optional(),
            }),
            execute: async ({ start_date, end_date, type }) => {
              let query = supabase
                .from("transactions")
                .select("type, amount, category, description, transaction_date")
                .eq("user_id", userId)
                .gte("transaction_date", new Date(start_date).toISOString())
                .order("transaction_date", { ascending: false })
                .limit(200);
              if (end_date) {
                const end = new Date(end_date);
                end.setHours(23, 59, 59, 999);
                query = query.lte("transaction_date", end.toISOString());
              }
              if (type) query = query.eq("type", type);

              const { data, error } = await query;
              if (error) return { success: false, error: error.message };

              let income = 0;
              let expenses = 0;
              const byCategory: Record<string, number> = {};
              for (const t of data) {
                const amount = Number(t.amount);
                if (t.type === "income") income += amount;
                else expenses += amount;
                const label = `${t.type}: ${t.category}`;
                byCategory[label] = (byCategory[label] ?? 0) + amount;
              }

              return {
                success: true,
                currency,
                total_income: income,
                total_expenses: expenses,
                profit: income - expenses,
                transaction_count: data.length,
                by_category: byCategory,
                recent_transactions: data.slice(0, 20),
              };
            },
          }),
        };

        const today = new Date().toISOString().slice(0, 10);
        const businessLine = profile?.business_name
          ? `The user's business is called "${profile.business_name}".`
          : "";

        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: `You are TOKA AI, a warm, voice-first financial assistant for small business owners like market traders, shop owners and street vendors. ${businessLine} The user's currency is ${currency}. Today's date is ${today}.

Your jobs:
1. RECORD: whenever the user mentions money earned (a sale, payment received) or spent (stock, transport, rent, food, supplies), immediately call record_transaction. Pick a short sensible category. Assume amounts are in ${currency} unless stated otherwise. After recording, confirm briefly in one sentence.
2. ANSWER: for questions about sales, expenses, profit or performance, call query_transactions with the right date range (today is ${today}). Profit = income minus expenses.
3. SPEAK SIMPLY: short, friendly answers in plain language — no accounting jargon. Use everyday words. Format money amounts with ${currency}.
4. If an amount is missing or unclear, ask one short question instead of guessing.
5. Encourage good habits gently (e.g. recording expenses too), but never lecture.`,
          messages: await convertToModelMessages(messages),
          tools,
          stopWhen: stepCountIs(8),
          timeout: { totalMs: 120000, chunkMs: 15000 },
          maxRetries: 1,
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ responseMessage }) => {
            if (!responseMessage) return;

            const userSummary = lastUserMessage.parts
              .map((p) => {
                if (p.type === "text") return p.text;
                if (p.type === "file" && "filename" in p) return (p.filename ?? "attachment") + ".";
                return "";
              })
              .filter(Boolean)
              .join(" ")
              .trim()
              .slice(0, 500);

            const aiSummary = responseMessage.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join(" ")
              .trim()
              .slice(0, 2000);

            await supabase
              .from("conversations")
              .update({
                message: userSummary,
                ai_response: aiSummary,
              })
              .eq("id", conversationId)
              .eq("user_id", userId);
          },
        });
      },
    },
  },
});
