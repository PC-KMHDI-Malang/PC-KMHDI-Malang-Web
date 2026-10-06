"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ExternalLink, X } from "lucide-react";

import { KasModal, ModalActions, ModalError } from "@/components/kas/KasModal";
import { inputClass, labelClass } from "@/components/kas/KasUi";
import { confirmIuranAction, rejectIuranAction } from "@/app/actions/kas";
import { formatDate, formatPeriod, formatRupiah } from "@/lib/kas";

// Satu kiriman bukti dari anggota — bisa untuk beberapa bulan sekaligus (satu file bukti).
export type PendingProof = {
  key: string;
  ids: string[];
  memberName: string;
  periods: string[];
  amountPerMonth: number;
  total: number;
  paidAt: string;
  submittedAt: string | null;
  note: string | null;
  proofHref: string;
};

export function KonfirmasiList({ items }: { items: PendingProof[] }) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingProof | null>(null);

  const handleConfirm = async (item: PendingProof) => {
    setBusyKey(item.key);
    const result = await confirmIuranAction(item.ids);
    setBusyKey(null);
    if (!result.success) {
      toast.error(result.error ?? "Gagal mengonfirmasi");
      return;
    }
    toast.success(`Pembayaran ${item.memberName} dikonfirmasi.`);
    router.refresh();
  };

  if (items.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-neutral-400 text-center py-10">Semua bukti pembayaran sudah diperiksa.</p>;
  }

  return (
    <>
      <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-white/10 rounded-2xl border border-slate-200 dark:border-white/10">
        {items.map((item) => (
          <div key={item.key} className="flex flex-col sm:flex-row sm:items-center gap-4 px-4 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800 dark:text-white">{item.memberName}</p>
              <p className="text-xs text-slate-600 dark:text-neutral-300 mt-0.5">{item.periods.map(formatPeriod).join(", ")}</p>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                {formatRupiah(item.total)}
                {item.periods.length > 1 ? ` (${formatRupiah(item.amountPerMonth)} × ${item.periods.length} bulan)` : ""} · Dibayar {formatDate(item.paidAt)}
              </p>
              {item.note && <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 italic">&ldquo;{item.note}&rdquo;</p>}
            </div>

            <div className="grid grid-cols-3 gap-2 sm:flex sm:shrink-0 sm:flex-wrap">
              <a
                href={item.proofHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors"
              >
                <ExternalLink size={14} />
                Lihat Bukti
              </a>
              <button
                type="button"
                onClick={() => setRejectTarget(item)}
                disabled={busyKey !== null}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-rose-400 bg-red-50 dark:bg-rose-950/30 hover:bg-red-100 dark:hover:bg-rose-950/50 transition-colors disabled:opacity-50"
              >
                <X size={14} />
                Tolak
              </button>
              <button
                type="button"
                onClick={() => handleConfirm(item)}
                disabled={busyKey !== null}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-50"
              >
                <Check size={14} />
                {busyKey === item.key ? "Memproses..." : "Konfirmasi"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <RejectModal target={rejectTarget} onClose={() => setRejectTarget(null)} />
    </>
  );
}

function RejectModal({ target, onClose }: { target: PendingProof | null; onClose: () => void }) {
  const router = useRouter();
  const [shown, setShown] = useState<PendingProof | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form di-reset setiap kali dibuka untuk kiriman lain (pola yang sama dengan IuranMatrix.tsx).
  if (target && target !== shown) {
    setShown(target);
    setReason("");
    setError(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shown) return;
    setIsSubmitting(true);
    setError(null);
    const result = await rejectIuranAction(shown.ids, reason);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error);
      toast.error(result.error ?? "Gagal menolak");
      return;
    }
    toast.success("Bukti pembayaran ditolak.");
    router.refresh();
    onClose();
  };

  return (
    <KasModal
      isOpen={!!target}
      onClose={onClose}
      disableClose={isSubmitting}
      title="Tolak Bukti Pembayaran"
      description={shown ? `${shown.memberName} · ${shown.periods.map(formatPeriod).join(", ")}` : undefined}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <ModalError message={error} onDismiss={() => setError(null)} />
        <div>
          <label className={labelClass}>Alasan Penolakan</label>
          <input required minLength={3} maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} placeholder="mis. Nominal transfer tidak sesuai / bukti tidak terbaca" />
          <p className="text-[11px] text-slate-500 mt-1.5">Alasan ini ditampilkan ke anggota. Foto bukti akan dihapus, bulan tersebut kembali berstatus belum bayar, dan anggota bisa mengunggah ulang.</p>
        </div>
        <ModalActions onCancel={onClose} isSubmitting={isSubmitting} submitLabel="Tolak Bukti" submittingLabel="Memproses..." />
      </form>
    </KasModal>
  );
}
