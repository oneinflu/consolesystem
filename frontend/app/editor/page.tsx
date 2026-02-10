"use client";
import * as React from "react";
import { TinyEditor } from "@/components/editor/tiny-editor";

export default function EditorPage() {
  return (
    <main className="w-full h-screen bg-white">
      <TinyEditor />
    </main>
  );
}
