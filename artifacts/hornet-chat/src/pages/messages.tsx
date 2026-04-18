import { useListConversations, getListConversationsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { MessageCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Messages() {
  const { data: conversations, isLoading } = useListConversations({ 
    query: { queryKey: getListConversationsQueryKey() } 
  });
  const [search, setSearch] = useState("");

  const filteredConversations = conversations?.filter(c => 
    c.otherUser.displayName.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex flex-col h-full bg-background">
        <header className="px-6 pt-8 pb-4 sticky top-0 bg-background/80 backdrop-blur-xl z-20 border-b border-border/50">
          <h1 className="text-3xl font-bold tracking-tight mb-6">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search conversations..." 
              className="w-full pl-10 h-12 bg-secondary/50 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-24 md:pb-6">
          <div className="max-w-3xl mx-auto w-full pt-2">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-4 items-center p-2">
                    <div className="w-14 h-14 bg-secondary rounded-full animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-secondary rounded w-1/3 animate-pulse" />
                      <div className="h-3 bg-secondary rounded w-2/3 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No messages yet</h3>
                <p className="text-muted-foreground mt-1 mb-6">Start a conversation from someone's profile</p>
                <Link href="/">
                  <button className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity">
                    Explore Users
                  </button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/20 px-2 md:px-4">
                {filteredConversations?.map((conv) => (
                  <Link key={conv.id} href={`/messages/${conv.id}`}>
                    <div className="flex items-center gap-4 p-3 md:p-4 hover:bg-secondary/30 rounded-2xl cursor-pointer transition-colors group">
                      <div className="relative">
                        <Avatar className="w-14 h-14 md:w-16 md:h-16 border-2 border-transparent group-hover:border-primary/20 transition-colors">
                          <AvatarImage src={conv.otherUser.avatarUrl || undefined} />
                          <AvatarFallback>{conv.otherUser.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {conv.otherUser.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className={cn(
                            "font-bold text-base md:text-lg truncate",
                            conv.unreadCount > 0 && "text-primary"
                          )}>
                            {conv.otherUser.displayName}
                          </h3>
                          {conv.lastMessageAt && (
                            <span className={cn(
                              "text-xs shrink-0 ml-2 font-medium",
                              conv.unreadCount > 0 ? "text-primary" : "text-muted-foreground"
                            )}>
                              {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false }).replace('about ', '')}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <p className={cn(
                            "text-sm truncate",
                            conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                          )}>
                            {conv.lastMessage || "Started a conversation"}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full shrink-0 shadow-[0_0_10px_rgba(var(--primary),0.4)]">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
