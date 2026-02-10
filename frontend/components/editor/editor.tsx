"use client";
import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import * as TiptapReact from "@tiptap/react";
const BubbleMenu: any = (TiptapReact as any).BubbleMenu;
const FloatingMenu: any = (TiptapReact as any).FloatingMenu;
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Heading from "@tiptap/extension-heading";
import YouTube from "@tiptap/extension-youtube";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Callout } from "./callout";
import { SlashMenu } from "./slash-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function getTextFromJSON(json: any): string {
  if (!json) return "";
  if (typeof json === "string") return json;
  const stack = [json];
  let out = "";
  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;
    if (node.text) out += node.text + " ";
    const c = node.content || node.children || [];
    for (let i = c.length - 1; i >= 0; i--) stack.push(c[i]);
  }
  return out.trim();
}

function wordsCount(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function DraftEditor({ apiBase, token, authorId }: { apiBase?: string; token?: string; authorId?: string }) {
  const [title, setTitle] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [preview, setPreview] = React.useState(false);
  const [slashOpen, setSlashOpen] = React.useState(false);
  const [draftId, setDraftId] = React.useState<string | null>(null);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Write your story..." }),
      Heading.configure({ levels: [1, 2, 3] }),
      YouTube.configure({ controls: true }),
      Image,
      Link.configure({ openOnClick: true, autolink: true, linkOnPaste: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Callout
    ],
    content: { type: "doc", content: [{ type: "paragraph" }] },
    onUpdate: () => {
      setDirty(true);
    },
    immediatelyRender: false
  });

  const [dirty, setDirty] = React.useState(false);
  React.useEffect(() => {
    const key = "draft-current";
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    if (saved) {
      const data = JSON.parse(saved);
      setTitle(data.title || "");
      setSubtitle(data.subtitle || "");
      if (editor) editor.commands.setContent(data.content || { type: "doc", content: [{ type: "paragraph" }] });
    }
  }, [editor]);

  React.useEffect(() => {
    let mounted = true;
    async function ensureDraft() {
      if (!apiBase || !token || !authorId || draftId) return;
      try {
        const res = await fetch(`${apiBase}/drafts`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ authorId })
        });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setDraftId(data._id || data.id || null);
      } catch {}
    }
    ensureDraft();
    return () => {
      mounted = false;
    };
  }, [apiBase, token, authorId, draftId]);

  React.useEffect(() => {
    const iv = setInterval(async () => {
      if (!editor || !dirty) return;
      const content = editor.getJSON();
      const payload = { title, subtitle, content };
      const key = "draft-current";
      if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(payload));
      setDirty(false);
      if (apiBase && token && draftId) {
        try {
          await fetch(`${apiBase}/drafts/${draftId}/autosave`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload)
          });
        } catch {}
      }
    }, 3000);
    return () => clearInterval(iv);
  }, [editor, dirty, title, subtitle, apiBase, token, draftId]);

  const rt = React.useMemo(() => {
    const text = getTextFromJSON(editor?.getJSON());
    const w = wordsCount(text);
    return Math.max(1, Math.round(w / 200));
  }, [editor, editor?.state]);
 
  React.useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom as HTMLElement;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/") setSlashOpen(true);
      else if (e.key === "Escape") setSlashOpen(false);
    };
    dom.addEventListener("keydown", handler);
    return () => {
      dom.removeEventListener("keydown", handler);
    };
  }, [editor]);

  async function publish() {
    if (!apiBase || !token || !authorId || !editor) {
      alert("Login required");
      return;
    }
    const content = editor.getJSON();
    try {
      const res = await fetch(`${apiBase}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title || "Untitled", content, authorId })
      });
      if (!res.ok) {
        alert("Failed to create post");
        return;
      }
      const post = await res.json();
      await fetch(`${apiBase}/posts/${post._id}/publish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (typeof window !== "undefined") window.location.href = `/posts/${post.slug}`;
    } catch {
      alert("Publish error");
    }
  }
  function runSlash(cmd: string) {
    if (!editor) return;
    setSlashOpen(false);
    if (cmd === "h1") editor.chain().focus().toggleHeading({ level: 1 }).run();
    else if (cmd === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run();
    else if (cmd === "blockquote") editor.chain().focus().toggleBlockquote().run();
    else if (cmd === "bulletList") editor.chain().focus().toggleBulletList().run();
    else if (cmd === "orderedList") editor.chain().focus().toggleOrderedList().run();
    else if (cmd === "codeBlock") editor.chain().focus().toggleCodeBlock().run();
    else if (cmd === "table") editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    else if (cmd === "image") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        editor.chain().focus().setImage({ src: url }).run();
      };
      input.click();
    } else if (cmd === "youtube") {
      const url = prompt("YouTube URL");
      if (url) editor.chain().focus().setYoutubeVideo({ src: url, width: 640, height: 360 }).run();
    } else if (cmd === "callout") {
      editor.chain().focus().insertContent({ type: "callout", attrs: { type: "info" }, content: [{ type: "paragraph" }] }).run();
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white/70 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70">
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">{rt} min read</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPreview(v => !v)}>{preview ? "Edit" : "Preview"}</Button>
          <Button onClick={publish}>Publish</Button>
        </div>
      </div>
      <div className="space-y-4 py-8">
        <input
          value={title}
          onChange={e => {
            setTitle(e.target.value);
            setDirty(true);
          }}
          placeholder="Title"
          className="w-full bg-transparent text-4xl font-semibold outline-none placeholder:text-neutral-400"
        />
        <input
          value={subtitle}
          onChange={e => {
            setSubtitle(e.target.value);
            setDirty(true);
          }}
          placeholder="Subtitle"
          className="w-full bg-transparent text-xl text-neutral-600 outline-none dark:text-neutral-300 placeholder:text-neutral-400"
        />
        <div className="relative">
          {!preview && (
            <>
              {BubbleMenu ? (
                <BubbleMenu editor={editor} tippyOptions={{ duration: 150 }}>
                <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
                  <Button variant="secondary" size="sm" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleBold().run(); }}>B</Button>
                  <Button variant="secondary" size="sm" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleItalic().run(); }}>I</Button>
                  <Button variant="secondary" size="sm" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleStrike().run(); }}>S</Button>
                  <Button variant="secondary" size="sm" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleCode().run(); }}>Code</Button>
                  <Button variant="secondary" size="sm" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 1 }).run(); }}>H1</Button>
                  <Button variant="secondary" size="sm" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 2 }).run(); }}>H2</Button>
                  <Button variant="secondary" size="sm" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 3 }).run(); }}>H3</Button>
                  <LinkControls editor={editor} />
                  <TableControls editor={editor} />
                </div>
                </BubbleMenu>
              ) : null}
              {FloatingMenu ? (
                <FloatingMenu editor={editor} tippyOptions={{ duration: 150 }}>
                  <Button variant="secondary" size="sm" onMouseDown={e => { e.preventDefault(); setSlashOpen(true); }}>+</Button>
                </FloatingMenu>
              ) : null}
              <EditorContent
                editor={editor}
                onKeyDown={e => {
                  if (e.key === "/") setSlashOpen(true);
                  else if (e.key === "Escape") setSlashOpen(false);
                }}
                className="prose prose-neutral max-w-none dark:prose-invert min-h-64 p-4 border border-neutral-200 rounded-xl bg-white text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
              />
              <SlashMenu open={slashOpen} onSelect={runSlash} />
            </>
          )}
          {preview && (
            <div className="prose prose-neutral max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: editor?.getHTML() || "" }} />
          )}
        </div>
      </div>
    </div>
  );
}

export function SimpleEditor() {
  const [title, setTitle] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [preview, setPreview] = React.useState(false);
  const [rt, setRt] = React.useState(1);
  const ref = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const key = "simple-draft";
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    if (saved) {
      const data = JSON.parse(saved);
      setTitle(data.title || "");
      setSubtitle(data.subtitle || "");
      if (ref.current) ref.current.innerHTML = data.html || "";
    }
  }, []);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => {
      const text = el.innerText || "";
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      setRt(Math.max(1, Math.round(words / 200)));
      const key = "simple-draft";
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify({ title, subtitle, html: el.innerHTML }));
      }
    };
    el.addEventListener("input", handler);
    return () => el.removeEventListener("input", handler);
  }, [title, subtitle]);
  function focus() {
    ref.current?.focus();
  }
  function cmd(command: string, value?: string) {
    focus();
    document.execCommand(command, false, value);
  }
  function formatBlock(tag: string) {
    cmd("formatBlock", tag);
  }
  function insertHTML(html: string) {
    focus();
    document.execCommand("insertHTML", false, html);
  }
  function setLink() {
    const url = prompt("Link URL");
    if (!url) return;
    cmd("createLink", url);
  }
  function insertImage() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      insertHTML(`<img src="${url}" style="max-width:100%; border-radius:0.75rem;" />`);
    };
    input.click();
  }
  function insertTable() {
    const rows = 3, cols = 3;
    let html = '<table><tbody>';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) html += '<td>&nbsp;</td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    insertHTML(html);
  }
  function insertCodeBlock() {
    insertHTML('<pre><code></code></pre>');
  }
  function clearFormat() {
    cmd("removeFormat");
  }
  return (
    <div className="mx-auto max-w-3xl px-6">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white/70 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70">
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">{rt} min read</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPreview(v => !v)}>{preview ? "Edit" : "Preview"}</Button>
        </div>
      </div>
      <div className="space-y-4 py-8">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full bg-transparent text-4xl font-semibold outline-none placeholder:text-neutral-400"
        />
        <input
          value={subtitle}
          onChange={e => setSubtitle(e.target.value)}
          placeholder="Subtitle"
          className="w-full bg-transparent text-xl text-neutral-600 outline-none dark:text-neutral-300 placeholder:text-neutral-400"
        />
        {!preview && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => cmd("bold")}>Bold</Button>
              <Button variant="secondary" size="sm" onClick={() => cmd("italic")}>Italic</Button>
              <Button variant="secondary" size="sm" onClick={() => cmd("underline")}>Underline</Button>
              <Button variant="secondary" size="sm" onClick={() => formatBlock("h1")}>H1</Button>
              <Button variant="secondary" size="sm" onClick={() => formatBlock("h2")}>H2</Button>
              <Button variant="secondary" size="sm" onClick={() => formatBlock("h3")}>H3</Button>
              <Button variant="secondary" size="sm" onClick={() => formatBlock("blockquote")}>Quote</Button>
              <Button variant="secondary" size="sm" onClick={() => cmd("insertUnorderedList")}>Bulleted</Button>
              <Button variant="secondary" size="sm" onClick={() => cmd("insertOrderedList")}>Numbered</Button>
              <Button variant="secondary" size="sm" onClick={insertCodeBlock}>Code</Button>
              <Button variant="secondary" size="sm" onClick={setLink}>Link</Button>
              <Button variant="secondary" size="sm" onClick={insertImage}>Image</Button>
              <Button variant="secondary" size="sm" onClick={insertTable}>Table</Button>
              <Button variant="outline" size="sm" onClick={clearFormat}>Clear</Button>
            </div>
            <div
              ref={ref}
              contentEditable
              className="editable prose prose-neutral max-w-none dark:prose-invert min-h-64 p-4 border border-neutral-200 rounded-xl bg-white text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
              data-placeholder="Write your story..."
            />
          </div>
        )}
        {preview && (
          <div
            className="prose prose-neutral max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: ref.current?.innerHTML || "" }}
          />
        )}
      </div>
    </div>
  );
}
function LinkControls({ editor }: { editor: any }) {
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState("");
  return (
    <div className="flex items-center gap-1">
      <Button variant="secondary" size="sm" onMouseDown={e => { e.preventDefault(); setOpen(v => !v); }}>Link</Button>
      {open && (
        <div className="flex items-center gap-1">
          <Input className="h-9 w-40" placeholder="https://" value={url} onChange={e => setUrl(e.target.value)} />
          <Button variant="outline" size="sm" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().setLink({ href: url }).run(); setOpen(false); }}>Set</Button>
          <Button variant="outline" size="sm" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().unsetLink().run(); setOpen(false); }}>Unset</Button>
        </div>
      )}
    </div>
  );
}

function TableControls({ editor }: { editor: any }) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="secondary" size="sm" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); }}>Table</Button>
      <Button variant="secondary" size="sm" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().addColumnAfter().run(); }}>+Col</Button>
      <Button variant="secondary" size="sm" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().addRowAfter().run(); }}>+Row</Button>
      <Button variant="secondary" size="sm" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().deleteColumn().run(); }}>Del Col</Button>
      <Button variant="secondary" size="sm" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().deleteRow().run(); }}>Del Row</Button>
      <Button variant="secondary" size="sm" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().deleteTable().run(); }}>Delete</Button>
    </div>
  );
}
