import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { listConversations, createConversation } from "@/lib/conversations.functions";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();
  const listFn = useServerFn(listConversations);
  const createFn = useServerFn(createConversation);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    (async () => {
      try {
        const conversations = await listFn();
        if (conversations.length > 0) {
          navigate({
            to: "/chat/$conversationId",
            params: { conversationId: conversations[0].id },
            replace: true,
          });
        } else {
          const { id } = await createFn();
          navigate({
            to: "/chat/$conversationId",
            params: { conversationId: id },
            replace: true,
          });
        }
      } catch {
        toast.error("Could not open the chat. Please try again.");
      }
    })();
  }, [listFn, createFn, navigate]);

  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
