import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureProfileRow } from "./profile.server";

const TransactionInput = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive().max(1_000_000_000_000),
  category: z.string().min(1).max(80),
  description: z.string().max(500).nullable().optional(),
  occurred_at: z.string().min(4).max(40),
});

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const profile = await ensureProfileRow(supabase, userId, claims as Record<string, unknown>);

    const monthStart = startOfMonth(new Date()).toISOString();

    const [monthRes, recentRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("type, amount")
        .eq("user_id", userId)
        .gte("occurred_at", monthStart),
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("occurred_at", { ascending: false })
        .limit(8),
    ]);

    if (monthRes.error) throw new Error(monthRes.error.message);
    if (recentRes.error) throw new Error(recentRes.error.message);

    let income = 0;
    let expenses = 0;
    for (const t of monthRes.data) {
      if (t.type === "income") income += Number(t.amount);
      else expenses += Number(t.amount);
    }

    return {
      currency: profile.currency,
      businessName: profile.business_name,
      fullName: profile.full_name,
      monthIncome: income,
      monthExpenses: expenses,
      monthProfit: income - expenses,
      recent: recentRes.data,
    };
  });

export const listTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const profile = await ensureProfileRow(supabase, userId, claims as Record<string, unknown>);

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false })
      .limit(500);

    if (error) throw new Error(error.message);
    return { currency: profile.currency, transactions: data };
  });

export const addTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TransactionInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      type: data.type,
      amount: data.amount,
      category: data.category,
      description: data.description ?? null,
      occurred_at: new Date(data.occurred_at).toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    TransactionInput.extend({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("transactions")
      .update({
        type: data.type,
        amount: data.amount,
        category: data.category,
        description: data.description ?? null,
        occurred_at: new Date(data.occurred_at).toISOString(),
      })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ period: z.enum(["daily", "weekly", "monthly"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const profile = await ensureProfileRow(supabase, userId, claims as Record<string, unknown>);

    const now = new Date();
    const start =
      data.period === "daily"
        ? startOfDay(now)
        : data.period === "weekly"
          ? startOfWeek(now, { weekStartsOn: 1 })
          : startOfMonth(now);

    const { data: rows, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("occurred_at", start.toISOString())
      .order("occurred_at", { ascending: false })
      .limit(1000);

    if (error) throw new Error(error.message);

    let income = 0;
    let expenses = 0;
    const byCategory = new Map<string, { category: string; type: string; total: number }>();

    for (const t of rows) {
      const amount = Number(t.amount);
      if (t.type === "income") income += amount;
      else expenses += amount;
      const key = `${t.type}:${t.category}`;
      const entry = byCategory.get(key) ?? { category: t.category, type: t.type, total: 0 };
      entry.total += amount;
      byCategory.set(key, entry);
    }

    return {
      currency: profile.currency,
      periodStart: start.toISOString(),
      income,
      expenses,
      profit: income - expenses,
      count: rows.length,
      byCategory: [...byCategory.values()].sort((a, b) => b.total - a.total),
      transactions: rows.slice(0, 50),
    };
  });
