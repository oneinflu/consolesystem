"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";

type Post = {
  _id: string;
  slug: string;
  title: string;
  publishedAt?: string;
  content?: { blocks?: string };
};

export default function ArticlesPage() {
  const [posts, setPosts] = React.useState<Post[]>([]);
  React.useEffect(() => {
    const API = typeof window !== "undefined" ? (window as any).NEXT_PUBLIC_API_BASE || "http://localhost:8081" : "http://localhost:8081";
    fetch(`${API}/posts/published`)
      .then(r => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : (Array.isArray((data || {}).items) ? data.items : (Array.isArray((data || {}).data) ? data.data : []));
        setPosts(arr);
      })
      .catch(() => setPosts([]));
  }, []);
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-semibold tracking-tight">Published Articles</h1>
        <div className="flex items-center gap-2">
          <a href="/author" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm">Author Portal</a>
          <a href="/editor" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm">Write New</a>
        </div>
      </div>

      {posts.length === 0 && (
        <Card className="mt-8 p-8">
          <p className="text-neutral-600">No articles yet. Publish from the editor.</p>
        </Card>
      )}

      {posts.length > 0 && (
        <section className="mt-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map(p => (
              <Card key={p._id} className="p-5 space-y-2">
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <div className="flex items-center gap-3 text-xs text-neutral-500">
                  {p.publishedAt ? <span>{new Date(p.publishedAt).toLocaleDateString()}</span> : null}
                </div>
                <div className="pt-1">
                  <a href={`/articles/${p.slug}`} className="text-sm font-medium text-blue-600">Open</a>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
