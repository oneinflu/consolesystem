"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<"admin" | "team">("admin");
  React.useEffect(() => {
    // If already logged in, send to dashboard
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("auth_user") : null;
    const token = typeof window !== "undefined" ? (window.localStorage.getItem("auth_token") || window.localStorage.getItem("jwt")) : null;
    if (saved && token && typeof window !== "undefined") {
      try {
        const u = JSON.parse(saved);
        if (u && u.name && (u.role === "admin" || u.role === "team")) {
          window.location.href = "/admin";
        }
      } catch {
        // invalid saved format; clear to avoid redirect loop
        window.localStorage.removeItem("auth_user");
      }
    }
  }, []);
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-12 bg-neutral-50">
      <section className="hidden lg:block lg:col-span-7 relative">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=1600&auto=format&fit=crop" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-black/20 to-transparent" />
        </div>
        <div className="relative z-10 p-10 text-white">
          <div className="text-4xl font-semibold">Admin Portal</div>
          <p className="mt-3 max-w-xl text-neutral-200">Manage content, your team, and site settings with a clean, premium dashboard.</p>
        </div>
      </section>
      <section className="lg:col-span-5 flex items-center justify-center p-8">
        <Card className="w-full max-w-md p-6 space-y-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Sign in</h1>
            <p className="text-sm text-neutral-600">Use your email and password</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-neutral-600">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-neutral-600">Password</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-neutral-600">Role</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input type="radio" name="role" checked={role === "admin"} onChange={() => setRole("admin")} />
                <span>Admin</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="role" checked={role === "team"} onChange={() => setRole("team")} />
                <span>Team</span>
              </label>
            </div>
          </div>
          <Button
            onClick={() => {
              const e = email.trim().toLowerCase();
              const p = password;
              if (!e || !p) return alert("Enter email and password");
              const API = typeof window !== "undefined" ? (window as any).NEXT_PUBLIC_API_BASE || "http://localhost:8081" : "http://localhost:8081";
              (async () => {
                try {
                  let tokens: any;
                  let res = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: e, password: p }) });
                  let data = await res.json();
                  if (data?.error === "invalid_credentials") {
                    await fetch(`${API}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: e, password: p, name: e.split("@")[0] }) });
                    res = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: e, password: p }) });
                    data = await res.json();
                  }
                  tokens = data;
                  if (!tokens?.access_token) {
                    alert("Login failed");
                    return;
                  }
                  const payload = JSON.parse(atob(tokens.access_token.split(".")[1]));
                  const userId = payload?.sub;
                  const user = { name: e.split("@")[0], role, email: e, id: userId };
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem("auth_user", JSON.stringify(user));
                    window.localStorage.setItem("auth_token", tokens.access_token);
                    window.localStorage.setItem("refresh_token", tokens.refresh_token);
                    const next = window.sessionStorage.getItem("post_login_redirect") || "/admin";
                    window.sessionStorage.removeItem("post_login_redirect");
                    window.location.href = next;
                  }
                } catch {
                  alert("Network error");
                }
              })();
            }}
          >
            Sign in
          </Button>
          <div className="text-xs text-neutral-600">
            Admin credentials can be set in Settings after login.
          </div>
        </Card>
      </section>
    </main>
  );
}
