'use client';
import * as React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = theme === "light" ? "dark" : "light";
  return (
    <Button
      variant="secondary"
      aria-label="Toggle theme"
      onClick={() => {
        setTheme(next);
        if (typeof document !== "undefined") document.documentElement.setAttribute("data-theme", next);
        if (typeof window !== "undefined") window.localStorage.setItem("theme", next);
      }}
    >
      {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
}
