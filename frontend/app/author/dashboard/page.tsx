"use client";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Eye, Edit3, Archive, Plus } from "lucide-react";

type Post = {
  _id: string;
  title: string;
  subtitle?: string;
  slug: string;
  status: "draft" | "published" | "scheduled";
  authorId: string;
  publishedAt?: string;
};

type Draft = { _id: string; title?: string; subtitle?: string; authorId: string };
type Revision = { _id: string; title?: string; createdAt: string };

export default function AuthorDashboard() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL!;
  const token = typeof window !== "undefined" ? window.localStorage.getItem("access_token") || "" : "";
  const authorId = typeof window !== "undefined" ? window.localStorage.getItem("user_id") || "" : "";

  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [drafts, setDrafts] = React.useState<Draft[]>([]);
  const [revisions, setRevisions] = React.useState<Revision[]>([]);
  const [tab, setTab] = React.useState<"my" | "drafts" | "published" | "scheduled" | "revisions">("my");

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [allPostsRes, publishedRes] = await Promise.all([
          fetch(`${apiBase}/posts`),
          fetch(`${apiBase}/posts/published`)
        ]);
        const allPosts: Post[] = await allPostsRes.json();
        const published: Post[] = await publishedRes.json();
        const myPosts = allPosts.filter(p => p.authorId === authorId);
        setPosts([...myPosts.filter(p => p.status !== "published"), ...published.filter(p => p.authorId === authorId)]);

        const draftsRes = await fetch(`${apiBase}/drafts/${authorId}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
        if (draftsRes && draftsRes.ok) {
          const d = await draftsRes.json();
          setDrafts(Array.isArray(d) ? d : []);
        }
      } catch {
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [apiBase, token, authorId]);

  const filteredPosts = posts.filter(p => (query ? p.title.toLowerCase().includes(query.toLowerCase()) : true));
  const filteredDrafts = drafts.filter(d => (query ? (d.title || "").toLowerCase().includes(query.toLowerCase()) : true));

  async function publish(id: string) {
    await fetch(`${apiBase}/posts/${id}/publish`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  }
  async function schedule(id: string) {
    const at = prompt("Schedule ISO datetime (e.g., 2026-02-10T09:00:00.000Z)");
    if (!at) return;
    await fetch(`${apiBase}/posts/${id}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ publishedAt: at })
    });
  }
  async function archive(id: string) {
    await fetch(`${apiBase}/posts/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setPosts(ps => ps.filter(p => p._id !== id));
  }

  function SectionTabs() {
    const tabs: Array<{ k: typeof tab; t: string }> = [
      { k: "my", t: "My Posts" },
      { k: "drafts", t: "Drafts" },
      { k: "published", t: "Published" },
      { k: "scheduled", t: "Scheduled" },
      { k: "revisions", t: "Revisions" }
    ];
    return (
      <div className="flex items-center gap-2">
        {tabs.map(x => (
          <Button key={x.k} variant={tab === x.k ? "default" : "secondary"} onClick={() => setTab(x.k)}>
            {x.t}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Author Dashboard</h1>
        <Button onClick={() => (window.location.href = "/editor")}><Plus className="h-4 w-4 mr-2" /> Create New</Button>
      </div>
      <div className="flex items-center justify-between gap-4">
        <SectionTabs />
        <div className="flex items-center gap-2">
          <Input placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} className="w-64" />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 space-y-4">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {tab === "my" && (
            <motion.div layout className="grid gap-6 md:grid-cols-2">
              {filteredPosts.map(p => (
                <Card key={p._id} className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-medium">{p.title}</h3>
                    <span className="text-xs rounded-full border px-2 py-1 text-neutral-600 dark:text-neutral-300">
                      {p.status}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">{p.subtitle || "No subtitle"}</p>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => (window.location.href = `/editor?post=${p._id}`)}><Edit3 className="h-4 w-4 mr-2" /> Edit</Button>
                    <Button variant="outline" onClick={() => (window.location.href = `/posts/${p.slug}`)}><Eye className="h-4 w-4 mr-2" /> Preview</Button>
                    <Button onClick={() => publish(p._id)}>Publish</Button>
                    <Button variant="secondary" onClick={() => schedule(p._id)}><CalendarDays className="h-4 w-4 mr-2" /> Schedule</Button>
                    <Button variant="outline" onClick={() => archive(p._id)}><Archive className="h-4 w-4 mr-2" /> Archive</Button>
                  </div>
                </Card>
              ))}
              {filteredPosts.length === 0 && <p className="text-sm text-neutral-600 dark:text-neutral-300">No posts yet.</p>}
            </motion.div>
          )}

          {tab === "drafts" && (
            <motion.div layout className="grid gap-6 md:grid-cols-2">
              {filteredDrafts.map(d => (
                <Card key={d._id} className="p-6 space-y-3">
                  <h3 className="text-xl font-medium">{d.title || "Untitled draft"}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">{d.subtitle || ""}</p>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => (window.location.href = `/editor?draft=${d._id}`)}><Edit3 className="h-4 w-4 mr-2" /> Edit</Button>
                    <Button variant="outline" onClick={() => (window.location.href = `/editor?draft=${d._id}&preview=1`)}><Eye className="h-4 w-4 mr-2" /> Preview</Button>
                  </div>
                </Card>
              ))}
              {filteredDrafts.length === 0 && <p className="text-sm text-neutral-600 dark:text-neutral-300">No drafts yet.</p>}
            </motion.div>
          )}

          {tab === "published" && (
            <motion.div layout className="grid gap-6 md:grid-cols-2">
              {filteredPosts.filter(p => p.status === "published").map(p => (
                <Card key={p._id} className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-medium">{p.title}</h3>
                    <span className="text-xs rounded-full border px-2 py-1 text-neutral-600 dark:text-neutral-300">published</span>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">{p.subtitle || ""}</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => (window.location.href = `/posts/${p.slug}`)}><Eye className="h-4 w-4 mr-2" /> View</Button>
                    <Button variant="secondary" onClick={() => (window.location.href = `/editor?post=${p._id}`)}><Edit3 className="h-4 w-4 mr-2" /> Edit</Button>
                  </div>
                </Card>
              ))}
            </motion.div>
          )}

          {tab === "scheduled" && (
            <motion.div layout className="grid gap-6 md:grid-cols-2">
              {filteredPosts.filter(p => p.status === "scheduled").map(p => (
                <Card key={p._id} className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-medium">{p.title}</h3>
                    <span className="text-xs rounded-full border px-2 py-1 text-neutral-600 dark:text-neutral-300">scheduled</span>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">{p.subtitle || ""}</p>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => publish(p._id)}>Publish now</Button>
                    <Button variant="secondary" onClick={() => schedule(p._id)}><CalendarDays className="h-4 w-4 mr-2" /> Reschedule</Button>
                    <Button variant="outline" onClick={() => archive(p._id)}><Archive className="h-4 w-4 mr-2" /> Archive</Button>
                  </div>
                </Card>
              ))}
            </motion.div>
          )}

          {tab === "revisions" && (
            <motion.div layout className="space-y-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-300">Open a post to see its revision history.</p>
              {/* For brevity, we can add a modal listing on edit page; here omitted */}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </main>
  );
}
