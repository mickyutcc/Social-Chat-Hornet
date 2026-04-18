import { useGetMe, useUpdateUser, getGetMeQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, Star, Camera } from "lucide-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const { data: me, isLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const updateUser = useUpdateUser();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [location, setLocation] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (me) {
      setDisplayName(me.displayName ?? "");
      setBio(me.bio ?? "");
      setAge(me.age ? String(me.age) : "");
      setLocation(me.location ?? "");
    }
  }, [me]);

  function handleSave() {
    if (!me) return;
    updateUser.mutate(
      {
        id: me.id,
        data: {
          displayName,
          bio: bio || null,
          age: age ? parseInt(age, 10) : null,
          location: location || null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      }
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-full overflow-y-auto pb-24 md:pb-6">
        <header className="px-6 pt-8 pb-6 border-b border-border/50">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your profile and preferences</p>
        </header>

        <div className="p-6 space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-primary/20 shadow-xl">
                <AvatarImage src={me?.avatarUrl ?? undefined} alt={me?.displayName} />
                <AvatarFallback className="text-3xl font-bold bg-secondary">
                  {me?.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <Camera className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-xl font-bold">{me?.displayName}</h2>
                {me?.isVerified && <CheckCircle className="w-5 h-5 text-primary fill-primary" />}
              </div>
              <p className="text-sm text-muted-foreground">@{me?.username}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                {me?.isPremium && (
                  <Badge className="bg-primary/20 text-primary border-primary/30 gap-1 text-xs">
                    <Star className="w-3 h-3" /> Premium Member
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="font-semibold text-lg border-b border-border pb-2">Profile Information</h3>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Display Name</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-12 rounded-2xl bg-secondary border-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people a bit about yourself..."
                className="rounded-2xl bg-secondary border-none focus-visible:ring-1 focus-visible:ring-primary resize-none min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Age</Label>
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Your age"
                  className="h-12 rounded-2xl bg-secondary border-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Location</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                  className="h-12 rounded-2xl bg-secondary border-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={updateUser.isPending}
            className="w-full h-12 rounded-2xl font-semibold text-base"
          >
            {saved ? "Saved!" : updateUser.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
