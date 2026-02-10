"use client";
import * as React from "react";
import { Editor as TinyEditorReact } from "@tinymce/tinymce-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function wc(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function TinyEditor() {
  const [title, setTitle] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [rt, setRt] = React.useState(1);
  const [value, setValue] = React.useState("");
  const [banner, setBanner] = React.useState<string | null>(null);
  const [bannerFile, setBannerFile] = React.useState<File | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [categories, setCategories] = React.useState<Array<any>>([]);
  const [categoryId, setCategoryId] = React.useState<string>("");
  const [subCategoryId, setSubCategoryId] = React.useState<string>("");
  const apiKey = "491xzkwsor7cii5qun29606jvtrvqbx6xj8m24wjsk5t7pgz";
  const [faqs, setFaqs] = React.useState<Array<{ question: string; answer: string }>>([]);
  // Start clean: do not auto-load drafts
  React.useEffect(() => {}, []);
  React.useEffect(() => {
    const API = typeof window !== "undefined" ? (window as any).NEXT_PUBLIC_API_BASE || "http://localhost:8081" : "http://localhost:8081";
    fetch(`${API}/categories`)
      .then(r => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : (Array.isArray((data || {}).items) ? data.items : (Array.isArray((data || {}).data) ? data.data : []));
        setCategories(arr);
      })
      .catch(() => setCategories([]));
  }, []);
  function onChange(content: string, editor: any) {
    setValue(content);
    const text = editor.getContent({ format: "text" }) as string;
    setRt(Math.max(1, Math.round(wc(text) / 200)));
    const key = "tiny-draft";
    if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify({ title, subtitle, html: content, text, banner, categoryId, subCategoryId, faqs }));
  }
  function onBannerFile(file: File | null) {
    if (!file) return;
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      setBanner(src);
      const key = "tiny-draft";
      if (typeof window !== "undefined") {
        const saved = window.localStorage.getItem(key);
        const data = saved ? JSON.parse(saved) : {};
        window.localStorage.setItem(key, JSON.stringify({ ...data, banner: src }));
      }
    };
    reader.readAsDataURL(file);
  }
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900" data-theme="light">
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-12 items-center gap-4 px-6 py-3">
          <div className="col-span-8 flex items-center gap-3">
            <span className="text-sm font-medium">Write</span>
          </div>
          <div className="col-span-4 flex items-center justify-end gap-3">
            <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600">{rt} min read</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const key = "tiny-draft";
                if (typeof window !== "undefined") {
                  const saved = window.localStorage.getItem(key);
                  if (saved) {
                    const data = JSON.parse(saved);
                    setTitle(data.title || "");
                    setSubtitle(data.subtitle || "");
                    setValue(data.html || "");
                    setRt(Math.max(1, Math.round(wc(data.text || "") / 200)));
                    setBanner(data.banner || null);
                    setCategoryId(data.categoryId || "");
                    setSubCategoryId(data.subCategoryId || "");
                    setFaqs(Array.isArray(data.faqs) ? data.faqs : []);
                  }
                }
              }}
            >
              Load Draft
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTitle("");
                setSubtitle("");
                setValue("");
                setRt(1);
                setBanner(null);
                setBannerFile(null);
                setCategoryId("");
                setSubCategoryId("");
                setFaqs([]);
                const key = "tiny-draft";
                if (typeof window !== "undefined") window.localStorage.removeItem(key);
              }}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!categoryId) {
                  alert("Select a category");
                  return;
                }
                const API = typeof window !== "undefined" ? (window as any).NEXT_PUBLIC_API_BASE || "http://localhost:8081" : "http://localhost:8081";
                const token = typeof window !== "undefined" ? (window.localStorage.getItem("auth_token") || window.localStorage.getItem("jwt")) : null;
                if (!token) {
                  alert("Login required");
                  if (typeof window !== "undefined") window.location.href = "/admin/login";
                  return;
                }
                const payload = JSON.parse(atob(token.split(".")[1]));
                const authorId = payload?.sub;
                (async () => {
                  try {
                    const fd = new FormData();
                    fd.append("title", title || "Untitled");
                    if (subtitle) fd.append("subtitle", subtitle);
                    fd.append("content", value);
                    fd.append("authorId", authorId);
                    fd.append("category", categoryId);
                    if (bannerFile) fd.append("bannerImage", bannerFile);
                    if (faqs.length > 0) fd.append("faqs", JSON.stringify(faqs));
                    let res = await fetch(`${API}/posts`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` },
                      body: fd
                    });
                    if (res.status === 401) {
                      const rtok = typeof window !== "undefined" ? window.localStorage.getItem("refresh_token") : null;
                      if (rtok) {
                        const rres = await fetch(`${API}/auth/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: rtok }) });
                        const rdata = await rres.json();
                        if (rdata?.access_token) {
                          if (typeof window !== "undefined") {
                            window.localStorage.setItem("auth_token", rdata.access_token);
                            window.localStorage.setItem("refresh_token", rdata.refresh_token);
                          }
                          res = await fetch(`${API}/posts`, { method: "POST", headers: { Authorization: `Bearer ${rdata.access_token}` }, body: fd });
                        }
                      }
                    }
                    if (!res.ok) {
                      alert("Failed to create post");
                      return;
                    }
                    const post = await res.json();
                    let pub = await fetch(`${API}/posts/${post._id || post.id}/publish`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    if (pub.status === 401) {
                      const rtok = typeof window !== "undefined" ? window.localStorage.getItem("refresh_token") : null;
                      if (rtok) {
                        const rres = await fetch(`${API}/auth/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: rtok }) });
                        const rdata = await rres.json();
                        if (rdata?.access_token) {
                          if (typeof window !== "undefined") {
                            window.localStorage.setItem("auth_token", rdata.access_token);
                            window.localStorage.setItem("refresh_token", rdata.refresh_token);
                          }
                          pub = await fetch(`${API}/posts/${post._id || post.id}/publish`, { method: "POST", headers: { Authorization: `Bearer ${rdata.access_token}` } });
                        }
                      }
                    }
                    if (!pub.ok) {
                      alert("Failed to publish");
                      return;
                    }
                    if (typeof window !== "undefined") {
                      window.localStorage.removeItem("tiny-draft");
                      window.location.href = "/admin/posts";
                    }
                  } catch {
                    alert("Network error");
                  }
                })();
              }}
            >
              Publish
            </Button>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
              <div className="grid gap-3 sm:grid-cols-2 mb-4">
                <div>
                  <div className="text-xs text-neutral-600 mb-1">Category</div>
                  <select
                    className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none"
                    value={categoryId}
                    onChange={e => { setCategoryId(e.target.value); setSubCategoryId(""); }}
                  >
                    <option value="">Select a category</option>
                    {categories.filter((c: any) => !c.parentId).map((c: any) => (
                      <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="text-xs text-neutral-600 mb-1">Subcategory (optional)</div>
                  <select
                    className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none"
                    value={subCategoryId}
                    onChange={e => setSubCategoryId(e.target.value)}
                    disabled={!categoryId}
                  >
                    <option value="">Select a subcategory</option>
                    {categories.filter((c: any) => String(c.parentId) === String(categoryId)).map((c: any) => (
                      <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-4">
                {banner ? (
                  <div className="relative">
                    <img src={banner} alt="Banner" className="w-full h-56 md:h-64 lg:h-72 object-cover rounded-xl" />
                    <div className="absolute right-3 top-3 flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>Change</Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setBanner(null);
                        const key = "tiny-draft";
                        if (typeof window !== "undefined") {
                          const saved = window.localStorage.getItem(key);
                          const data = saved ? JSON.parse(saved) : {};
                          delete data.banner;
                          window.localStorage.setItem(key, JSON.stringify(data));
                        }
                      }}>Remove</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6">
                    <div>
                      <div className="text-sm font-medium">Banner image</div>
                      <div className="text-xs text-neutral-600">Recommended 16:9, at least 1200×675</div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>Upload</Button>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => onBannerFile(e.target.files?.[0] || null)} />
              </div>
              <Input
              id=""
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Title"
                style={{ background: "white" }}
            className="h-16 bg-white text-neutral-900 border-none shadow-none px-0 text-4xl font-semibold"
              />
              <Input
                value={subtitle}
                  style={{ background: "white" }}
                onChange={e => setSubtitle(e.target.value)}
                placeholder="Subtitle"
            className="mt-2 h-12 bg-white text-neutral-700 border-none shadow-none px-0 text-lg"
              />
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl">
              <TinyEditorReact
                value={value}
                apiKey={apiKey || "no-api-key"}
                init={{
                  height: "calc(100vh - 280px)",
                  width: "100%",
                  menubar: false,
                  statusbar: false,
                  toolbar_sticky: true,
                  toolbar_mode: "sliding",
                  branding: false,
                  plugins: "anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount fullscreen",
                  toolbar: "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough blockquote | align lineheight | numlist bullist indent outdent | link image media table | codesample | removeformat | fullscreen",
                  skin: "oxide",
                  content_css: "default",
                  content_style: "body{background:#ffffff; color:#111827; font-family:Inter,system-ui,sans-serif; font-size:16px; line-height:1.7; margin:1rem} h1{font-size:2rem; line-height:2.5rem; margin:1rem 0} h2{font-size:1.5rem; line-height:2rem; margin:.75rem 0} h3{font-size:1.25rem; line-height:1.75rem; margin:.5rem 0} img{max-width:100%; height:auto; border-radius:.75rem} table{width:100%; border-collapse:collapse} table, th, td{border:1px solid #e5e7eb} th,td{padding:.5rem} blockquote{border-left:4px solid #e5e7eb; padding-left:1rem; color:#6b7280}",
                  automatic_uploads: true,
                  images_upload_handler: (blobInfo: any) => Promise.resolve(`data:${blobInfo.blob().type};base64,${blobInfo.base64()}`),
                  file_picker_types: "image",
                  file_picker_callback: (cb: any) => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = () => {
                      const file = input.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => cb(reader.result);
                      reader.readAsDataURL(file);
                    };
                    input.click();
                  }
                }}
                onEditorChange={onChange}
              />
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Frequently Asked Questions</span>
                <Button
                  size="sm"
                  onClick={() => {
                    setFaqs(prev => [...prev, { question: "", answer: "" }]);
                    const key = "tiny-draft";
                    if (typeof window !== "undefined") {
                      const saved = window.localStorage.getItem(key);
                      const data = saved ? JSON.parse(saved) : {};
                      window.localStorage.setItem(key, JSON.stringify({ ...data, faqs: [...faqs, { question: "", answer: "" }] }));
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="mt-4 space-y-4">
                {faqs.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <Input
                      value={item.question}
                      onChange={e => {
                        const next = [...faqs];
                        next[idx] = { ...next[idx], question: e.target.value };
                        setFaqs(next);
                        const key = "tiny-draft";
                        if (typeof window !== "undefined") {
                          const saved = window.localStorage.getItem(key);
                          const data = saved ? JSON.parse(saved) : {};
                          window.localStorage.setItem(key, JSON.stringify({ ...data, faqs: next }));
                        }
                      }}
                      placeholder="Question"
                      className="bg-white"
                    />
                    <Input
                      value={item.answer}
                      onChange={e => {
                        const next = [...faqs];
                        next[idx] = { ...next[idx], answer: e.target.value };
                        setFaqs(next);
                        const key = "tiny-draft";
                        if (typeof window !== "undefined") {
                          const saved = window.localStorage.getItem(key);
                          const data = saved ? JSON.parse(saved) : {};
                          window.localStorage.setItem(key, JSON.stringify({ ...data, faqs: next }));
                        }
                      }}
                      placeholder="Answer"
                      className="bg-white"
                    />
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const next = faqs.filter((_, i) => i !== idx);
                          setFaqs(next);
                          const key = "tiny-draft";
                          if (typeof window !== "undefined") {
                            const saved = window.localStorage.getItem(key);
                            const data = saved ? JSON.parse(saved) : {};
                            window.localStorage.setItem(key, JSON.stringify({ ...data, faqs: next }));
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Preview</span>
                <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600">{rt} min read</span>
              </div>
              <div className="mt-4 h-[calc(100vh-320px)] overflow-auto">
                <article className="prose max-w-none">
                  {banner && <img src={banner} alt="Banner" className="w-full h-56 md:h-64 lg:h-72 object-cover rounded-xl" />}
                  {title && <h1 className="m-0">{title}</h1>}
                  {subtitle && <p className="mt-1 text-lg text-neutral-600">{subtitle}</p>}
                  <div dangerouslySetInnerHTML={{ __html: value }} />
                  {faqs.length > 0 && (
                    <div className="mt-8">
                      <h3>Frequently Asked Questions</h3>
                      <div className="space-y-3">
                        {faqs.map((item, idx) => (
                          <div key={idx}>
                            <div className="font-medium">{item.question}</div>
                            <div className="text-neutral-700">{item.answer}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
