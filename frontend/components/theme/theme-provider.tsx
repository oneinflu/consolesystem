'use client';
import * as React from "react";

type Theme = "light" | "dark";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>("light");

  React.useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("theme") as Theme | null : null;
    const initial = stored ?? "light";
    setTheme(initial);
    if (typeof document !== "undefined") document.documentElement.setAttribute("data-theme", initial);
    if (typeof window !== "undefined") {
      const base = (window as any).NEXT_PUBLIC_API_BASE;
      if (!base) (window as any).NEXT_PUBLIC_API_BASE = "http://localhost:8081";
    }
  }, []);

  const value = React.useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

type ThemeContextValue = { theme: Theme; setTheme: (t: Theme) => void };
const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("ThemeProvider missing");
  return ctx;
}
