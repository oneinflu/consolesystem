"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function decodeJwt(token: string) {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return json;
  } catch {
    return null;
  }
}

export default function LoginPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  async function login() {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.access_token) {
        const payload = decodeJwt(data.access_token);
        const userId = payload?.sub || "";
        window.localStorage.setItem("access_token", data.access_token);
        window.localStorage.setItem("refresh_token", data.refresh_token);
        window.localStorage.setItem("user_id", userId);
        window.location.href = "/author/dashboard";
      } else {
        alert("Invalid credentials");
      }
    } catch {
      alert("Login error");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="mx-auto max-w-sm px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Login</h1>
      <div className="space-y-3">
        <Input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <Input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <Button onClick={login} disabled={loading}>{loading ? "..." : "Login"}</Button>
      </div>
      <p className="text-sm">
        No account? <a href="/auth/register" className="underline">Register</a>
      </p>
    </main>
  );
}
