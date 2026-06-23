import { useCallback, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart, type ToolUIPart, type UIMessage } from "ai";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mic, MicOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputController,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import logo from "@/assets/toka-logo.png";

const SUGGESTIONS = [
  "I sold rice today for 1000",
  "I spent 200 on transport",
  "How much profit did I make this month?",
  "What were my largest expenses this week?",
];

interface ChatWindowProps {
  conversationId: string;
  initialMessages: UIMessage[];
}

export function ChatWindow({ conversationId, initialMessages }: ChatWindowProps) {
  const queryClient = useQueryClient();

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { conversationId },
        fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
          const { data } = await supabase.auth.getSession();
          const headers = new Headers(init?.headers);
          const token = data.session?.access_token;
          if (token) headers.set("Authorization", `Bearer ${token}`);
          return fetch(input, { ...init, headers });
        }) as typeof fetch,
      }),
    [conversationId],
  );

  const { messages, sendMessage, status, stop } = useChat({
    id: conversationId,
    messages: initialMessages,
    transport,
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["report"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => {
      const message = error?.message ?? "";
      if (message.includes("429")) {
        toast.error("Too many requests — please wait a moment and try again.");
      } else if (message.includes("402")) {
        toast.error("AI credits are used up. Please add credits to continue.");
      } else {
        toast.error("Something went wrong talking to TOKA. Please try again.");
      }
    },
  });

  const isThinking = status === "submitted" || status === "streaming";

  const renderMessageParts = useCallback((message: UIMessage) => {
    return message.parts.map((part, index) => {
      if (part.type === "text") {
        return (
          <p key={index} className="whitespace-pre-wrap">
            {part.text}
          </p>
        );
      }

      if (part.type === "file") {
        const filePart = part as FileUIPart;
        const fileName = filePart.filename ?? "attachment";
        return (
          <div key={index} className="rounded-md border border-border bg-muted px-3 py-2 text-sm">
            {filePart.mediaType?.startsWith("image/") ? (
              <img
                src={filePart.url}
                alt={fileName}
                className="max-h-40 w-auto rounded-md object-contain"
              />
            ) : null}
            <a
              href={filePart.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block font-medium text-primary underline"
            >
              {fileName}
            </a>
          </div>
        );
      }

      if (part.type.startsWith("tool-")) {
        const toolPart = part as ToolUIPart;
        return (
          <Tool key={index} defaultOpen={false}>
            <ToolHeader type={toolPart.type} state={toolPart.state} />
            <ToolContent>
              <ToolInput input={toolPart.input} />
              <ToolOutput output={toolPart.output} errorText={toolPart.errorText} />
            </ToolContent>
          </Tool>
        );
      }

      return null;
    });
  }, []);

  return (
    <div className="flex h-full flex-col">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl px-4 py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <img
                src={logo}
                alt="TOKA AI"
                width={64}
                height={64}
                className="h-16 w-16"
                loading="lazy"
              />
              <h2 className="mt-4 font-display text-xl font-bold">Talk to your business</h2>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                Tell me about a sale or expense and I'll record it, or ask me anything about your
                money.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      if (status === "submitted" || status === "streaming") {
                        toast.error("Please wait for TOKA to finish before sending another message.");
                        return;
                      }
                      sendMessage({ text: suggestion });
                    }}
                    className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-foreground shadow-soft transition-colors hover:bg-accent"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {message.role === "user" ? (
                  renderMessageParts(message)
                ) : (
                  renderMessageParts(message)
                )}
              </MessageContent>
            </Message>
          ))}

          {isThinking && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>TOKA is thinking…</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border bg-background p-3">
        <div className="mx-auto w-full max-w-3xl">
          <PromptInputProvider>
            <Composer status={status} onStop={stop} onSend={(message) => sendMessage(message)} />
          </PromptInputProvider>
        </div>
      </div>
    </div>
  );
}

function Composer({
  status,
  onSend,
  onStop,
}: {
  status: ReturnType<typeof useChat>["status"];
  onSend: (message: { text: string; files?: FileUIPart[] }) => Promise<void>;
  onStop: () => void;
}) {
  const controller = usePromptInputController();

  const {
    listening,
    supported,
    start,
    stop: stopListening,
  } = useSpeechRecognition((text) => {
    const current = controller.textInput.value;
    controller.textInput.setInput(current ? `${current} ${text}` : text);
  });

  const focusInput = () => {
    document.getElementById("chat-input")?.focus();
  };

  useEffect(() => {
    if (status === "ready") focusInput();
  }, [status]);

  const handleSubmit = async (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text) return;
    if (status === "submitted" || status === "streaming") {
      toast.error("Please wait for TOKA to finish before sending another message.");
      return;
    }
    if (listening) stopListening();

    try {
      await onSend({ text, files: message.files?.length ? message.files : undefined });
      controller.textInput.clear();
      requestAnimationFrame(focusInput);
    } catch (error) {
      toast.error("Unable to send your message. Please try again.");
      console.error("Chat send failed", error);
    }
  };

  return (
    <PromptInput onSubmit={handleSubmit}>
      <PromptInputTextarea
        id="chat-input"
        autoFocus
        placeholder='Try: "I sold rice today for 1000"'
      />
      <PromptInputFooter>
        <PromptInputTools>
          <PromptInputButton
            type="button"
            variant={listening ? "default" : "ghost"}
            onClick={listening ? stopListening : start}
            disabled={!supported}
            aria-label={listening ? "Stop voice input" : "Start voice input"}
            tooltip={
              supported
                ? listening
                  ? "Stop listening"
                  : "Speak to TOKA"
                : "Voice input is not supported in this browser"
            }
          >
            {listening ? <MicOff className="size-4 animate-pulse" /> : <Mic className="size-4" />}
          </PromptInputButton>
          {listening && <span className="text-xs font-medium text-primary">Listening…</span>}
        </PromptInputTools>
        <PromptInputSubmit status={status} onStop={onStop} />
      </PromptInputFooter>
    </PromptInput>
  );
}
