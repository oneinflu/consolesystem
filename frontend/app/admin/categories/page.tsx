"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminCategoriesPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [parentId, setParentId] = React.useState<string>("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<any | null>(null);
  const API = typeof window !== "undefined" ? ((window as any).NEXT_PUBLIC_API_BASE || "http://localhost:8081") : "http://localhost:8081";
  function slugify(s: string) {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  async function load() {
    try {
      const res = await fetch(`${API}/categories`);
      const data = await res.json();
      const arr = Array.isArray(data)
        ? data
        : (Array.isArray((data || {}).items) ? data.items : (Array.isArray((data || {}).data) ? data.data : []));
      setItems(arr);
    } catch {
      setItems([]);
    }
  }
  React.useEffect(() => { load(); }, []);
  async function addCategory(name: string, parent?: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const payload: any = { name: trimmed, slug: slugify(trimmed) };
    if (parent) payload.parentId = parent;
    await fetch(`${API}/categories`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    await load();
  }
  async function updateCategory(id: string, name: string, parent?: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const payload: any = { name: trimmed, slug: slugify(trimmed) };
    if (parent) payload.parentId = parent;
    else payload.parentId = null;
    await fetch(`${API}/categories/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    await load();
  }
  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setAddOpen(true)}>Add Category</Button>
          <a href="/admin" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm">Back</a>
        </div>
      </div>
      <Card className="mt-6 p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-neutral-50">
              <tr>
                <th className="border-b border-neutral-200 px-4 py-3 text-left text-sm font-medium text-neutral-700">Name</th>
                <th className="border-b border-neutral-200 px-4 py-3 text-left text-sm font-medium text-neutral-700">Slug</th>
                <th className="border-b border-neutral-200 px-4 py-3 text-left text-sm font-medium text-neutral-700">Parent</th>
                <th className="border-b border-neutral-200 px-4 py-3 text-left text-sm font-medium text-neutral-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i._id || i.id} className="hover:bg-neutral-50">
                  <td className="border-b border-neutral-200 px-4 py-3 text-sm font-medium">{i.name}</td>
                  <td className="border-b border-neutral-200 px-4 py-3 text-sm">{i.slug}</td>
                  <td className="border-b border-neutral-200 px-4 py-3 text-sm">
                    {(() => {
                      const parent = items.find(p => String(p._id || p.id) === String(i.parentId));
                      return parent ? parent.name : "—";
                    })()}
                  </td>
                  <td className="border-b border-neutral-200 px-4 py-3 text-sm">
                    <Button variant="outline" size="sm" onClick={() => { setEditItem(i); setParentId(i.parentId || ""); setEditOpen(true); }}>Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {addOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setAddOpen(false)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
            <Card className="p-6 space-y-4">
              <div className="text-lg font-semibold">Add Category</div>
              <AddCategoryForm
                roots={items.filter(i => !i.parentId)}
                onCancel={() => setAddOpen(false)}
                onSubmit={async (n, p) => { await addCategory(n, p); setAddOpen(false); }}
              />
            </Card>
          </div>
        </div>
      )}
      {editOpen && editItem && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setEditOpen(false); setEditItem(null); }} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
            <Card className="p-6 space-y-4">
              <div className="text-lg font-semibold">Edit Category</div>
              <EditCategoryForm
                item={editItem}
                roots={items.filter(i => !i.parentId)}
                onCancel={() => { setEditOpen(false); setEditItem(null); }}
                onSubmit={async (n, p) => { await updateCategory(editItem._id || editItem.id, n, p); setEditOpen(false); setEditItem(null); }}
              />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function AddCategoryForm({ roots, onSubmit, onCancel }: { roots: any[]; onSubmit: (name: string, parentId?: string) => void; onCancel: () => void }) {
  const [name, setName] = React.useState("");
  const [parentId, setParentId] = React.useState<string>("");
  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs text-neutral-600 mb-1">Name</div>
        <Input placeholder="Category name" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <div className="text-xs text-neutral-600 mb-1">Parent (optional)</div>
        <select
          className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none"
          value={parentId}
          onChange={e => setParentId(e.target.value)}
        >
          <option value="">None</option>
          {roots.map(i => (
            <option key={i._id || i.id} value={i._id || i.id}>{i.name}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSubmit(name, parentId || undefined)}>Add</Button>
      </div>
    </div>
  );
}

function EditCategoryForm({ item, roots, onSubmit, onCancel }: { item: any; roots: any[]; onSubmit: (name: string, parentId?: string) => void; onCancel: () => void }) {
  const [name, setName] = React.useState(item?.name || "");
  const [parentId, setParentId] = React.useState<string>(item?.parentId || "");
  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs text-neutral-600 mb-1">Name</div>
        <Input placeholder="Category name" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <div className="text-xs text-neutral-600 mb-1">Parent (optional)</div>
        <select
          className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none"
          value={parentId}
          onChange={e => setParentId(e.target.value)}
        >
          <option value="">None</option>
          {roots.map(i => (
            <option key={i._id || i.id} value={i._id || i.id}>{i.name}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSubmit(name, parentId || undefined)}>Save</Button>
      </div>
    </div>
  );
}
