import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Plus, Trash2, MessagesSquare } from "lucide-react";
import {
  listConversations,
  createConversation,
  deleteConversation,
} from "@/lib/conversations.functions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ThreadList({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams({ strict: false }) as { conversationId?: string };

  const listFn = useServerFn(listConversations);
  const createFn = useServerFn(createConversation);
  const deleteFn = useServerFn(deleteConversation);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => listFn(),
  });

  const createMutation = useMutation({
    mutationFn: () => createFn(),
    onSuccess: ({ id }) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      navigate({ to: "/chat/$conversationId", params: { conversationId: id } });
      onNavigate?.();
    },
    onError: () => toast.error("Could not start a new conversation."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.removeQueries({ queryKey: ["conversation", id] });
      if (params.conversationId === id) {
        navigate({ to: "/chat" });
      }
    },
    onError: () => toast.error("Could not delete the conversation."),
  });

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button
          className="w-full"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          <Plus className="h-4 w-4" /> New conversation
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {isLoading ? (
          <div className="space-y-2 px-1">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <MessagesSquare className="mx-auto h-6 w-6 text-muted-foreground/50" />
            <p className="mt-2 text-xs text-muted-foreground">No conversations yet</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {conversations.map((conversation) => {
              const active = params.conversationId === conversation.id;
              return (
                <li key={conversation.id} className="group relative">
                  <Link
                    to="/chat/$conversationId"
                    params={{ conversationId: conversation.id }}
                    onClick={onNavigate}
                    className={`block rounded-lg px-3 py-2 pr-9 transition-colors ${
                      active ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                    }`}
                  >
                    <span className="block truncate text-sm font-medium">
                      {conversation.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                    </span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete conversation"
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={() => deleteMutation.mutate(conversation.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
