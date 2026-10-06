"use client";

import { useState } from "react";
import { ImageOff, Loader2 } from "lucide-react";

import { KasModal } from "@/components/kas/KasModal";

// Tombol "Lihat bukti" yang membuka foto bukti pembayaran dalam popup, tanpa pindah halaman.
// Fotonya diambil dari /kas/bukti/<id> (route yang memeriksa sesi, lihat route.ts di sana).
// <img> biasa, bukan next/image: alamat itu butuh cookie sesi dan tidak boleh dioptimasi/di-cache
// oleh server gambar Next.js.
export function ProofViewer({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const show = () => {
    setLoaded(false);
    setFailed(false);
    setOpen(true);
  };

  return (
    <>
      <button type="button" onClick={show} className={className}>
        {children}
      </button>

      <KasModal isOpen={open} onClose={() => setOpen(false)} scrollable={false} title="Bukti Pembayaran" description="Tekan lama gambar untuk menyimpan.">
        <div className="flex min-h-40 items-center justify-center">
          {failed ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-slate-500 dark:text-neutral-400">
              <ImageOff size={28} />
              Bukti tidak dapat dibuka. Coba lagi nanti.
            </div>
          ) : (
            <div className="relative inline-flex max-w-full rounded-2xl bg-white p-2 border border-slate-200 dark:border-white/10">
              {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-slate-400" />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={href}
                alt="Bukti pembayaran iuran"
                onLoad={() => setLoaded(true)}
                onError={() => setFailed(true)}
                className={`block h-auto max-h-[calc(90vh-13rem)] w-auto max-w-full object-contain transition-opacity ${loaded ? "opacity-100" : "opacity-0 min-h-32 min-w-32"}`}
              />
            </div>
          )}
        </div>
      </KasModal>
    </>
  );
}
