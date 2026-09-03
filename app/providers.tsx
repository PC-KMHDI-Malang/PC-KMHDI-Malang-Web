"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// next-themes injects an inline <script> to prevent theme-flash before hydration.
// React 19 warns about any <script> tag rendered inside a client component tree, even
// though this one works correctly. next-themes hasn't shipped a fix, so we silence just
// this known-harmless warning in dev. Patched at module scope (not in an effect) because
// the warning fires during the very first render/commit, before any effect can run.
// See: https://github.com/pacocoursey/next-themes/issues/387
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag while rendering React component")) {
      return;
    }
    originalError(...args);
  };
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}
