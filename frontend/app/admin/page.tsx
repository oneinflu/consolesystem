"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, FileText, Tags, FolderTree } from "lucide-react";

export default function AdminOverviewPage() {
  const [published, setPublished] = React.useState<any[]>([]);
  const [allPosts, setAllPosts] = React.useState<any[]>([]);
  const [tags, setTags] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [user, setUser] = React.useState<{ id: string; role: "admin" | "team" } | null>(null);
  React.useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8081";
    try {
      const saved = typeof window !== "undefined" ? window.localStorage.getItem("auth_user") : null;
      if (saved) {
        const u = JSON.parse(saved);
        if (u && u.id && (u.role === "admin" || u.role === "team")) setUser({ id: u.id, role: u.role });
      }
    } catch {}
    async function load() {
      try {
        const [pubRes, allRes, tagsRes, catRes] = await Promise.all([
          fetch(`${API}/posts/published`),
          fetch(`${API}/posts`),
          fetch(`${API}/tags`),
          fetch(`${API}/categories`)
        ]);
        const [pub, all, t, c] = await Promise.all([pubRes.json(), allRes.json(), tagsRes.json(), catRes.json()]);
        setPublished(Array.isArray(pub?.items ?? pub) ? (pub.items ?? pub) : []);
        setAllPosts(Array.isArray(all?.items ?? all) ? (all.items ?? all) : []);
        setTags(Array.isArray(t) ? t : []);
        setCategories(Array.isArray(c) ? c : []);
      } catch {}
    }
    load();
  }, []);
  const filteredPublished = React.useMemo(() => {
    if (user?.role === "team") {
      return published.filter(p => String((p.authorId?._id || p.authorId || "")) === String(user.id));
    }
    return published;
  }, [published, user]);
  const totalRead = published.reduce((s, p) => s + (p.readingTime || p.readMinutes || 0), 0);
  const latest = filteredPublished[0];
  const authorsMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of filteredPublished) {
      const aid = (p.authorId?._id || p.authorId || "unknown") as string;
      map[aid] = (map[aid] ?? 0) + 1;
    }
    return map;
  }, [filteredPublished]);
  return (
    <div className="px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Overview</h1>
        <div className="flex items-center gap-2">
          <a href="/admin/write" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm">Write</a>
          {/* No view site option */}
        </div>
      </div>
      <section className="grid gap-6 sm:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm text-neutral-600"><FileText size={16} /> Published</div>
          <div className="mt-1 text-3xl font-semibold">{filteredPublished.length}</div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm text-neutral-600"><Activity size={16} /> Total Read Time</div>
          <div className="mt-1 text-3xl font-semibold">{totalRead} min</div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm text-neutral-600"><Tags size={16} /> Tags</div>
          <div className="mt-1 text-3xl font-semibold">{tags.length}</div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm text-neutral-600"><FolderTree size={16} /> Categories</div>
          <div className="mt-1 text-3xl font-semibold">{categories.length}</div>
        </Card>
      </section>
      <section className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Latest Post</h2>
            <a href="/admin/posts" className="text-sm font-medium text-blue-600">Manage</a>
          </div>
          {!latest ? (
            <p className="mt-2 text-neutral-600">No posts yet</p>
          ) : (
            <div className="mt-4">
              <div className="text-lg font-medium">{latest.title}</div>
              <div className="text-sm text-neutral-600">{latest.subtitle}</div>
              <div className="mt-2 text-sm text-neutral-500">{latest.readingTime || latest.readMinutes || 0} min read</div>
              <div className="mt-2">
                {/* No view site option */}
              </div>
            </div>
          )}
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button onClick={() => { window.location.href = "/editor"; }}>Write</Button>
            <Button variant="secondary" onClick={() => { window.location.href = "/admin/posts"; }}>Manage Posts</Button>
            {user?.role === "admin" ? (
              <Button variant="outline" onClick={() => { window.location.href = "/admin/team"; }}>Manage Team</Button>
            ) : null}
          </div>
        </Card>
      </section>
      <section>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Who posted what</h2>
          </div>
          <div className="mt-4">
            {Object.keys(authorsMap).length === 0 && <p className="text-neutral-600">No data yet</p>}
            {Object.entries(authorsMap).map(([authorId, count]) => (
              <div key={authorId} className="flex items-center justify-between border-b border-neutral-200 py-2">
                <div className="text-sm text-neutral-700">Author: {authorId}</div>
                <div className="text-sm font-medium">{count} post(s)</div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
