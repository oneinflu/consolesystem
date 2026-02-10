"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminSettingsPage() {
  const [siteName, setSiteName] = React.useState("");
  const [adminEmail, setAdminEmail] = React.useState("");
  const [adminPassword, setAdminPassword] = React.useState("");
  React.useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("site_settings") : null;
    if (saved) {
      const s = JSON.parse(saved);
      setSiteName(s.siteName || "");
    }
    const credsStr = typeof window !== "undefined" ? window.localStorage.getItem("admin_credentials") : null;
    if (credsStr) {
      const c = JSON.parse(credsStr);
      setAdminEmail(c.email || "");
      setAdminPassword(c.password || "");
    }
  }, []);
  function save() {
    const payload = { siteName };
    if (typeof window !== "undefined") window.localStorage.setItem("site_settings", JSON.stringify(payload));
    alert("Saved");
  }
  function saveCreds() {
    const email = adminEmail.trim().toLowerCase();
    const password = adminPassword;
    if (!email || !password) return alert("Enter email and password");
    if (typeof window !== "undefined") window.localStorage.setItem("admin_credentials", JSON.stringify({ email, password }));
    alert("Admin credentials saved");
  }
  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>
      <Card className="mt-6 p-6 space-y-4">
        <div>
          <label className="text-sm text-neutral-600">Site Name</label>
          <Input value={siteName} onChange={e => setSiteName(e.target.value)} placeholder="Premium Blog" />
        </div>
        <Button onClick={save}>Save</Button>
      </Card>
      <Card className="mt-6 p-6 space-y-4">
        <div className="text-lg font-medium">Admin Login</div>
        <div>
          <label className="text-sm text-neutral-600">Admin Email</label>
          <Input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@example.com" />
        </div>
        <div>
          <label className="text-sm text-neutral-600">Admin Password</label>
          <Input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <Button onClick={saveCreds}>Save Admin Credentials</Button>
        <div className="text-xs text-neutral-600">These credentials are used by the Admin role on the login page.</div>
      </Card>
    </div>
  );
}
