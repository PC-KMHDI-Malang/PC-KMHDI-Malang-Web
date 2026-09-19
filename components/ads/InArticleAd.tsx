"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED !== "false";

// Unit iklan "in-article" AdSense untuk disisipkan di tengah/akhir konten artikel.
// Slot Next.js merender ulang komponen ini saat navigasi client-side ke artikel lain,
// jadi push ke adsbygoogle harus dipicu lagi tiap kali <ins> baru muncul di DOM.
export function InArticleAd() {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!adsEnabled) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense belum selesai memuat (mis. diblokir ad blocker) — abaikan, bukan error aplikasi.
    }
  }, []);

  if (!adsEnabled) return null;

  return (
    <ins
      ref={insRef}
      className="adsbygoogle"
      style={{ display: "block", textAlign: "center" }}
      data-ad-layout="in-article"
      data-ad-format="fluid"
      data-ad-client="ca-pub-5436747793264342"
      data-ad-slot="7953686172"
    />
  );
}
