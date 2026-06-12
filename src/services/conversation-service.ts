import type { UIMessage } from "ai";

import { supabase } from "@/integrations/supabase/client";
import { requireAuthenticatedUser } from "./auth-service";

export async function listConversations() {
  const user = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("conversations")
    .select("id, user_id, message, ai_response, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
}

export async function createConversation(message = "") {
  const user = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: user.id, message, ai_response: "" })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteConversation(id: string) {
  const user = await requireAuthenticatedUser();
  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
}

export async function getConversationMessages(conversationId: string) {
  const user = await requireAuthenticatedUser();
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, user_id, message, ai_response, created_at")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (conversationError) throw conversationError;
  if (!conversation) throw new Error("Conversation not found");

  return {
    id: conversation.id,
    message: conversation.message,
    aiResponse: conversation.ai_response,
    createdAt: conversation.created_at,
    messages:
      conversation.message || conversation.ai_response
        ? ([
            {
              id: `${conversation.id}-user`,
              role: "user" as const,
              parts: [{ type: "text", text: conversation.message }],
            },
            {
              id: `${conversation.id}-assistant`,
              role: "assistant" as const,
              parts: [{ type: "text", text: conversation.ai_response }],
            },
          ] as UIMessage[])
        : [],
  };
}
