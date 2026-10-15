"use client";
import { useEffect, useState } from "react";
import { ar } from "@/lib/i18n/ar";
import { KEYS, writeJSON } from "@/lib/storage";
import { Icon } from "./Icon";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);
  if (!theme) return <span className="inline-block h-11 w-11" aria-hidden="true" />;
  const nextTheme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="btn btn-ghost h-11 w-11 p-0"
      aria-label={`${ar.theme.toggle}: ${ar.theme[nextTheme]}`}
      onClick={() => {
        document.documentElement.dataset.theme = nextTheme;
        writeJSON(KEYS.theme, nextTheme);
        setTheme(nextTheme);
      }}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} className="h-6 w-6 text-brand" />
    </button>
  );
}
