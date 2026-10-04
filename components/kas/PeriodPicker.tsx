"use client";

import { labelClass } from "@/components/kas/KasUi";
import { formatRupiah, MONTH_SHORT } from "@/lib/kas";

// Pilihan bulan yang bisa dibayar — satu tampilan untuk form anggota (Upload Bukti Pembayaran)
// dan form bendahara (Catat Pembayaran Iuran), supaya keduanya selalu sama persis.

export type PeriodOption = { period: string; rejected: boolean };

export const periodLabel = (period: string) => `${MONTH_SHORT[Number(period.slice(5)) - 1]} ${period.slice(0, 4)}`;

export function PeriodPicker({ options, selected, onToggle, hint }: { options: PeriodOption[]; selected: string[]; onToggle: (period: string) => void; hint: string }) {
  return (
    <div>
      <label className={labelClass}>Bulan yang Dibayar</label>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto overflow-x-hidden overscroll-contain pr-1">
        {options.map(({ period, rejected }) => {
          const active = selected.includes(period);
          return (
            <button
              key={period}
              type="button"
              onClick={() => onToggle(period)}
              title={rejected ? "Bukti sebelumnya ditolak" : undefined}
              className={`rounded-xl border px-2 py-2 text-xs font-bold transition ${
                active
                  ? "bg-red-600 dark:bg-rose-600 border-red-600 dark:border-rose-600 text-white"
                  : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-red-300"
              }`}
            >
              {periodLabel(period)}
              {rejected && <span className="block text-[10px] font-semibold opacity-80">ditolak</span>}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-500 mt-1.5">{hint}</p>
    </div>
  );
}

export function PeriodTotal({ count, monthlyFee }: { count: number; monthlyFee: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3 flex items-center justify-between text-sm">
      <span className="text-slate-500 dark:text-neutral-400">
        {count} bulan × {formatRupiah(monthlyFee)}
      </span>
      <span className="font-extrabold text-slate-900 dark:text-white">{formatRupiah(monthlyFee * count)}</span>
    </div>
  );
}

// Pilih/lepas satu bulan, hasil selalu terurut.
export function togglePeriod(list: string[], period: string): string[] {
  return list.includes(period) ? list.filter((p) => p !== period) : [...list, period].sort();
}
