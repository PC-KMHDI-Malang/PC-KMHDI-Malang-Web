"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { KasModal, ModalActions, ModalError } from "@/components/kas/KasModal";
import { inputClass, labelClass } from "@/components/kas/KasUi";
import { deleteTransaksiAction, saveTransaksiAction } from "@/app/actions/kas";
import { formatDate, formatRupiah, todayInJakarta, type KasTransaksiType } from "@/lib/kas";

export type Transaksi = {
  id: string;
  type: KasTransaksiType;
  amount: number;
  date: string;
  description: string;
  category: string | null;
};

type Filter = "SEMUA" | KasTransaksiType;

export function KasTransaksiManager({ transaksi }: { transaksi: Transaksi[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("SEMUA");
  const [query, setQuery] = useState("");
  const [formTarget, setFormTarget] = useState<Transaksi | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaksi | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transaksi.filter((t) => (filter === "SEMUA" || t.type === filter) && (!q || t.description.toLowerCase().includes(q) || (t.category ?? "").toLowerCase().includes(q)));
  }, [transaksi, filter, query]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteTransaksiAction(deleteTarget.id);
    setIsDeleting(false);
    if (!result.success) {
      toast.error(result.error ?? "Gagal menghapus");
      return;
    }
    toast.success("Transaksi berhasil dihapus.");
    setDeleteTarget(null);
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative w-full lg:max-w-xs">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari keterangan atau kategori..." className={`${inputClass} pl-10 py-2.5 text-sm`} />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-1 text-xs font-bold">
            {(
              [
                ["SEMUA", "Semua"],
                ["MASUK", "Pemasukan"],
                ["KELUAR", "Pengeluaran"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`px-3.5 py-2 rounded-lg transition-colors ${filter === value ? "bg-white dark:bg-[#121215] text-red-600 dark:text-rose-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setFormTarget("new")}
            className="bg-red-600 dark:bg-rose-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-red-700 dark:hover:bg-rose-700 shadow-sm transition-all text-sm flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Tambah Transaksi
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-neutral-400 text-center py-10">{transaksi.length === 0 ? "Belum ada transaksi pada tahun ini." : "Tidak ada transaksi yang cocok dengan pencarian/filter."}</p>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-white/10 rounded-2xl border border-slate-200 dark:border-white/10">
          {filtered.map((t) => {
            const isIn = t.type === "MASUK";
            const Icon = isIn ? ArrowDownLeft : ArrowUpRight;
            return (
              <div key={t.id} className="flex items-center gap-3 sm:gap-4 px-4 py-3.5">
                <div
                  className={`w-10 h-10 shrink-0 rounded-2xl border flex items-center justify-center ${
                    isIn
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400"
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{t.description}</p>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 truncate">
                    {formatDate(t.date)}
                    {t.category ? ` · ${t.category}` : ""}
                  </p>
                </div>
                <p className={`shrink-0 text-sm font-bold ${isIn ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-rose-400"}`}>
                  {isIn ? "+" : "−"}
                  {formatRupiah(t.amount)}
                </p>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setFormTarget(t)}
                    aria-label="Ubah"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(t)}
                    aria-label="Hapus"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TransaksiFormModal target={formTarget} onClose={() => setFormTarget(null)} />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        offsetSidebar={false}
        title="Hapus transaksi?"
        description={deleteTarget ? `"${deleteTarget.description}" (${formatRupiah(deleteTarget.amount)}) akan dihapus permanen dari buku kas.` : ""}
        confirmText="Ya, Hapus"
      />
    </div>
  );
}

function TransaksiFormModal({ target, onClose }: { target: Transaksi | "new" | null; onClose: () => void }) {
  const router = useRouter();
  const [shown, setShown] = useState<typeof target>(null);
  const [type, setType] = useState<KasTransaksiType>("KELUAR");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form setiap kali dibuka (lihat catatan yang sama di IuranMatrix.tsx).
  if (target && target !== shown) {
    const existing = target === "new" ? null : target;
    setShown(target);
    setType(existing?.type ?? "KELUAR");
    setAmount(existing ? String(existing.amount) : "");
    setDate(existing?.date ?? todayInJakarta());
    setDescription(existing?.description ?? "");
    setCategory(existing?.category ?? "");
    setError(null);
  }

  const isEdit = !!shown && shown !== "new";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const result = await saveTransaksiAction({ id: isEdit ? (shown as Transaksi).id : undefined, type, amount, date, description, category });
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error);
      toast.error(result.error ?? "Gagal menyimpan");
      return;
    }
    toast.success(isEdit ? "Transaksi berhasil diperbarui." : "Transaksi berhasil ditambahkan.");
    router.refresh();
    onClose();
  };

  return (
    <KasModal isOpen={!!target} onClose={onClose} disableClose={isSubmitting} title={isEdit ? "Ubah Transaksi" : "Tambah Transaksi"} description="Catat pemasukan di luar iuran atau pengeluaran organisasi.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <ModalError message={error} onDismiss={() => setError(null)} />

        <div>
          <label className={labelClass}>Jenis</label>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["MASUK", "Pemasukan", ArrowDownLeft],
                ["KELUAR", "Pengeluaran", ArrowUpRight],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold transition ${
                  type === value
                    ? value === "MASUK"
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-red-600 dark:bg-rose-600 border-red-600 dark:border-rose-600 text-white"
                    : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Keterangan</label>
          <input required minLength={3} maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder={type === "MASUK" ? "mis. Donasi alumni" : "mis. Konsumsi rapat pleno"} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nominal (Rp)</label>
            <input inputMode="numeric" required value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} placeholder="50000" />
          </div>
          <div>
            <label className={labelClass}>Tanggal</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Kategori (Opsional)</label>
          <input maxLength={50} value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} placeholder="mis. Kegiatan, Operasional, Sponsor" />
        </div>

        <ModalActions onCancel={onClose} isSubmitting={isSubmitting} submitLabel={isEdit ? "Simpan Perubahan" : "Simpan Transaksi"} />
      </form>
    </KasModal>
  );
}
