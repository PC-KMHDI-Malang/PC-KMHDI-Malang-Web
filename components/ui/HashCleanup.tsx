"use client";

import { useEffect } from "react";

// Setelah pindah dari halaman lain ke URL beranchor (mis. /profil#struktur), biarkan browser
// scroll native ke section-nya lebih dulu, lalu bersihkan "#id" dari address bar supaya tidak
// menumpuk/terlihat jelek kalau user lanjut klik anchor lain di halaman yang sama.
export function HashCleanup() {
  useEffect(() => {
    if (!window.location.hash) return;
    const timer = setTimeout(() => {
      window.history.replaceState(null, "", window.location.pathname);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
