"use client";
import * as React from "react";

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const [post, setPost] = React.useState<any>(null);
  React.useEffect(() => {
    const API = typeof window !== "undefined" ? (window as any).NEXT_PUBLIC_API_BASE || "http://localhost:8081" : "http://localhost:8081";
    fetch(`${API}/posts/${params.slug}`)
      .then(r => r.json())
      .then(setPost)
      .catch(() => setPost(null));
  }, [params.slug]);
  if (!post) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-neutral-600">Article not found.</p>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-4xl font-semibold">{post.title}</h1>
      <div className="mt-6 prose max-w-none" dangerouslySetInnerHTML={{ __html: post?.content?.blocks || "" }} />
    </main>
  );
}
