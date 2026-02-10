"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminPostsPage() {
  const [posts, setPosts] = React.useState<any[]>([]);
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [categories, setCategories] = React.useState<any[]>([]);
  const [catFilter, setCatFilter] = React.useState<string>("");
  const [subFilter, setSubFilter] = React.useState<string>("");
  const [authorFilter, setAuthorFilter] = React.useState<string>("");
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081") as string;
  const [user, setUser] = React.useState<{ id: string; role: "admin" | "team" } | null>(null);
  React.useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? window.localStorage.getItem("auth_user") : null;
      if (saved) {
        const u = JSON.parse(saved);
        if (u && u.id && (u.role === "admin" || u.role === "team")) setUser({ id: u.id, role: u.role });
      }
    } catch {}
    fetch(`${apiBase}/posts`)
      .then(r => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : (Array.isArray((data || {}).items) ? data.items : (Array.isArray((data || {}).data) ? data.data : []));
        setPosts(arr);
      })
      .catch(() => setPosts([]));
    fetch(`${apiBase}/categories`)
      .then(r => r.json())
      .then((data) => {
        const arr = Array.isArray(data)
          ? data
          : (Array.isArray((data || {}).items) ? data.items : (Array.isArray((data || {}).data) ? data.data : []));
        setCategories(arr);
      })
      .catch(() => setCategories([]));
  }, []);
  React.useEffect(() => {
    if (user?.role === "team") setAuthorFilter(String(user.id));
    else setAuthorFilter("");
  }, [user]);
  const authors = React.useMemo(() => {
    const set = new Set<string>();
    for (const p of posts) {
      const aid = String((p.authorId && (p.authorId._id || p.authorId)) || "");
      if (aid) set.add(aid);
    }
    return Array.from(set);
  }, [posts]);
  async function removePost(id: string) {
    if (!confirm("Delete this post?")) return;
    const token = typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;
    await fetch(`${apiBase}/posts/${id}`, { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {} });
    setPosts(p => p.filter(x => (x._id || x.id) !== id));
  }
  async function toggleActive(id: string, nextStatus: "inactive" | "active") {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;
    if (!token) return alert("Login required");
    await fetch(`${apiBase}/posts/${id}/moderate`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) });
    setPosts(p => p.map(x => ((x._id || x.id) === id ? { ...x, moderationStatus: nextStatus } : x)));
  }
  const filtered = posts.filter(p => {
    if (catFilter && String(p.category || "") !== String(catFilter)) return false;
    if (authorFilter) {
      const aid = String((p.authorId && (p.authorId._id || p.authorId)) || "");
      if (aid !== String(authorFilter)) return false;
    }
    if (user?.role === "team") {
      const aid = String((p.authorId && (p.authorId._id || p.authorId)) || "");
      if (aid !== String(user.id)) return false;
    }
    return true;
  });
  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage Posts</h1>
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-neutral-200 p-1">
            <button
              className={["rounded-lg px-3 py-1 text-sm", view === "grid" ? "bg-neutral-100" : ""].join(" ")}
              onClick={() => setView("grid")}
            >
              Grid
            </button>
            <button
              className={["rounded-lg px-3 py-1 text-sm", view === "list" ? "bg-neutral-100" : ""].join(" ")}
              onClick={() => setView("list")}
            >
              List
            </button>
          </div>
          <a href="/admin/write" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm">Write</a>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="text-xs text-neutral-600 mb-1">Category</div>
          <select
            className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none"
            value={catFilter}
            onChange={e => { setCatFilter(e.target.value); setSubFilter(""); }}
          >
            <option value="">All</option>
            {categories.filter((c: any) => !c.parentId).map((c: any) => (
              <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-xs text-neutral-600 mb-1">Subcategory</div>
          <select
            className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none"
            value={subFilter}
            onChange={e => setSubFilter(e.target.value)}
            disabled={!catFilter}
          >
            <option value="">All</option>
            {categories.filter((c: any) => String(c.parentId) === String(catFilter)).map((c: any) => (
              <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-xs text-neutral-600 mb-1">Author</div>
          <select
            className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none"
            value={authorFilter}
            onChange={e => setAuthorFilter(e.target.value)}
            disabled={user?.role === "team"}
          >
            <option value="">All</option>
            {authors.map(aid => (
              <option key={aid} value={aid}>{aid}</option>
            ))}
          </select>
        </div>
      </div>
      {view === "grid" ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 && (
            <Card className="p-6">
              <p className="text-neutral-600">No posts yet</p>
            </Card>
          )}
          {filtered.map(p => {
            const id = p._id || p.id;
            const base = apiBase;
            const raw = (typeof p.imageUrl === "string" && p.imageUrl) ? p.imageUrl : (typeof p.coverImage === "string" ? p.coverImage : "");
            const img = raw ? (raw.startsWith("http") ? raw : `${base}${raw}`) : "";
            return (
              <Card key={id} className="overflow-hidden">
                {img && (
                  <div className="h-40 w-full overflow-hidden border-b border-neutral-200 bg-neutral-100">
                    <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </div>
                )}
                <div className="p-5 space-y-2">
                  <div className="text-lg font-semibold">{p.title}</div>
                  <div className="flex items-center gap-3 text-xs text-neutral-500">
                    {p.status ? <span>{p.status}</span> : null}
                    {p.createdAt ? <span>• {new Date(p.createdAt).toLocaleDateString()}</span> : null}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {/* No view site option */}
                    <Button variant="outline" size="sm" onClick={() => removePost(id)}>Remove</Button>
                    {user?.role === "admin" ? (
                      <Button variant="secondary" size="sm" onClick={() => toggleActive(id, p.moderationStatus === "active" ? "inactive" : "active")}>{p.moderationStatus === "active" ? "Set Inactive" : "Set Active"}</Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="mt-6 p-0 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-6">
              <p className="text-neutral-600">No posts yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="border-b border-neutral-200 px-4 py-3 text-left text-sm font-medium text-neutral-700">Banner</th>
                    <th className="border-b border-neutral-200 px-4 py-3 text-left text-sm font-medium text-neutral-700">Title</th>
                    <th className="border-b border-neutral-200 px-4 py-3 text-left text-sm font-medium text-neutral-700">Subtitle</th>
                    <th className="border-b border-neutral-200 px-4 py-3 text-left text-sm font-medium text-neutral-700">Status</th>
                    <th className="border-b border-neutral-200 px-4 py-3 text-left text-sm font-medium text-neutral-700">Read</th>
                    <th className="border-b border-neutral-200 px-4 py-3 text-left text-sm font-medium text-neutral-700">Date</th>
                    <th className="border-b border-neutral-200 px-4 py-3 text-right text-sm font-medium text-neutral-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const id = p._id || p.id;
                    
                    const raw = (typeof p.imageUrl === "string" && p.coverImage) ? p.coverImage : (typeof p.coverImage === "string" ? p.coverImage : "");
                   
                    return (
                      <tr key={id} className="hover:bg-neutral-50">
                        <td className="border-b border-neutral-200 px-4 py-3">
                          {raw ? <img src={raw} alt="" className="h-10 w-16 rounded object-cover" /> : "—"}
                        </td>
                        <td className="border-b border-neutral-200 px-4 py-3 text-sm font-medium">{p.title}</td>
                        <td className="border-b border-neutral-200 px-4 py-3 text-sm text-neutral-600">—</td>
                        <td className="border-b border-neutral-200 px-4 py-3 text-sm">{p.moderationStatus || "inactive"}</td>
                        <td className="border-b border-neutral-200 px-4 py-3 text-sm">—</td>
                        <td className="border-b border-neutral-200 px-4 py-3 text-sm">{p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}</td>
                        <td className="border-b border-neutral-200 px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {/* No view site option */}
                            <Button variant="outline" size="sm" onClick={() => removePost(id)}>Remove</Button>
                            {user?.role === "admin" ? (
                              <Button variant="secondary" size="sm" onClick={() => toggleActive(id, p.moderationStatus === "active" ? "inactive" : "active")}>{p.moderationStatus === "active" ? "Set Inactive" : "Set Active"}</Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
