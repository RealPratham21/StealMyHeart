"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Flame, Users, MessageCircle, User, Settings, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchMe, primaryPhotoUrl } from "@/lib/me";

const navItems = [
  { href: "/app", icon: Flame, label: "Discover" },
  { href: "/app/likes", icon: Heart, label: "Likes" },
  { href: "/app/matches", icon: Users, label: "Matches" },
  { href: "/app/messages", icon: MessageCircle, label: "Messages" },
  { href: "/app/profile", icon: User, label: "Profile" },
  { href: "/app/settings", icon: Settings, label: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [notifications] = useState(3);
  const [avatarSrc, setAvatarSrc] = useState("/placeholder-user.jpg");

  useEffect(() => {
    let cancelled = false;
    const refreshAvatar = () => {
      fetchMe().then((user) => {
        if (!cancelled && user) {
          setAvatarSrc(primaryPhotoUrl(user));
        }
      });
    };
    refreshAvatar();
    const onProfileUpdated = () => refreshAvatar();
    window.addEventListener("stealmyheart:profile-updated", onProfileUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("stealmyheart:profile-updated", onProfileUpdated);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-40 ${
          sidebarExpanded ? "w-56" : "w-16"
        }`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-sidebar-border px-3">
          <Link href="/app" className="flex items-center gap-2">
            <Heart className="w-7 h-7 text-primary fill-primary flex-shrink-0" />
            {sidebarExpanded && (
              <span className="font-bold text-sidebar-foreground whitespace-nowrap overflow-hidden">
                StealMyHeart
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <ul className="flex flex-col gap-1 px-2">
            {navItems.slice(0, 4).map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/app" && pathname?.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
                    {sidebarExpanded && (
                      <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Navigation */}
        <div className="py-4 border-t border-sidebar-border">
          <ul className="flex flex-col gap-1 px-2">
            {navItems.slice(4).map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
                    {sidebarExpanded && (
                      <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Expand toggle (mobile hint) */}
        <button
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className="absolute -right-3 top-20 w-6 h-6 bg-sidebar border border-sidebar-border rounded-full flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent transition-colors hidden md:flex"
        >
          {sidebarExpanded ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </aside>

      {/* Main content area */}
      <div className={`flex-1 transition-all duration-300 ${sidebarExpanded ? "ml-56" : "ml-16"}`}>
        {/* Top bar */}
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">
              {navItems.find((item) => 
                pathname === item.href || (item.href !== "/app" && pathname?.startsWith(item.href))
              )?.label || "Discover"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
            
            <Link href="/app/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img
                src={avatarSrc}
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover border-2 border-primary/20"
              />
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
