import { useGetUser, useBlockUser, useReportUser, useStartConversation, getListConversationsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, MessageCircle, Shield, Flag, CheckCircle, Star, ArrowLeft } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Profile() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useGetUser(id, { query: { enabled: !!id } });
  const blockUser = useBlockUser();
  const reportUser = useReportUser();
  const startConversation = useStartConversation();

  const [blocked, setBlocked] = useState(false);
  const [reported, setReported] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);

  function handleMessage() {
    if (!id) return;
    setMsgLoading(true);
    startConversation.mutate(
      { data: { userId: id } },
      {
        onSuccess: (conv) => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          navigate(`/messages/${conv.id}`);
        },
        onSettled: () => setMsgLoading(false),
      }
    );
  }

  function handleBlock() {
    blockUser.mutate({ id }, { onSuccess: () => setBlocked(true) });
  }

  function handleReport() {
    reportUser.mutate({ id, data: { reason: "Inappropriate content" } }, { onSuccess: () => setReported(true) });
  }

  const isMe = id === 1;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <h2 className="text-xl font-semibold">User not found</h2>
          <Button variant="outline" onClick={() => navigate("/")}>Go back</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-full overflow-y-auto pb-24 md:pb-0">
        <div className="relative">
          <div className="absolute inset-0 h-56 bg-gradient-to-b from-primary/30 to-background" />
          <button
            className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center border border-border"
            onClick={() => navigate(-1 as unknown as string)}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative pt-16 px-6 pb-6 flex flex-col items-center">
            <div className="relative mb-4">
              <Avatar className="w-28 h-28 border-4 border-background shadow-xl shadow-black/30">
                <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName} />
                <AvatarFallback className="text-3xl font-bold bg-secondary">
                  {user.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {user.isOnline && (
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-background shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
              )}
            </div>

            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <h1 className="text-2xl font-bold tracking-tight">
                  {user.displayName}
                  {user.age ? <span className="text-muted-foreground font-normal ml-2 text-xl">{user.age}</span> : null}
                </h1>
                {user.isVerified && <CheckCircle className="w-5 h-5 text-primary fill-primary" />}
              </div>
              <p className="text-muted-foreground text-sm">@{user.username}</p>

              <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                {user.isPremium && (
                  <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
                    <Star className="w-3 h-3" /> Premium
                  </Badge>
                )}
                {user.isOnline ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Online Now</Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">Offline</Badge>
                )}
                {user.location && (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    <MapPin className="w-3 h-3" /> {user.location}
                  </Badge>
                )}
              </div>
            </div>

            {user.bio && (
              <p className="text-center text-muted-foreground text-sm max-w-xs leading-relaxed mb-6">
                {user.bio}
              </p>
            )}

            {!isMe && (
              <div className="flex gap-3 w-full max-w-xs">
                <Button
                  className={cn("flex-1 gap-2 rounded-2xl h-12 font-semibold")}
                  onClick={handleMessage}
                  disabled={msgLoading || blocked}
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </Button>
                <Button
                  variant="outline"
                  className={cn("w-12 h-12 rounded-2xl", blocked && "text-muted-foreground")}
                  onClick={handleBlock}
                  title="Block user"
                  disabled={blocked}
                >
                  <Shield className={cn("w-4 h-4", blocked && "text-primary")} />
                </Button>
                <Button
                  variant="outline"
                  className="w-12 h-12 rounded-2xl"
                  onClick={handleReport}
                  title="Report user"
                  disabled={reported}
                >
                  <Flag className={cn("w-4 h-4", reported && "text-destructive")} />
                </Button>
              </div>
            )}

            {isMe && (
              <Button
                variant="outline"
                className="rounded-2xl px-8 h-12"
                onClick={() => navigate("/settings")}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
