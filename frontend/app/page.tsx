import { Card } from "@/components/ui/card";

type Post = { _id: string; title: string; subtitle?: string; slug: string };

export default async function HomePage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
  const res = await fetch(`${apiBase}/posts/published`, { next: { revalidate: 60 } });
  const posts: any[] = res.ok ? await res.json() : [];
  const featured = posts.slice(0, 2);
  const latest = posts.slice(0, 6);
  return (
    <main className="mx-auto max-w-5xl px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-semibold tracking-tight">Premium Blog</h1>
        <a href="/trending" className="text-sm underline">Trending</a>
      </div>
      <p className="text-lg text-neutral-600 dark:text-neutral-300">Featured stories and latest posts.</p>

      <section className="grid gap-6 md:grid-cols-2">
        {featured.map(f => (
          <Card key={f._id} className="p-6 space-y-2">
            {(() => {
              const img = typeof f.imageUrl === "string" ? f.imageUrl : (typeof (f as any).coverImage === "string" ? (f as any).coverImage : "");
              const src = img && img.startsWith("http") ? img : (img ? `${apiBase}${img}` : "");
              return src ? <img src={src} alt="" className="h-40 w-full rounded object-cover mb-3" /> : null;
            })()}
            <h2 className="text-2xl font-medium">{f.title}</h2>
            {f.subtitle && <p className="text-base text-neutral-600 dark:text-neutral-300">{f.subtitle}</p>}
            <a href={`/posts/${f.slug}`} className="text-sm underline">Read</a>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Latest</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {latest.map(p => (
            <Card key={p._id} className="p-6 space-y-2">
              {(() => {
                const img = typeof p.imageUrl === "string" ? p.imageUrl : (typeof (p as any).coverImage === "string" ? (p as any).coverImage : "");
                const src = img && img.startsWith("http") ? img : (img ? `${apiBase}${img}` : "");
                return src ? <img src={src} alt="" className="h-32 w-full rounded object-cover mb-3" /> : null;
              })()}
              <h3 className="text-xl font-medium">{p.title}</h3>
              {p.subtitle && <p className="text-sm text-neutral-600 dark:text-neutral-300">{p.subtitle}</p>}
              <a href={`/posts/${p.slug}`} className="text-sm underline">Read</a>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
