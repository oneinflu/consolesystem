import * as cheerio from "cheerio";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import YouTube from "@tiptap/extension-youtube";
import { InteractionBar } from "@/components/blog/interaction-bar";
import { Card } from "@/components/ui/card";

type Post = {
  _id: string;
  title: string;
  subtitle?: string;
  slug: string;
  content: any;
  tags?: string[];
  category?: string;
  status: "draft" | "published" | "scheduled";
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
};

function wordsCountFromJSON(json: any): number {
  if (!json) return 0;
  const stack = [json];
  let w = 0;
  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;
    if (node.text) w += node.text.trim().split(/\s+/).filter(Boolean).length;
    const c = node.content || [];
    for (let i = c.length - 1; i >= 0; i--) stack.push(c[i]);
  }
  return w;
}

export async function generateMetadata(props: any) {
  const { slug } = await props.params;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const res = await fetch(`${apiBase}/posts/${slug}`, { next: { revalidate: 60 } });
  if (!res.ok) return {};
  const post: Post = await res.json();
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.subtitle || "";
  const url = `${site}/posts/${post.slug}`;
  const ogImage = post.ogImage || "";
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: ogImage ? [ogImage] : [] }
  };
}

export default async function BlogPage({ params }: { params: { slug: string } }) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
  const res = await fetch(`${apiBase}/posts/${params.slug}`, { next: { revalidate: 60 } });
  if (!res.ok) return <main className="mx-auto max-w-3xl px-6 py-10">Post not found</main>;
  const post: Post = await res.json();

  const html = generateHTML(post.content, [StarterKit, Heading.configure({ levels: [1, 2, 3] }), Image, Link, YouTube]);
  const $ = cheerio.load(html);
  const headings: Array<{ id: string; text: string; level: number }> = [];
  $("h1, h2, h3").each((_, el) => {
    const text = $(el).text();
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    $(el).attr("id", id);
    const tag = el.tagName.toLowerCase();
    const level = tag === "h1" ? 1 : tag === "h2" ? 2 : 3;
    headings.push({ id, text, level });
  });
  $("img").each((_, el) => {
    $(el).attr("loading", "lazy");
    $(el).attr("decoding", "async");
  });
  const rendered = $.html();

  const words = wordsCountFromJSON(post.content);
  const readingTime = Math.max(1, Math.round(words / 200));

  const publishedRes = await fetch(`${apiBase}/posts/published`, { next: { revalidate: 60 } });
  const allPublished: Post[] = publishedRes.ok ? await publishedRes.json() : [];
  const related = allPublished
    .filter(p => p.slug !== post.slug)
    .slice(0, 4);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 space-y-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold">{post.title}</h1>
        {post.subtitle && <p className="text-lg text-neutral-600 dark:text-neutral-300">{post.subtitle}</p>}
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{readingTime} min read</p>
      </header>

      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        <nav className="sticky top-24 h-max">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Contents</p>
          <ul className="space-y-2 text-sm">
            {headings.map(h => (
              <li key={h.id} className={h.level === 1 ? "font-medium" : h.level === 2 ? "pl-3" : "pl-6"}>
                <a href={`#${h.id}`} className="text-neutral-700 hover:underline dark:text-neutral-300">{h.text}</a>
              </li>
            ))}
          </ul>
        </nav>
        <article className="prose prose-neutral max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: rendered }} />
      </div>

      <InteractionBar postId={post._id} apiBase={apiBase} />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Related posts</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {related.map(r => (
            <Card key={r._id} className="p-6 space-y-2">
              <h3 className="text-xl font-medium">{r.title}</h3>
              {r.subtitle && <p className="text-sm text-neutral-600 dark:text-neutral-300">{r.subtitle}</p>}
              <a href={`/posts/${r.slug}`} className="text-sm text-neutral-900 underline dark:text-neutral-100">Read</a>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
