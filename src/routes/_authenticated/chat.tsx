import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { History } from "lucide-react";
import { ThreadList } from "@/components/chat/ThreadList";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatLayout,
});

function ChatLayout() {
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="flex h-[calc(100svh-3.5rem)] w-full overflow-hidden">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-muted/30 md:block">
        <ThreadList />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2 md:hidden">
          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <History className="h-4 w-4" /> Conversations
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="border-b border-border px-4 py-3">
                <SheetTitle className="text-left text-sm">Conversations</SheetTitle>
              </SheetHeader>
              <div className="h-[calc(100%-3.25rem)]">
                <ThreadList onNavigate={() => setHistoryOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="min-h-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
