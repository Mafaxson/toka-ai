import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import type { UIMessage } from "ai";
import { getConversationMessages } from "@/lib/conversations.functions";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/chat/$conversationId")({
  component: ChatConversationPage,
});

function ChatConversationPage() {
  const { conversationId } = Route.useParams();
  const getMessagesFn = useServerFn(getConversationMessages);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => getMessagesFn({ data: { conversationId } }),
    staleTime: Infinity,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="font-medium">This conversation could not be found.</p>
        <Button asChild variant="outline">
          <Link to="/chat">Back to conversations</Link>
        </Button>
      </div>
    );
  }

  return (
    <ChatWindow
      key={conversationId}
      conversationId={conversationId}
      initialMessages={data.messages as unknown as UIMessage[]}
    />
  );
}
