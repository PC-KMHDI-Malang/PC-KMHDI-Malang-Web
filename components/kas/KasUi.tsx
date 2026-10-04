import type { LucideIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";
import type { MonthStatus } from "@/lib/kas";

// Potongan UI kecil yang dipakai berulang di /kas dan /kas/kelola. Kelas-kelasnya disalin dari
// kartu di app/(public)/profile/page.tsx supaya tampilannya tetap seragam.

export const cardClass = "rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121215] p-6 sm:p-8 shadow-xl";

export const inputClass =
  "w-full bg-slate-50 dark:bg-[#111114] dark:text-white border border-slate-200 dark:border-white/5 focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20 rounded-xl p-3 outline-none transition-all";

// Untuk <input type="date"/"month">: di HP (terutama iOS) input jenis ini punya lebar minimum
// sendiri dan bisa lebih lebar dari modal, membuat isi modal bisa digeser ke kanan-kiri.
export const dateInputClass = `${inputClass} block min-w-0 max-w-full appearance-none`;

export const labelClass ="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5";

export const STATUS_LABEL: Record<MonthStatus, string> = {
  LUNAS: "Sudah Bayar",
  MENUNGGU: "Menunggu Konfirmasi",
  BELUM: "Belum Bayar",
  MENDATANG: "Mendatang",
  TIDAK_BERLAKU: "Tidak Berlaku",
};

export const STATUS_CLASS: Record<MonthStatus, string> = {
  LUNAS: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400",
  MENUNGGU: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400",
  BELUM: "bg-red-50 dark:bg-rose-950/30 border-red-200 dark:border-rose-900/50 text-red-600 dark:text-rose-400",
  MENDATANG: "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400",
  TIDAK_BERLAKU: "bg-slate-50/60 dark:bg-white/[0.02] border-dashed border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500",
};

export function CardHeading({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100 dark:border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 shrink-0 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm">
          <Icon size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{title}</h3>
          {description && <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, hint, tone = "default" }: { icon: LucideIcon; label: string; value: string; hint?: string; tone?: "default" | "good" | "bad" }) {
  const toneClass =
    tone === "good"
      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400"
      : tone === "bad"
        ? "bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400"
        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300";

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121215] p-5 sm:p-6 shadow-xl">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 shrink-0 rounded-2xl border flex items-center justify-center ${toneClass}`}>
          <Icon size={18} />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">{label}</p>
      </div>
      <p className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{value}</p>
      {hint && <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">{hint}</p>}
    </div>
  );
}

export function KasNotice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/25 p-4">
      <AlertCircle size={18} className="shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
      <div className="text-xs sm:text-[13px] text-amber-900 dark:text-amber-200/90 leading-relaxed">
        <span className="font-bold">{title}</span> {children}
      </div>
    </div>
  );
}
