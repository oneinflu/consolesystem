"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  async function register() {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name })
      });
      const data = await res.json();
      if (data.access_token) {
        window.localStorage.setItem("access_token", data.access_token);
        window.localStorage.setItem("refresh_token", data.refresh_token);
        window.location.href = "/author/dashboard";
      } else {
        alert("Registration failed");
      }
    } catch {
      alert("Register error");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="mx-auto max-w-sm px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Register</h1>
      <div className="space-y-3">
        <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <Input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <Input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <Button onClick={register} disabled={loading}>{loading ? "..." : "Create Account"}</Button>
      </div>
      <p className="text-sm">
        Already have an account? <a href="/auth/login" className="underline">Login</a>
      </p>
    </main>
  );
}
