"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { inputClass, labelClass } from "@/components/kas/KasUi";
import { ModalError } from "@/components/kas/KasModal";
import { updateKasSettingAction } from "@/app/actions/kas";
import { addMonths, currentPeriod, formatPeriod, isValidPeriod, KAS_PERIOD_MONTHS, type KasSetting } from "@/lib/kas";

export function KasSettingForm({ setting }: { setting: KasSetting }) {
  const router = useRouter();
  const [monthlyFee, setMonthlyFee] = useState(setting.monthlyFee ? String(setting.monthlyFee) : "");
  const [startPeriod, setStartPeriod] = useState(setting.startPeriod ?? `${Number(currentPeriod().slice(0, 4)) - 1}-01`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const result = await updateKasSettingAction({ monthlyFee, startPeriod });
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error);
      toast.error(result.error ?? "Gagal menyimpan");
      return;
    }
    toast.success("Pengaturan kas berhasil disimpan.");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <ModalError message={error} onDismiss={() => setError(null)} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Iuran per Bulan (Rp)</label>
          <input inputMode="numeric" required value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} className={inputClass} placeholder="10000" />
          <p className="text-[11px] text-slate-500 mt-1.5">Dipakai sebagai nominal default dan dasar perhitungan tunggakan.</p>
        </div>
        <div>
          <label className={labelClass}>Awal Periode Iuran</label>
          <input type="month" required pattern="\d{4}-(0[1-9]|1[0-2])" placeholder="YYYY-MM" value={startPeriod} onChange={(e) => setStartPeriod(e.target.value)} className={inputClass} />
          <p className="text-[11px] text-slate-500 mt-1.5">
            Satu periode berlaku 2 tahun
            {isValidPeriod(startPeriod) ? `: ${formatPeriod(startPeriod)} – ${formatPeriod(addMonths(startPeriod, KAS_PERIOD_MONTHS))}` : ""}. Bulan yang sudah lewat dan belum dibayar dihitung sebagai tunggakan.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl font-semibold text-white bg-red-600 dark:bg-rose-600 hover:bg-red-700 dark:hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>
    </form>
  );
}
