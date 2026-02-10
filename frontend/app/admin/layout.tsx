"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, PencilLine, Users, Settings, FolderTree } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<{ name: string; role: "admin" | "team" } | null>(null);
  const pathname = usePathname();
  const isLoginRoute = pathname === "/admin/login";
  React.useEffect(() => {
    if (isLoginRoute) return; // allow login page without guard
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("auth_user") : null;
    const token = typeof window !== "undefined" ? (window.localStorage.getItem("auth_token") || window.localStorage.getItem("jwt")) : null;
    if (!saved || !token) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("auth_user");
        window.sessionStorage.setItem("post_login_redirect", window.location.pathname || "/admin");
        window.location.href = "/admin/login";
      }
      return;
    }
    try {
      const u = JSON.parse(saved);
      if (u && u.name && (u.role === "admin" || u.role === "team")) setUser(u);
      else {
        window.localStorage.removeItem("auth_user");
        window.sessionStorage.setItem("post_login_redirect", window.location.pathname || "/admin");
        window.location.href = "/admin/login";
      }
    } catch {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("auth_user");
        window.sessionStorage.setItem("post_login_redirect", window.location.pathname || "/admin");
        window.location.href = "/admin/login";
      }
    }
  }, [isLoginRoute]);
  if (isLoginRoute) return <>{children}</>;
  if (!user) return <div className="flex min-h-screen items-center justify-center text-sm text-neutral-600">Loading…</div>;
  const isAdmin = user.role === "admin";
  const nav = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard, adminOnly: false },
    { href: "/admin/posts", label: "Posts", icon: FileText, adminOnly: false },
    { href: "/admin/write", label: "Write", icon: PencilLine, adminOnly: false },
    { href: "/admin/team", label: "Team", icon: Users, adminOnly: true },
    { href: "/admin/categories", label: "Categories", icon: FolderTree, adminOnly: true },
    { href: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true }
  ];
  return (
    <div className="grid min-h-screen grid-cols-12 bg-neutral-50">
      <aside className="col-span-2 border-r border-neutral-200 bg-white">
        <div className="px-6 py-6">
          <div className="text-lg font-semibold">Admin Portal</div>
          <div className="mt-1 text-sm text-neutral-600">Signed in as {user.name} ({user.role})</div>
        </div>
        <nav className="px-3 pt-2 space-y-1">
          {nav.filter(n => (n.adminOnly ? isAdmin : true)).map(n => {
            const Icon = n.icon;
            const active = pathname === n.href;
            return (
              <a
                key={n.href}
                href={n.href}
                className={[
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
                  active ? "bg-neutral-100 text-neutral-900" : "hover:bg-neutral-100 text-neutral-700"
                ].join(" ")}
              >
                <Icon size={18} />
                <span>{n.label}</span>
              </a>
            );
          })}
        </nav>
        <div className="px-4 py-4">
          <Button
            variant="outline"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.localStorage.removeItem("auth_user");
                window.location.href = "/admin/login";
              }
            }}
          >
            Logout
          </Button>
        </div>
      </aside>
      <main className="col-span-10">{children}</main>
    </div>
  );
}
