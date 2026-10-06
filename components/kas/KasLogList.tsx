"use client";

import { useMemo, useState } from "react";
import { Ban, CheckCircle2, HandCoins, Pencil, Search, Upload, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { inputClass } from "@/components/kas/KasUi";
import { formatPeriod, formatRupiah } from "@/lib/kas";

export type KasLogAction = "DICATAT" | "DIKIRIM" | "DIKONFIRMASI" | "DITOLAK" | "DIUBAH" | "DIBATALKAN";

export type KasLogItem = {
  id: string;
  time: string; // sudah diformat WIB di server, supaya tidak beda antara server & browser
  action: KasLogAction;
  memberName: string;
  periods: string[];
  amount: number;
  note: string | null;
};

const ACTION_META: Record<KasLogAction, { label: string; icon: LucideIcon; tone: string }> = {
  DICATAT: { label: "membayar (dicatat bendahara)", icon: HandCoins, tone: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400" },
  DIKIRIM: { label: "mengirim bukti pembayaran", icon: Upload, tone: "bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40 text-amber-600 dark:text-amber-400" },
  DIKONFIRMASI: { label: "pembayaran dikonfirmasi", icon: CheckCircle2, tone: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400" },
  DITOLAK: { label: "bukti pembayaran ditolak", icon: XCircle, tone: "bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400" },
  DIUBAH: { label: "catatan iuran diubah", icon: Pencil, tone: "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300" },
  DIBATALKAN: { label: "catatan iuran dibatalkan", icon: Ban, tone: "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300" },
};

const FILTERS: { key: string; label: string; actions: KasLogAction[] | null }[] = [
  { key: "semua", label: "Semua", actions: null },
  { key: "bayar", label: "Pembayaran", actions: ["DICATAT", "DIKIRIM"] },
  { key: "konfirmasi", label: "Dikonfirmasi", actions: ["DIKONFIRMASI"] },
  { key: "tolak", label: "Ditolak", actions: ["DITOLAK"] },
  { key: "ubah", label: "Perubahan", actions: ["DIUBAH", "DIBATALKAN"] },
];

export function KasLogList({ items }: { items: KasLogItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("semua");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const actions = FILTERS.find((f) => f.key === filter)?.actions ?? null;
    return items.filter((i) => (!actions || actions.includes(i.action)) && (!q || i.memberName.toLowerCase().includes(q)));
  }, [items, query, filter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative w-full lg:max-w-xs">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama anggota..." className={`${inputClass} pl-10 py-2.5 text-sm`} />
        </div>
        <div className="flex w-full lg:w-auto overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-1 text-xs font-bold">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`shrink-0 whitespace-nowrap px-3.5 py-2 rounded-lg transition-colors ${filter === f.key ? "bg-white dark:bg-[#121215] text-red-600 dark:text-rose-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-neutral-400 text-center py-10">{items.length === 0 ? "Belum ada transaksi tercatat." : "Tidak ada log yang cocok dengan pencarian/filter."}</p>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-white/10 rounded-2xl border border-slate-200 dark:border-white/10">
          {filtered.map((item) => {
            const meta = ACTION_META[item.action];
            const Icon = meta.icon;
            return (
              <div key={item.id} className="flex items-start gap-3 sm:gap-4 px-4 py-3.5">
                <div className={`w-10 h-10 shrink-0 rounded-2xl border flex items-center justify-center ${meta.tone}`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800 dark:text-white">
                    <span className="font-bold">{item.memberName}</span> <span className="text-slate-600 dark:text-neutral-300">{meta.label}</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">{item.periods.map(formatPeriod).join(", ")}</p>
                  {item.note && <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 italic">&ldquo;{item.note}&rdquo;</p>}
                  {/* HP: nominal & waktu pindah ke bawah, supaya teks di atasnya tidak sempit. */}
                  <p className="sm:hidden mt-1 text-[11px] text-slate-500 dark:text-neutral-400">
                    {item.amount > 0 && <span className="font-bold text-slate-800 dark:text-white">{formatRupiah(item.amount)} · </span>}
                    {item.time}
                  </p>
                </div>
                <div className="hidden sm:block shrink-0 text-right">
                  {item.amount > 0 && <p className="text-sm font-bold text-slate-800 dark:text-white">{formatRupiah(item.amount)}</p>}
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 whitespace-nowrap">{item.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-[11px] text-slate-500 dark:text-neutral-400">Menampilkan {Math.min(filtered.length, items.length)} dari {items.length} aktivitas terbaru.</p>
    </div>
  );
}
