import { Card } from "@/components/ui/card";

type Post = { _id: string; title: string; subtitle?: string; slug: string; category?: string };
type Category = { _id: string; name: string; slug: string };

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
  const [catRes, postsRes] = await Promise.all([
    fetch(`${apiBase}/categories`, { next: { revalidate: 300 } }),
    fetch(`${apiBase}/posts/published`, { next: { revalidate: 60 } })
  ]);
  const cats: Category[] = catRes.ok ? await catRes.json() : [];
  const category = cats.find(c => c.slug === params.slug);
  const all: Post[] = postsRes.ok ? await postsRes.json() : [];
  const list = all.filter(p => (category ? p.category === (category as any)._id : false));
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <h1 className="text-3xl font-semibold">{category?.name || "Category"}</h1>
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
        {list.length === 0 && <p className="text-sm text-neutral-600 dark:text-neutral-300">No posts in this category.</p>}
      </div>
    </main>
  );
}
