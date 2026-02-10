"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Post = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  banner?: string | null;
  html: string;
  excerpt?: string;
  readMinutes?: number;
  createdAt?: string;
};

export default function AuthorDashboard() {
  const [published, setPublished] = React.useState<Post[]>([]);
  const [draft, setDraft] = React.useState<any>(null);
  React.useEffect(() => {
    const postsStr = typeof window !== "undefined" ? window.localStorage.getItem("published-posts") : null;
    const posts = postsStr ? JSON.parse(postsStr) : [];
    setPublished(posts);
    const draftStr = typeof window !== "undefined" ? window.localStorage.getItem("tiny-draft") : null;
    setDraft(draftStr ? JSON.parse(draftStr) : null);
  }, []);

  const stats = React.useMemo(() => {
    const count = published.length;
    const minutes = published.reduce((s, p) => s + (p.readMinutes || 0), 0);
    const latest = published[0]?.createdAt ? new Date(published[0].createdAt).toLocaleString() : null;
    return { count, minutes, latest };
  }, [published]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Author Portal</h1>
        <div className="flex items-center gap-2">
          <a href="/editor" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm">New Story</a>
          <a href="/articles" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm">Published</a>
        </div>
      </div>

      <section className="mt-6 grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="text-sm text-neutral-600">Published</div>
          <div className="mt-2 text-3xl font-semibold">{stats.count}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-neutral-600">Total Read Time</div>
          <div className="mt-2 text-3xl font-semibold">{stats.minutes} min</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-neutral-600">Latest Published</div>
          <div className="mt-2 text-lg">{stats.latest || "—"}</div>
        </Card>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Current Draft</h2>
            <a href="/editor" className="text-sm font-medium text-blue-600">Continue</a>
          </div>
          {!draft && (
            <p className="mt-2 text-neutral-600">No draft yet. Start a new story.</p>
          )}
          {draft && (
            <div className="mt-4 space-y-2">
              {draft.banner && <img src={draft.banner} alt="" className="h-36 w-full rounded-lg object-cover" />}
              <div className="text-lg font-medium">{draft.title || "Untitled"}</div>
              {draft.subtitle && <div className="text-neutral-600">{draft.subtitle}</div>}
              <div className="flex items-center gap-3 text-sm text-neutral-500">
                <span>{Math.max(1, Math.round(((draft.text || "").trim().split(/\s+/).filter(Boolean).length) / 200))} min read</span>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => { window.location.href = "/editor"; }}>Edit</Button>
                <Button variant="outline" size="sm" onClick={() => {
                  if (typeof window !== "undefined") {
                    window.localStorage.removeItem("tiny-draft");
                    setDraft(null);
                  }
                }}>Discard</Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button onClick={() => { window.location.href = "/editor"; }}>Write New</Button>
            <Button variant="secondary" onClick={() => { window.location.href = "/articles"; }}>View Published</Button>
            <Button variant="outline" onClick={() => {
              if (typeof window !== "undefined") {
                window.localStorage.removeItem("published-posts");
                setPublished([]);
              }
            }}>Clear Published (local)</Button>
          </div>
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Recent Published</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {published.length === 0 && (
            <Card className="p-6">
              <p className="text-neutral-600">No published articles yet.</p>
            </Card>
          )}
          {published.map(p => (
            <Card key={p.id} className="overflow-hidden">
              {p.banner && <img src={p.banner} alt="" className="h-36 w-full object-cover" />}
              <div className="p-6 space-y-1">
                <div className="text-lg font-semibold">{p.title}</div>
                {p.subtitle && <div className="text-neutral-600">{p.subtitle}</div>}
                <div className="flex items-center gap-3 text-sm text-neutral-500">
                  {p.readMinutes ? <span>{p.readMinutes} min read</span> : null}
                  {p.createdAt ? <span>• {new Date(p.createdAt).toLocaleString()}</span> : null}
                </div>
                <div className="pt-2">
                  <a href={`/articles/${p.slug}`} className="text-sm font-medium text-blue-600">Open</a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
