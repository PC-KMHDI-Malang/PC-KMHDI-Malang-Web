"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Menghindari hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full flex items-center justify-between px-4 py-3 bg-slate-900 rounded-2xl mb-3 opacity-0">
        <div className="w-12 h-6 bg-slate-800 rounded-full" />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors cursor-pointer text-left"
    >
      <div
        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${
          isDark ? "bg-rose-900/50" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
            isDark ? "translate-x-7 bg-rose-400" : "translate-x-1 bg-white"
          }`}
        />
      </div>
      <div className="flex items-center gap-2 text-slate-700 dark:text-white">
        <Moon size={16} className={isDark ? "text-rose-400" : "text-slate-500"} />
        <span className="font-bold text-sm tracking-wide">Dark Mode</span>
      </div>
    </button>
  );
}
