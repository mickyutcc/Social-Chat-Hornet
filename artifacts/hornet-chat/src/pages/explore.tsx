import { useListUsers, getListUsersQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { MapPin, User, Search, Map } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";

export default function Explore() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const { data: users, isLoading } = useListUsers(
    { search: debouncedSearch || undefined },
    { query: { queryKey: getListUsersQueryKey({ search: debouncedSearch || undefined }) } }
  );

  return (
    <Layout>
      <div className="flex flex-col h-full bg-background">
        <header className="px-6 pt-8 pb-4 sticky top-0 bg-background/80 backdrop-blur-xl z-20 border-b border-border/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Explore</h1>
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" /> Nearby
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center relative">
              <Map className="w-5 h-5 text-foreground" />
              <div className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-background animate-pulse" />
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search users by name or bio..." 
              className="w-full pl-10 h-12 bg-secondary/50 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="rounded-3xl overflow-hidden aspect-[3/4] relative">
                  <Skeleton className="w-full h-full" />
                </div>
              ))}
            </div>
          ) : users?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No users found</h3>
              <p className="text-muted-foreground mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {users?.filter(u => u.id !== 1).map((user) => (
                <Link key={user.id} href={`/profile/${user.id}`}>
                  <div className="group relative rounded-3xl overflow-hidden aspect-[3/4] cursor-pointer bg-secondary shadow-sm hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-1">
                    {user.avatarUrl ? (
                      <img 
                        src={user.avatarUrl} 
                        alt={user.displayName} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <User className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                    
                    <div className="absolute top-3 left-3 flex gap-2">
                      {user.isOnline && (
                        <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-black/50 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                      )}
                      {user.isPremium && (
                        <Badge className="bg-primary hover:bg-primary text-primary-foreground border-none h-5 px-1.5 text-[10px] rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]">
                          PRO
                        </Badge>
                      )}
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-4 transform transition-transform duration-300">
                      <div className="flex items-end justify-between">
                        <div>
                          <h3 className="text-white font-bold text-lg leading-tight flex items-center gap-1.5">
                            {user.displayName}
                            {user.age && <span className="text-white/80 font-normal">{user.age}</span>}
                          </h3>
                          {user.distanceKm !== null && (
                            <p className="text-white/70 text-xs font-medium mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {user.distanceKm < 1 ? "Under 1 km" : `${user.distanceKm} km away`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
