import { useGetMessages, getGetMessagesQueryKey, useSendMessage, getListConversationsQueryKey, useListConversations } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Phone, Video } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const DEMO_USER_ID = 1;

export default function Chat() {
  const params = useParams<{ id: string }>();
  const convId = parseInt(params.id ?? "0", 10);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations } = useListConversations({ query: { queryKey: getListConversationsQueryKey() } });
  const conversation = conversations?.find((c) => c.id === convId);

  const { data: messages, isLoading } = useGetMessages(convId, {
    query: { enabled: !!convId, queryKey: getGetMessagesQueryKey(convId) },
  });

  const sendMessage = useSendMessage();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!content.trim()) return;
    const text = content.trim();
    setContent("");
    sendMessage.mutate(
      { id: convId, data: { content: text } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey(convId) });
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        },
      }
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const otherUser = conversation?.otherUser;

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur">
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
          onClick={() => navigate("/messages")}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {otherUser && (
          <>
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage src={otherUser.avatarUrl ?? undefined} alt={otherUser.displayName} />
                <AvatarFallback className="bg-secondary font-bold">
                  {otherUser.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {otherUser.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold leading-tight">{otherUser.displayName}</h2>
              <p className={cn("text-xs", otherUser.isOnline ? "text-green-400" : "text-muted-foreground")}>
                {otherUser.isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </>
        )}

        <div className="flex gap-2 ml-auto">
          <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground">
            <Phone className="w-4 h-4" />
          </button>
          <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground">
            <Video className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            {otherUser && (
              <Avatar className="w-16 h-16">
                <AvatarImage src={otherUser.avatarUrl ?? undefined} />
                <AvatarFallback className="text-2xl bg-secondary">{otherUser.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <div>
              <h3 className="font-semibold">{otherUser?.displayName}</h3>
              <p className="text-sm text-muted-foreground mt-1">Say hello to start the conversation</p>
            </div>
          </div>
        ) : (
          messages?.map((msg) => {
            const isMe = msg.senderId === DEMO_USER_ID;
            return (
              <div
                key={msg.id}
                className={cn("flex items-end gap-2", isMe ? "flex-row-reverse" : "flex-row")}
              >
                {!isMe && otherUser && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={otherUser.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-xs bg-secondary">{otherUser.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("flex flex-col gap-1 max-w-[70%]", isMe ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-secondary text-foreground rounded-bl-sm"
                    )}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground px-1">
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-border bg-card/80 backdrop-blur">
        <div className="flex gap-2 items-center">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 rounded-2xl bg-secondary border-none h-11 focus-visible:ring-1 focus-visible:ring-primary"
          />
          <Button
            onClick={handleSend}
            disabled={!content.trim() || sendMessage.isPending}
            className="w-11 h-11 rounded-2xl p-0 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
