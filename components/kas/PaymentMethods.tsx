"use client";

import { useState } from "react";
import Image from "next/image";
import { Maximize2, QrCode } from "lucide-react";

import { BankAccountInfo } from "@/components/kas/BankAccountInfo";
import { KasModal } from "@/components/kas/KasModal";
import type { KasBankAccount } from "@/lib/kas";

// Semua metode pembayaran iuran yang diatur bendahara (Kelola Kas → Pengaturan): daftar rekening
// (masing-masing dengan tombol salin) dan gambar QRIS. Dipakai di kartu "Metode Pembayaran"
// halaman kas anggota dan di form "Upload Bukti Pembayaran".
// layout "split": rekening di kiri, QRIS di kanan (layar lebar; di HP tetap bertumpuk) — dipakai
// kartu Metode Pembayaran yang selebar halaman. "stack": semuanya bertumpuk (di dalam form/popup).
export function PaymentMethods({ banks, qrisUrl, layout = "stack" }: { banks: KasBankAccount[]; qrisUrl: string | null; layout?: "stack" | "split" }) {
  const bankList = banks.length > 0 && (
    <div className="space-y-3">
      {banks.map((account, i) => (
        <BankAccountInfo key={`${account.number}-${i}`} account={account} />
      ))}
    </div>
  );

  // Berdampingan: rekening di kiri (setinggi isinya), QRIS di kanan — dua kolom sama lebar.
  if (layout === "split" && bankList && qrisUrl) {
    return (
      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        {bankList}
        <QrisCard url={qrisUrl} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bankList}
      {qrisUrl && <QrisCard url={qrisUrl} />}
    </div>
  );
}

// Kotak QRIS ringkas — susunannya sama dengan kartu rekening (judul, teks besar + tombol, keterangan)
// supaya sejajar. Di layar lebar gambar QRIS baru muncul dalam popup setelah tombol "Lihat QRIS"
// diklik; di HP gambarnya langsung tampil di kotak.
function QrisCard({ url }: { url: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4 sm:p-5">
      <p className="inline-flex h-8 items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-white">
        <QrCode size={20} className="text-red-600 dark:text-rose-400" />
        QRIS
      </p>

      {/* HP: gambar QRIS langsung tampil (ketuk untuk memperbesar). Latar putih supaya tetap
          bisa dipindai di mode gelap. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Perbesar QRIS"
        className="md:hidden mt-3 mb-3 block w-full rounded-xl bg-white p-2 border border-slate-200 dark:border-white/10"
      >
        <Image src={url} alt="Kode QRIS pembayaran iuran" width={1000} height={1000} sizes="90vw" className="block h-auto w-full" />
      </button>

      {/* Layar lebar: gambar disembunyikan, baru muncul dalam popup lewat tombol "Lihat QRIS". */}
      <div className="mt-4 mb-3 hidden items-end justify-between gap-3 md:flex">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Bayar dengan</p>
          <p className="mt-0.5 text-xl font-extrabold tracking-wide text-slate-900 dark:text-white whitespace-nowrap">Scan QRIS</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-red-600 dark:bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 dark:hover:bg-rose-700 transition-colors"
        >
          <Maximize2 size={14} />
          Lihat QRIS
        </button>
      </div>

      <p className="mt-auto pt-3 border-t border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-neutral-400">Bisa dibayar dari aplikasi bank atau e-wallet apa pun.</p>

      {/* Tanpa scroll: tinggi gambar dibatasi (layar dikurangi ruang judul & tepi popup) supaya
          seluruh QRIS selalu terlihat utuh dalam satu layar, di HP maupun laptop. Latar putih
          supaya kode QR tetap bisa dipindai di mode gelap. */}
      <KasModal isOpen={open} onClose={() => setOpen(false)} scrollable={false} title="QRIS Pembayaran" description="Pindai dengan aplikasi bank / e-wallet. Tekan lama gambar untuk menyimpan.">
        <div className="flex justify-center">
          <div className="inline-flex max-w-full rounded-2xl bg-white p-2 border border-slate-200 dark:border-white/10">
            <Image src={url} alt="Kode QRIS pembayaran iuran" width={1000} height={1000} sizes="(max-width: 640px) 90vw, 448px" className="block h-auto max-h-[calc(90vh-15rem)] w-auto max-w-full object-contain" />
          </div>
        </div>
      </KasModal>
    </div>
  );
}
