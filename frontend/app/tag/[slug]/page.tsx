import { Card } from "@/components/ui/card";

type Post = { _id: string; title: string; subtitle?: string; slug: string; tags?: string[] };
type Tag = { _id: string; name: string; slug: string };

export default async function TagPage({ params }: { params: { slug: string } }) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
  const [tagsRes, postsRes] = await Promise.all([
    fetch(`${apiBase}/tags`, { next: { revalidate: 300 } }),
    fetch(`${apiBase}/posts/published`, { next: { revalidate: 60 } })
  ]);
  const tags: Tag[] = tagsRes.ok ? await tagsRes.json() : [];
  const tag = tags.find(t => t.slug === params.slug);
  const all: Post[] = postsRes.ok ? await postsRes.json() : [];
  const tagId = tag ? (tag as any)._id : undefined;
  const list = all.filter(p => (tagId ? (p.tags || []).includes(tagId) : false));
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <h1 className="text-3xl font-semibold">{tag?.name || "Tag"}</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {list.map(r => (
          <Card key={r._id} className="p-6 space-y-2">
            {(() => {
              const anyR: any = r as any;
              const img = typeof anyR.imageUrl === "string" ? anyR.imageUrl : (typeof anyR.coverImage === "string" ? anyR.coverImage : "");
              const src = img && img.startsWith("http") ? img : (img ? `${apiBase}${img}` : "");
              return src ? <img src={src} alt="" className="h-40 w-full rounded object-cover mb-3" /> : null;
            })()}
            <h3 className="text-xl font-medium">{r.title}</h3>
            {r.subtitle && <p className="text-sm text-neutral-600 dark:text-neutral-300">{r.subtitle}</p>}
            <a href={`/posts/${r.slug}`} className="text-sm underline">Read</a>
          </Card>
        ))}
        {list.length === 0 && <p className="text-sm text-neutral-600 dark:text-neutral-300">No posts for this tag.</p>}
      </div>
    </main>
  );
}
