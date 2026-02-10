import { Card } from "@/components/ui/card";

type Post = { _id: string; title: string; subtitle?: string; slug: string };

export const metadata = { title: "Trending" };

export default async function TrendingPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
  const res = await fetch(`${apiBase}/posts/published`, { next: { revalidate: 60 } });
  const posts: Post[] = res.ok ? await res.json() : [];
  async function withCounts() {
    const counts = await Promise.all(
      posts.map(p =>
        fetch(`${apiBase}/likes/count/${p._id}`).then(r => r.json()).catch(() => ({ count: 0 }))
      )
    );
    return posts
      .map((p, i) => ({ ...p, count: counts[i]?.count || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }
  const ranked = await withCounts();
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <h1 className="text-3xl font-semibold">Trending</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {ranked.map(r => (
          <Card key={r._id} className="p-6 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-medium">{r.title}</h3>
              <span className="text-xs rounded-full border px-2 py-1">♥ {r.count}</span>
            </div>
            {r.subtitle && <p className="text-sm text-neutral-600 dark:text-neutral-300">{r.subtitle}</p>}
            <a href={`/posts/${r.slug}`} className="text-sm underline">Read</a>
          </Card>
        ))}
      </div>
    </main>
  );
}
