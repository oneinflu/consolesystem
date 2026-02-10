"use client";
import * as React from "react";

export function SlashMenu({ open, onSelect }: { open: boolean; onSelect: (cmd: string) => void }) {
  if (!open) return null;
  const items = [
    { k: "h1", t: "Heading 1" },
    { k: "h2", t: "Heading 2" },
    { k: "blockquote", t: "Quote" },
    { k: "bulletList", t: "Bulleted List" },
    { k: "orderedList", t: "Numbered List" },
    { k: "codeBlock", t: "Code Block" },
    { k: "image", t: "Image" },
    { k: "youtube", t: "YouTube Embed" },
    { k: "callout", t: "Callout" },
    { k: "table", t: "Table 3x3" }
  ];
  return (
    <div className="absolute z-20 mt-2 w-56 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
      {items.map(i => (
        <button
          key={i.k}
          className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
          onMouseDown={e => {
            e.preventDefault();
            onSelect(i.k);
          }}
        >
          {i.t}
        </button>
      ))}
    </div>
  );
}
