"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  window.localStorage.setItem("onlyping-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") as Theme | null;
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Changer de theme"
      aria-pressed={isDark}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-line bg-surface-alt transition-colors"
    >
      <span
        className={`flex h-[18px] w-[18px] items-center justify-center rounded-full bg-ink text-bg transition-transform ${
          isDark ? "translate-x-[22px]" : "translate-x-[3px]"
        }`}
      >
        {isDark ? (
          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
            <path d="M21.64 13a9 9 0 1 1-10.63-10.63 1 1 0 0 1 1.11 1.4A7 7 0 0 0 20.24 11.9a1 1 0 0 1 1.4 1.1Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 2v2.5M12 19.5V22M4.22 4.22l1.77 1.77M18 18l1.78 1.78M2 12h2.5M19.5 12H22M4.22 19.78l1.77-1.77M18 6l1.78-1.78" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        )}
      </span>
    </button>
  );
}
