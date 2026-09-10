"use client";

import { useEffect, useState } from "react";

// z-[80]: harus di atas <header> Navbar (z-[70]) supaya bar ini benar-benar terlihat
// menempel di atas navbar, bukan ketiban olehnya, saat sama-sama fixed di top-0.
export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percent = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, percent)));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <div className="fixed left-0 top-0 z-[80] h-1 w-full bg-transparent">
      <div className="h-full bg-gradient-to-r from-red-600 via-rose-600 to-red-500 transition-[width] duration-150 ease-out" style={{ width: `${progress}%` }} />
    </div>
  );
}
