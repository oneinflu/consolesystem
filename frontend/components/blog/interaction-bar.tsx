'use client';
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, Share2, Heart } from "lucide-react";

export function InteractionBar({ postId, apiBase }: { postId: string; apiBase: string }) {
  const [count, setCount] = React.useState<number>(0);
  const token = typeof window !== "undefined" ? window.localStorage.getItem("access_token") || "" : "";
  const userId = typeof window !== "undefined" ? window.localStorage.getItem("user_id") || "" : "";

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`${apiBase}/likes/count/${postId}`);
        const data = await res.json();
        if (mounted) setCount(data.count || 0);
      } catch {}
    }
    load();
    return () => {
      mounted = false;
    };
  }, [apiBase, postId]);

  async function clap() {
    try {
      await fetch(`${apiBase}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, postId })
      });
      setCount(c => c + 1);
    } catch {}
  }

  async function bookmark() {
    try {
      await fetch(`${apiBase}/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, postId })
      });
    } catch {}
  }

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={clap}><Heart className="mr-2 h-4 w-4" /> {count}</Button>
      <Button variant="outline" onClick={bookmark}><Bookmark className="mr-2 h-4 w-4" /> Bookmark</Button>
      <Button variant="outline" onClick={share}><Share2 className="mr-2 h-4 w-4" /> Share</Button>
    </div>
  );
}
