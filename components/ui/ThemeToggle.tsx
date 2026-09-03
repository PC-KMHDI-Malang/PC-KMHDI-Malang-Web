"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  iconOnly?: boolean;
  className?: string;
}

export function ThemeToggle({ iconOnly = false, className = "" }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    if (iconOnly) {
      return (
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 opacity-0 ${className}`} />
      );
    }
    return (
      <div className={`w-full flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-900 rounded-2xl mb-3 opacity-0 ${className}`}>
        <div className="w-12 h-6 bg-slate-300 dark:bg-slate-800 rounded-full" />
      </div>
    );
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = currentTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
        title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border border-white/20 bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all shadow-sm ${className}`}
      >
        {isDark ? (
          <Sun size={17} className="text-amber-400 hover:rotate-45 transition-transform duration-300" />
        ) : (
          <Moon size={17} className="text-slate-100 hover:-rotate-12 transition-transform duration-300" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-colors cursor-pointer text-left border border-transparent hover:border-slate-200 dark:hover:border-white/5 ${className}`}
    >
      <div className="flex items-center gap-2.5 text-slate-700 dark:text-white">
        {isDark ? (
          <Sun size={17} className="text-amber-400" />
        ) : (
          <Moon size={17} className="text-slate-500" />
        )}
        <span className="font-bold text-sm tracking-wide">
          {isDark ? "Mode Gelap" : "Mode Terang"}
        </span>
      </div>

      <div
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isDark ? "bg-rose-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isDark ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </div>
    </button>
  );
}
