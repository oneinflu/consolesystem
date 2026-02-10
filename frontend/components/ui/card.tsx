'use client';
import * as React from "react";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={["card", className].filter(Boolean).join(" ")}>{children}</div>;
}
