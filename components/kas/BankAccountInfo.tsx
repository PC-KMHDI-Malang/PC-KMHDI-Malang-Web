"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Check, Copy } from "lucide-react";

import type { KasBankAccount } from "@/lib/kas";

// Rekening tujuan pembayaran iuran + tombol salin nomor rekening. Dipakai di kartu "Rekening
// Pembayaran" (halaman kas anggota), di form "Upload Bukti Pembayaran", dan sebagai pratinjau
// di Pengaturan bendahara. Disusun bertingkat (logo → nomor → nama) supaya nomor rekening dan
// nama pemilik selalu tampil utuh walau kartunya sempit.
export function BankAccountInfo({ account }: { account: KasBankAccount }) {
  const [copied, setCopied] = useState(false);
  // Logo yang diunggah bendahara; tanpa logo, nama bank yang ditampilkan.
  const logo = account.logoUrl ?? null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(account.number.replace(/\s+/g, ""));
      setCopied(true);
      toast.success("Nomor rekening disalin.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin. Salin nomor rekening secara manual.");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4 sm:p-5">
      {logo ? (
        <Image src={logo} alt={account.bank} width={240} height={80} sizes="160px" className="block h-8 w-auto max-w-40 object-contain" />
      ) : (
        <p className="text-sm font-extrabold text-slate-800 dark:text-white">{account.bank}</p>
      )}

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Nomor Rekening</p>
          <p className="mt-0.5 text-xl font-extrabold tracking-wide text-slate-900 dark:text-white tabular-nums whitespace-nowrap">{account.number}</p>
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label="Salin nomor rekening"
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
            copied ? "bg-emerald-600 text-white" : "bg-red-600 dark:bg-rose-600 text-white hover:bg-red-700 dark:hover:bg-rose-700"
          }`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Tersalin" : "Salin"}
        </button>
      </div>

      {account.holder && (
        <p className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-neutral-400">
          Atas nama <span className="font-semibold text-slate-700 dark:text-slate-200">{account.holder}</span>
        </p>
      )}
    </div>
  );
}
