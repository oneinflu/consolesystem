"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Member = { id: string; name: string; email: string; phone?: string; password: string; role: "team" };

export default function AdminTeamPage() {
  const [members, setMembers] = React.useState<Member[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Member | null>(null);
  const [form, setForm] = React.useState<{ name: string; email: string; phone: string }>({ name: "", email: "", phone: "" });

  React.useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("admin_team") : null;
    setMembers(saved ? JSON.parse(saved) : []);
  }, []);
  function save(m: Member[]) {
    setMembers(m);
    if (typeof window !== "undefined") window.localStorage.setItem("admin_team", JSON.stringify(m));
  }
  function removeMember(id: string) {
    const next = members.filter(m => m.id !== id);
    save(next);
  }
  function onSubmit() {
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    if (!name || !email) return;
    if (editing) {
      const next = members.map(m => (m.id === editing.id ? { ...m, name, email, phone } : m));
      save(next);
    } else {
      const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
      const next = [{ id, name, email, phone, password: "123456", role: "team" as const }, ...members];
      save(next);
    }
    setOpen(false);
    setEditing(null);
    setForm({ name: "", email: "", phone: "" });
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Team</h1>
        <a href="/admin" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm">Back to Dashboard</a>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-lg font-medium">Members</div>
        <Button size="sm" onClick={() => { setEditing(null); setForm({ name: "", email: "", phone: "" }); setOpen(true); }}>Add Member</Button>
      </div>

      <Card className="mt-4 p-0 overflow-hidden">
        {members.length === 0 ? (
          <div className="p-6">
            <p className="text-neutral-600">No members yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="border-b border-neutral-200 px-4 py-3 text-left text-sm font-medium text-neutral-700">Name</th>
                  <th className="border-b border-neutral-200 px-4 py-3 text-left text-sm font-medium text-neutral-700">Email</th>
                  <th className="border-b border-neutral-200 px-4 py-3 text-left text-sm font-medium text-neutral-700">Phone</th>
                  <th className="border-b border-neutral-200 px-4 py-3 text-left text-sm font-medium text-neutral-700">Role</th>
                  <th className="border-b border-neutral-200 px-4 py-3 text-right text-sm font-medium text-neutral-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id} className="hover:bg-neutral-50">
                    <td className="border-b border-neutral-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-xs font-medium">
                          {m.name.trim().slice(0, 1).toUpperCase()}
                        </div>
                        <div className="text-sm font-medium">{m.name}</div>
                      </div>
                    </td>
                    <td className="border-b border-neutral-200 px-4 py-3 text-sm">{m.email}</td>
                    <td className="border-b border-neutral-200 px-4 py-3 text-sm">{m.phone || "—"}</td>
                    <td className="border-b border-neutral-200 px-4 py-3">
                      <span className="rounded-full border border-neutral-300 px-2 py-0.5 text-xs text-neutral-600">team</span>
                    </td>
                    <td className="border-b border-neutral-200 px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditing(m);
                            setForm({ name: m.name, email: m.email, phone: m.phone || "" });
                            setOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => removeMember(m.id)}>Remove</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="text-lg font-semibold">{editing ? "Edit Member" : "Add Member"}</div>
            <div className="space-y-2">
              <label className="text-sm text-neutral-600">Name</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-neutral-600">Email</label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-neutral-600">Phone</label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 000 1234" />
            </div>
            <div className="text-xs text-neutral-600">Password is set to 123456</div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => { setOpen(false); setEditing(null); }}>Cancel</Button>
              <Button onClick={onSubmit}>{editing ? "Save" : "Add"}</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
