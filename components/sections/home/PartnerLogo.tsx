"use client";

import { useEffect, useRef, useState } from "react";
import { Instagram, Globe } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";

interface PartnerLogoProps {
  name: string;
  logoUrl: string;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
}

// Tooltip nama mitra sebelumnya cuma bisa dipicu lewat CSS `group-hover`, yang tidak berguna
// di layar sentuh — HP tidak punya hover, jadi tooltip-nya tidak pernah bisa dibuka sama sekali.
// Komponen ini jadi client component supaya tap bisa toggle tooltip terbuka/tertutup, sementara
// hover mouse di desktop tetap bekerja seperti biasa lewat CSS (keduanya saling melengkapi).
export function PartnerLogo({ name, logoUrl, websiteUrl, instagramUrl }: PartnerLogoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const links = [
    instagramUrl ? { href: instagramUrl, icon: Instagram, label: "Instagram" } : null,
    websiteUrl ? { href: websiteUrl, icon: Globe, label: "Situs Web" } : null,
  ].filter((link): link is { href: string; icon: typeof Instagram; label: string } => link !== null);

  // Tutup tooltip kalau menyentuh/klik di luar logo ini — supaya tooltip tidak menumpuk terbuka
  // terus saat pengguna lanjut menjelajahi mitra lain di marquee.
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="group relative shrink-0">
      {/* Tooltip ala gelembung chat: nama + ikon tautan (kalau ada) jadi satu baris, plus "ekor" segitiga menunjuk ke logo */}
      <div
        className={`pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2 -translate-y-full scale-90 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 ${
          isOpen ? "!scale-100 !opacity-100" : ""
        }`}
      >
        <div className="relative flex items-center gap-2 whitespace-nowrap rounded-2xl bg-slate-900 dark:bg-white px-3.5 py-2 text-xs font-semibold text-white dark:text-slate-900 shadow-xl">
          <span>{name}</span>
          {links.length > 0 && (
            <span className="flex items-center gap-1 border-l border-white/20 dark:border-slate-900/15 pl-2">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={link.label}
                  className="pointer-events-auto flex h-5 w-5 items-center justify-center rounded-full bg-white/15 dark:bg-slate-900/10 transition-colors hover:bg-white/25 dark:hover:bg-slate-900/20"
                >
                  <link.icon size={11} />
                </a>
              ))}
            </span>
          )}
          <span className="absolute left-1/2 top-full -mt-1.5 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] bg-slate-900 dark:bg-white" />
        </div>
      </div>

      {/* Logo mitra biasanya PNG transparan — tampilkan apa adanya tanpa kotak/kartu pembungkus. */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`relative h-24 w-56 opacity-70 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0 ${isOpen ? "!opacity-100 !grayscale-0" : ""}`}
      >
        <SafeImage src={logoUrl} alt={name} fill sizes="224px" className="object-contain" />
      </button>
    </div>
  );
}
