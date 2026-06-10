import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data;
  });

export const createConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: userId, title: "New conversation" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: data.id };
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getConversationMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ conversationId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, title")
      .eq("id", data.conversationId)
      .eq("user_id", userId)
      .maybeSingle();
    if (convError) throw new Error(convError.message);
    if (!conversation) throw new Error("Conversation not found");

    const { data: rows, error } = await supabase
      .from("messages")
      .select("id, role, parts, created_at")
      .eq("conversation_id", data.conversationId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);

    return {
      title: conversation.title,
      messages: rows.map((row) => ({
        id: row.id,
        role: row.role as "user" | "assistant",
        parts: row.parts,
      })),
    };
  });
