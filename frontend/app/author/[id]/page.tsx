import { Card } from "@/components/ui/card";

type Post = { _id: string; title: string; subtitle?: string; slug: string; authorId: string };

export default async function AuthorProfile({ params }: { params: { id: string } }) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
  const postsRes = await fetch(`${apiBase}/posts`, { next: { revalidate: 60 } });
  const all: Post[] = postsRes.ok ? await postsRes.json() : [];
  const mine = all.filter(p => p.authorId === params.id);
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Author</h1>
        <p className="text-sm text-neutral-500">ID: {params.id}</p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        {mine.map(r => (
          <Card key={r._id} className="p-6 space-y-2">
            <h3 className="text-xl font-medium">{r.title}</h3>
            {r.subtitle && <p className="text-sm text-neutral-600 dark:text-neutral-300">{r.subtitle}</p>}
            <a href={`/posts/${r.slug}`} className="text-sm underline">Read</a>
          </Card>
        ))}
        {mine.length === 0 && <p className="text-sm text-neutral-600 dark:text-neutral-300">No posts from this author.</p>}
      </div>
    </main>
  );
}
