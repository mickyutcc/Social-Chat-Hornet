import { useListPosts, getListPostsQueryKey, useLikePost, useCreatePost, useGetUser } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Share2, Send, Image as ImageIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function Feed() {
  const { data: posts, isLoading } = useListPosts({}, { query: { queryKey: getListPostsQueryKey({}) } });
  const { data: me } = useGetUser(1, { query: { enabled: true, queryKey: ["/api/users/1"] } });
  
  const [newPostContent, setNewPostContent] = useState("");
  const queryClient = useQueryClient();
  
  const createPost = useCreatePost({
    mutation: {
      onSuccess: () => {
        setNewPostContent("");
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
      }
    }
  });

  const likePost = useLikePost({
    mutation: {
      onMutate: async ({ id }) => {
        // Optimistic update
        await queryClient.cancelQueries({ queryKey: getListPostsQueryKey() });
        const previousPosts = queryClient.getQueryData<any>(getListPostsQueryKey());
        
        queryClient.setQueryData(getListPostsQueryKey(), (old: any) => {
          if (!old) return old;
          return old.map((post: any) => {
            if (post.id === id) {
              return {
                ...post,
                isLiked: !post.isLiked,
                likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1
              };
            }
            return post;
          });
        });
        
        return { previousPosts };
      },
      onError: (err, variables, context) => {
        if (context?.previousPosts) {
          queryClient.setQueryData(getListPostsQueryKey(), context.previousPosts);
        }
      }
    }
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    createPost.mutate({ data: { content: newPostContent } });
  };

  return (
    <Layout>
      <div className="flex flex-col h-full bg-background">
        <header className="px-6 py-4 sticky top-0 bg-background/80 backdrop-blur-xl z-20 border-b border-border/50">
          <h1 className="text-2xl font-bold tracking-tight">Community Feed</h1>
        </header>

        <div className="flex-1 overflow-y-auto pb-24 md:pb-6">
          <div className="max-w-2xl mx-auto w-full">
            {/* Create Post */}
            <div className="p-4 md:p-6 border-b border-border/50 bg-card/30">
              <div className="flex gap-4">
                <Avatar className="w-10 h-10 border border-border">
                  <AvatarImage src={me?.avatarUrl || undefined} />
                  <AvatarFallback>{me?.displayName?.substring(0, 2).toUpperCase() || 'ME'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea 
                    placeholder="What's on your mind?" 
                    className="min-h-[80px] resize-none bg-secondary/30 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-full">
                      <ImageIcon className="w-5 h-5" />
                    </Button>
                    <Button 
                      onClick={handleCreatePost} 
                      disabled={!newPostContent.trim() || createPost.isPending}
                      className="rounded-full px-6 shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:shadow-[0_0_20px_rgba(var(--primary),0.5)] transition-all"
                    >
                      {createPost.isPending ? "Posting..." : "Post"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="divide-y divide-border/30">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-6 animate-pulse flex gap-4">
                    <div className="w-10 h-10 bg-secondary rounded-full shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-secondary rounded w-1/4" />
                      <div className="h-20 bg-secondary rounded-xl w-full" />
                      <div className="flex gap-4">
                        <div className="w-8 h-8 bg-secondary rounded-full" />
                        <div className="w-8 h-8 bg-secondary rounded-full" />
                      </div>
                    </div>
                  </div>
                ))
              ) : posts?.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No posts yet. Be the first to share something!</p>
                </div>
              ) : (
                posts?.map((post) => (
                  <div key={post.id} className="p-4 md:p-6 hover:bg-secondary/10 transition-colors">
                    <div className="flex gap-3 md:gap-4">
                      <Avatar className="w-10 h-10 md:w-12 md:h-12 border border-border shrink-0 cursor-pointer" onClick={() => window.location.href = `/profile/${post.author.id}`}>
                        <AvatarImage src={post.author.avatarUrl || undefined} />
                        <AvatarFallback>{post.author.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-base truncate cursor-pointer hover:underline" onClick={() => window.location.href = `/profile/${post.author.id}`}>
                            {post.author.displayName}
                          </span>
                          <span className="text-muted-foreground text-sm shrink-0">· {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                        </div>
                        
                        <p className="text-foreground/90 whitespace-pre-wrap mb-3 text-[15px] md:text-base leading-relaxed">
                          {post.content}
                        </p>
                        
                        {post.imageUrl && (
                          <div className="mb-4 rounded-2xl overflow-hidden border border-border/50 max-h-[400px]">
                            <img src={post.imageUrl} alt="Post content" className="w-full h-full object-cover" />
                          </div>
                        )}
                        
                        <div className="flex items-center gap-6 text-muted-foreground mt-2">
                          <button 
                            className={cn(
                              "flex items-center gap-1.5 transition-colors group",
                              post.isLiked ? "text-primary" : "hover:text-primary"
                            )}
                            onClick={() => likePost.mutate({ id: post.id })}
                          >
                            <div className={cn(
                              "p-2 rounded-full group-hover:bg-primary/10 transition-colors",
                              post.isLiked && "bg-primary/10"
                            )}>
                              <Heart className={cn("w-5 h-5 transition-transform", post.isLiked && "fill-primary scale-110")} />
                            </div>
                            <span className={cn("text-sm font-medium", post.isLiked && "text-primary")}>{post.likesCount}</span>
                          </button>
                          
                          <button className="flex items-center gap-1.5 hover:text-blue-400 transition-colors group">
                            <div className="p-2 rounded-full group-hover:bg-blue-400/10 transition-colors">
                              <MessageSquare className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium">Reply</span>
                          </button>
                          
                          <button className="flex items-center gap-1.5 hover:text-green-400 transition-colors group ml-auto md:ml-0">
                            <div className="p-2 rounded-full group-hover:bg-green-400/10 transition-colors">
                              <Share2 className="w-5 h-5" />
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
