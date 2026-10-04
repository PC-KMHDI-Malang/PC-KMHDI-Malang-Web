"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageUp, Upload } from "lucide-react";

import { KasModal, ModalActions, ModalError } from "@/components/kas/KasModal";
import { inputClass, labelClass } from "@/components/kas/KasUi";
import { submitIuranProofAction } from "@/app/actions/kas";
import { uploadKasProof } from "@/lib/uploadClient";
import { KAS_PROOF_TYPES, MAX_PROOF_MB } from "@/lib/uploadLimits";
import { formatRupiah, MONTH_SHORT, todayInJakarta } from "@/lib/kas";

export type ProofPeriodOption = { period: string; rejected: boolean };

interface UploadBuktiModalProps {
  options: ProofPeriodOption[];
  monthlyFee: number;
  /** Bulan yang langsung terpilih saat form dibuka (mis. bulan yang buktinya ditolak). */
  preselect?: string;
  /** "primary" = tombol utama di kartu Bayar Iuran; "inline" = tautan kecil "Upload ulang" di riwayat. */
  variant?: "primary" | "inline";
}

const periodLabel = (period: string) => `${MONTH_SHORT[Number(period.slice(5)) - 1]} ${period.slice(0, 4)}`;

// Anggota mengunggah foto bukti transfer/pembayaran untuk satu atau beberapa bulan sekaligus.
// Status bulan-bulan itu jadi "Menunggu Konfirmasi" sampai bendahara mengonfirmasi atau menolak.
export function UploadBuktiModal({ options, monthlyFee, preselect, variant = "primary" }: UploadBuktiModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [paidAt, setPaidAt] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = () => {
    // Bulan yang diminta (upload ulang) atau, kalau tidak ada, bulan tertua yang belum dibayar.
    const initial = preselect && options.some((o) => o.period === preselect) ? preselect : options[0]?.period;
    setSelected(initial ? [initial] : []);
    setPaidAt(todayInJakarta());
    setNote("");
    setFile(null);
    setError(null);
    setIsOpen(true);
  };

  const toggle = (period: string) => setSelected((prev) => (prev.includes(period) ? prev.filter((p) => p !== period) : [...prev, period].sort()));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!picked) return;
    if (!KAS_PROOF_TYPES.has(picked.type)) {
      setError("Bukti harus berupa gambar JPG, PNG, atau WebP.");
      return;
    }
    if (picked.size > MAX_PROOF_MB * 1024 * 1024) {
      setError(`Ukuran bukti maksimal ${MAX_PROOF_MB} MB.`);
      return;
    }
    setError(null);
    setFile(picked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) return setError("Pilih minimal satu bulan.");
    if (!file) return setError("Lampirkan foto bukti pembayaran.");

    setIsSubmitting(true);
    setError(null);
    try {
      const proofUrl = await uploadKasProof(file);
      const result = await submitIuranProofAction({ periods: selected, paidAt, note, proofUrl });
      if (!result.success) throw new Error(result.error ?? "Gagal mengirim bukti.");
      toast.success("Bukti terkirim. Menunggu konfirmasi bendahara.");
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim bukti.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {variant === "inline" ? (
        <button
          type="button"
          onClick={open}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-red-600 dark:bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-red-700 dark:hover:bg-rose-700 transition-colors"
        >
          <Upload size={13} />
          Upload Ulang
        </button>
      ) : (
        <button
          type="button"
          onClick={open}
          disabled={options.length === 0}
          className="bg-red-600 dark:bg-rose-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-red-700 dark:hover:bg-rose-700 shadow-sm transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload size={16} />
          Upload Bukti Pembayaran
        </button>
      )}

      <KasModal isOpen={isOpen} onClose={() => setIsOpen(false)} disableClose={isSubmitting} title="Upload Bukti Pembayaran" description="Bukti akan diperiksa bendahara sebelum iuran dinyatakan sudah bayar.">
        <form onSubmit={handleSubmit} className="space-y-5">
          <ModalError message={error} onDismiss={() => setError(null)} />

          <div>
            <label className={labelClass}>Bulan yang Dibayar</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
              {options.map(({ period, rejected }) => {
                const active = selected.includes(period);
                return (
                  <button
                    key={period}
                    type="button"
                    onClick={() => toggle(period)}
                    title={rejected ? "Bukti sebelumnya ditolak — unggah ulang" : undefined}
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
            <p className="text-[11px] text-slate-500 mt-1.5">Pilih beberapa bulan sekaligus kalau membayar rapel dengan satu bukti.</p>
          </div>

          <div>
            <label className={labelClass}>Tanggal Bayar</label>
            <input type="date" required max={todayInJakarta()} value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Foto Bukti Pembayaran</label>
            <label className="flex items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/5 px-4 py-4 cursor-pointer hover:border-red-300 dark:hover:border-rose-800 transition-colors">
              <ImageUp size={22} className="shrink-0 text-slate-400" />
              <span className="min-w-0 text-sm">
                <span className="block font-semibold text-slate-700 dark:text-slate-200 truncate">{file ? file.name : "Pilih foto bukti transfer / pembayaran"}</span>
                <span className="block text-[11px] text-slate-500">JPG, PNG, atau WebP · Maks {MAX_PROOF_MB} MB</span>
              </span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} disabled={isSubmitting} />
            </label>
          </div>

          <div>
            <label className={labelClass}>Catatan (Opsional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className={inputClass} placeholder="mis. Transfer BRI a.n. ..." />
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-neutral-400">
              {selected.length} bulan × {formatRupiah(monthlyFee)}
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white">{formatRupiah(monthlyFee * selected.length)}</span>
          </div>

          <ModalActions onCancel={() => setIsOpen(false)} isSubmitting={isSubmitting} submitLabel="Kirim Bukti" submittingLabel="Mengirim..." />
        </form>
      </KasModal>
    </>
  );
}
