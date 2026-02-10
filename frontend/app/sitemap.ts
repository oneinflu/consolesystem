export default async function sitemap() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const res = await fetch(`${apiBase}/posts/published`, { next: { revalidate: 300 } });
  const posts: Array<{ slug: string; publishedAt?: string }> = res.ok ? await res.json() : [];
  const base = [
    { url: `${site}/`, lastModified: new Date().toISOString() },
    { url: `${site}/trending`, lastModified: new Date().toISOString() }
  ];
  const urls = posts.map(p => ({
    url: `${site}/posts/${p.slug}`,
    lastModified: p.publishedAt || new Date().toISOString()
  }));
  return [...base, ...urls];
}
