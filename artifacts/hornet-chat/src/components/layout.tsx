import { Link, useLocation } from "wouter";
import { MessageCircle, Compass, Rss, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Compass, label: "Explore" },
    { href: "/feed", icon: Rss, label: "Feed" },
    { href: "/messages", icon: MessageCircle, label: "Messages" },
    { href: "/profile/1", icon: User, label: "Profile" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Compass className="text-primary-foreground w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-primary">Hornet</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href) && item.href !== "/profile/1") || (item.href === "/profile/1" && location === "/profile/1");
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 cursor-pointer group relative overflow-hidden",
                    isActive 
                      ? "text-primary bg-primary/10 font-medium" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <item.icon className={cn("w-6 h-6 z-10 transition-transform group-hover:scale-110", isActive && "text-primary")} />
                  <span className="z-10">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-t border-border flex items-center justify-around px-2 z-50 pb-safe">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href) && item.href !== "/profile/1") || (item.href === "/profile/1" && location === "/profile/1");
          return (
            <Link key={item.href} href={item.href}>
              <div className="flex flex-col items-center justify-center w-16 h-full cursor-pointer relative">
                {isActive && (
                  <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-full shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                )}
                <item.icon 
                  className={cn(
                    "w-6 h-6 transition-all duration-300", 
                    isActive ? "text-primary scale-110" : "text-muted-foreground"
                  )} 
                />
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
