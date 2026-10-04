"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { inputClass, labelClass } from "@/components/kas/KasUi";
import { ModalError } from "@/components/kas/KasModal";
import { updateKasSettingAction } from "@/app/actions/kas";
import { addMonths, currentPeriod, formatPeriod, isValidPeriod, KAS_PERIOD_MONTHS, periodEnd, periodRange, type KasSetting } from "@/lib/kas";

const MONTH_INPUT_PATTERN = "\\d{4}-(0[1-9]|1[0-2])";

export function KasSettingForm({ setting }: { setting: KasSetting }) {
  const router = useRouter();
  const initialStart = setting.startPeriod ?? `${Number(currentPeriod().slice(0, 4)) - 1}-01`;
  const [monthlyFee, setMonthlyFee] = useState(setting.monthlyFee ? String(setting.monthlyFee) : "");
  const [startPeriod, setStartPeriod] = useState(initialStart);
  const [endPeriod, setEndPeriod] = useState(periodEnd({ ...setting, startPeriod: initialStart }) ?? addMonths(initialStart, KAS_PERIOD_MONTHS));
  // Selama bendahara belum mengubah akhir periode sendiri, akhir periode ikut bergeser otomatis
  // (2 tahun) setiap kali awal periode diganti.
  const [endTouched, setEndTouched] = useState(!!setting.endPeriod);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeStart = (value: string) => {
    setStartPeriod(value);
    if (!endTouched && isValidPeriod(value)) setEndPeriod(addMonths(value, KAS_PERIOD_MONTHS));
  };

  const valid = isValidPeriod(startPeriod) && isValidPeriod(endPeriod) && endPeriod >= startPeriod;
  const monthCount = valid ? periodRange(startPeriod, endPeriod).length : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const result = await updateKasSettingAction({ monthlyFee, startPeriod, endPeriod });
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

      <div>
        <label className={labelClass}>Iuran per Bulan (Rp)</label>
        <input inputMode="numeric" required value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} className={`${inputClass} sm:max-w-[calc(50%-0.5rem)]`} placeholder="10000" />
        <p className="text-[11px] text-slate-500 mt-1.5">Dipakai sebagai nominal default dan dasar perhitungan tunggakan.</p>
      </div>

      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Awal Periode Iuran</label>
            <input type="month" required pattern={MONTH_INPUT_PATTERN} placeholder="YYYY-MM" value={startPeriod} onChange={(e) => changeStart(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Akhir Periode Iuran</label>
            <input
              type="month"
              required
              pattern={MONTH_INPUT_PATTERN}
              placeholder="YYYY-MM"
              min={isValidPeriod(startPeriod) ? startPeriod : undefined}
              value={endPeriod}
              onChange={(e) => {
                setEndTouched(true);
                setEndPeriod(e.target.value);
              }}
              className={inputClass}
            />
          </div>
        </div>
        <p className={`text-[11px] mt-1.5 ${valid ? "text-slate-500" : "text-red-600 dark:text-rose-400"}`}>
          {valid
            ? `Periode ${formatPeriod(startPeriod)} – ${formatPeriod(endPeriod)} (${monthCount} bulan). Bulan di luar periode tidak ditagih; bulan yang sudah lewat dan belum dibayar dihitung sebagai tunggakan.`
            : "Akhir periode tidak boleh sebelum awal periode."}
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !valid}
          className="px-5 py-2.5 rounded-xl font-semibold text-white bg-red-600 dark:bg-rose-600 hover:bg-red-700 dark:hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>
    </form>
  );
}
