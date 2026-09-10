"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface AnnouncementPopupProps {
  imageUrl: string | null;
  linkUrl: string | null;
  isActive: boolean;
}

const DISMISS_KEY = "popupAdDismissed";

// Muncul sekali per sesi tab, bukan tiap kali pindah halaman — sessionStorage bertahan selama
// tab ini terbuka tapi otomatis kosong lagi begitu tab/browser ditutup, jadi pop-up tampil lagi
// di kunjungan berikutnya tanpa mengganggu navigasi di dalam kunjungan yang sama.
export function AnnouncementPopup({ imageUrl, linkUrl, isActive }: AnnouncementPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isActive || !imageUrl) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch {
      // sessionStorage bisa melempar exception di mode privat yang ketat — kalau begitu,
      // anggap saja belum pernah ditutup dan tetap tampilkan pop-up-nya.
    }
    // Ditunda ~1.2 detik, bukan langsung muncul begitu halaman dihidrasi: poster ini bisa sampai
    // 2 MB dan kalau langsung diminta browser saat itu juga, ikut rebutan bandwidth dengan
    // gambar-gambar penting halaman (mis. cover Hero) tepat di saat paling kritis. Jeda ini juga
    // mencegah poster ke-hitung sebagai elemen LCP (Largest Contentful Paint) — metrik loading
    // yang dipakai Google menilai kecepatan situs — walau baru muncul belakangan.
    const timer = window.setTimeout(() => setIsOpen(true), 1200);
    return () => window.clearTimeout(timer);
  }, [isActive, imageUrl]);

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore — kegagalan menyimpan penanda cuma berarti pop-up bisa muncul lagi lebih cepat
      // dari seharusnya, bukan sesuatu yang perlu menghentikan penutupan pop-up-nya sendiri.
    }
  };

  if (!mounted || !isOpen || !imageUrl) return null;

  // <img> polos, bukan next/image: poster ini diunggah admin dengan rasio bebas apa pun, dan
  // gambar ini cuma tampil sekali per sesi (bukan berulang di banyak kartu), jadi kerugian
  // "tidak dioptimasi Next.js" jauh lebih kecil dibanding risiko rasio gambar terpotong/gepeng
  // kalau dipaksa masuk kotak width/height tetap.
  const poster = (
    <img
      src={imageUrl}
      alt="Pengumuman"
      className="block w-full h-auto rounded-2xl shadow-2xl"
      decoding="async"
      // @ts-expect-error fetchPriority belum ada di tipe JSX.IntrinsicElements React versi ini,
      // tapi atributnya didukung browser modern — turunkan prioritasnya di bawah gambar-gambar
      // utama halaman (mis. cover Hero) yang harus lebih dulu selesai dimuat.
      fetchpriority="low"
    />
  );

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-200">
      {/* Garis-garis diagonal tipis, bukan blur rata — pola cahaya menyilang di atas backdrop
          gelap, senada dengan gaya poster "Special Thanks to" yang dijadikan acuan. */}
      <div
        className="absolute inset-0"
        onClick={handleClose}
        style={{
          backgroundImage: "repeating-linear-gradient(115deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1.5px, transparent 1.5px, transparent 34px)",
        }}
      />

      <div className="relative w-full max-w-2xl z-10 animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Tutup pop-up"
          className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-white text-slate-700 shadow-lg flex items-center justify-center hover:bg-slate-100 transition-colors z-20 cursor-pointer"
        >
          <X size={14} />
        </button>

        {linkUrl ? (
          <a href={linkUrl} target="_blank" rel="noopener noreferrer" onClick={handleClose}>
            {poster}
          </a>
        ) : (
          poster
        )}
      </div>
    </div>,
    document.body,
  );
}
