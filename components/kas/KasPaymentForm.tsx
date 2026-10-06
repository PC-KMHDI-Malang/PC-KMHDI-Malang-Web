"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, ImageUp, Landmark, Loader2, Plus, QrCode, Trash2, X } from "lucide-react";

import { inputClass, labelClass } from "@/components/kas/KasUi";
import { ModalError } from "@/components/kas/KasModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PaymentMethods } from "@/components/kas/PaymentMethods";
import { updateKasPaymentAction } from "@/app/actions/kas";
import { uploadKasAsset } from "@/lib/uploadClient";
import { MAX_PROOF_MB } from "@/lib/uploadLimits";
import { KAS_MAX_BANKS, type KasBankAccount } from "@/lib/kas";

const QRIS_ACCEPT = "image/jpeg,image/png,image/webp";

type ConfirmTarget = { kind: "account"; index: number } | { kind: "logo"; index: number } | { kind: "qris" };

// Bentuk data yang dibandingkan untuk mendeteksi perubahan belum disimpan (baris kosong diabaikan).
function snapshot(accounts: KasBankAccount[], qrisUrl: string | null) {
  const filled = accounts
    .filter((a) => a.bank.trim() || a.number.trim() || a.holder.trim() || a.logoUrl)
    .map((a) => [a.bank.trim(), a.number.trim(), a.holder.trim(), a.logoUrl ?? null]);
  return JSON.stringify([filled, qrisUrl ?? null]);
}

// Metode pembayaran iuran (Kelola Kas → Pengaturan): daftar rekening + gambar QRIS. Semuanya
// ditampilkan ke anggota di halaman Uang Kas; pratinjau di bawah form menunjukkan tampilannya.
export function KasPaymentForm({ banks, qrisUrl: initialQris }: { banks: KasBankAccount[]; qrisUrl: string | null }) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<KasBankAccount[]>(banks.length ? banks : [{ bank: "", number: "", holder: "" }]);
  const [qrisUrl, setQrisUrl] = useState<string | null>(initialQris);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Indeks rekening yang logonya sedang diunggah (satu per satu).
  const [uploadingLogo, setUploadingLogo] = useState<number | null>(null);
  // Hapus rekening/logo/QRIS selalu lewat konfirmasi dulu.
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);

  // Perubahan (termasuk gambar yang baru diunggah) baru tersimpan setelah klik Simpan. Selama
  // belum disimpan, form menandainya dan browser memperingatkan sebelum halaman di-refresh /
  // ditinggalkan — supaya gambar yang sudah diunggah tidak hilang tanpa disadari.
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshot(banks, initialQris));
  const isDirty = snapshot(accounts, qrisUrl) !== savedSnapshot;

  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const update = (index: number, field: keyof KasBankAccount, value: string | null) =>
    setAccounts((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  const remove = (index: number) => setAccounts((prev) => prev.filter((_, i) => i !== index));
  const add = () => setAccounts((prev) => (prev.length >= KAS_MAX_BANKS ? prev : [...prev, { bank: "", number: "", holder: "" }]));

  const checkImage = (file: File, label: string) => {
    if (!QRIS_ACCEPT.split(",").includes(file.type)) return `${label} harus JPG, PNG, atau WebP.`;
    if (file.size > MAX_PROOF_MB * 1024 * 1024) return `Ukuran ${label.toLowerCase()} maksimal ${MAX_PROOF_MB} MB.`;
    return null;
  };

  const handleLogo = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const invalid = checkImage(file, "Logo bank");
    if (invalid) return setError(invalid);
    setError(null);
    setUploadingLogo(index);
    try {
      update(index, "logoUrl", await uploadKasAsset(file, "logo"));
      toast.success("Logo terunggah. Klik Simpan untuk menerapkan.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengunggah logo.";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploadingLogo(null);
    }
  };

  const handleQris = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const invalid = checkImage(file, "Gambar QRIS");
    if (invalid) return setError(invalid);
    setError(null);
    setIsUploading(true);
    try {
      setQrisUrl(await uploadKasAsset(file, "qris"));
      toast.success("Gambar QRIS terunggah. Klik Simpan untuk menerapkan.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengunggah gambar QRIS.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  // Pratinjau hanya memuat rekening yang nomornya sudah diisi.
  const previewBanks = accounts.filter((a) => a.number.trim()).map((a) => ({ bank: a.bank.trim() || "Bank", number: a.number.trim(), holder: a.holder.trim(), logoUrl: a.logoUrl ?? null }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const result = await updateKasPaymentAction({ accounts, qrisUrl });
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error);
      toast.error(result.error ?? "Gagal menyimpan");
      return;
    }
    toast.success("Metode pembayaran disimpan.");
    setSavedSnapshot(snapshot(accounts, qrisUrl));
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ModalError message={error} onDismiss={() => setError(null)} />

      {/* Rekening */}
      <div className="space-y-3">
        <p className={labelClass}>Rekening Tujuan</p>
        {accounts.map((account, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 dark:border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-500 dark:text-neutral-400">Rekening {i + 1}</p>
              <button
                type="button"
                onClick={() => (account.bank || account.number || account.holder || account.logoUrl ? setConfirmTarget({ kind: "account", index: i }) : remove(i))}
                aria-label={`Hapus rekening ${i + 1}`}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <Trash2 size={13} />
                Hapus
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input value={account.bank} onChange={(e) => update(i, "bank", e.target.value)} maxLength={40} className={inputClass} placeholder="Nama bank, mis. SeaBank" aria-label="Nama bank" />
              <input inputMode="numeric" value={account.number} onChange={(e) => update(i, "number", e.target.value)} maxLength={34} className={inputClass} placeholder="Nomor rekening" aria-label="Nomor rekening" />
              <input value={account.holder} onChange={(e) => update(i, "holder", e.target.value)} maxLength={80} className={inputClass} placeholder="Atas nama" aria-label="Atas nama" />
            </div>
            <LogoField
              account={account}
              uploading={uploadingLogo === i}
              onPick={(e) => handleLogo(i, e)}
              onRemove={() => setConfirmTarget({ kind: "logo", index: i })}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          disabled={accounts.length >= KAS_MAX_BANKS}
          className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 dark:border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-red-300 hover:text-red-600 dark:hover:text-rose-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          Tambah Rekening
        </button>
        <p className="text-[11px] text-slate-500">Maksimal {KAS_MAX_BANKS} rekening. Hapus semua rekening kalau tidak ingin menampilkan rekening ke anggota.</p>
      </div>

      {/* QRIS */}
      <div>
        <p className={labelClass}>Gambar QRIS (Opsional)</p>
        {qrisUrl ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-slate-200 dark:border-white/10 p-4">
            <div className="w-36 shrink-0 rounded-xl bg-white border border-slate-200 p-2">
              <Image src={qrisUrl} alt="Pratinjau QRIS" width={600} height={600} sizes="144px" className="h-auto w-full" />
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                {isUploading ? <Loader2 size={15} className="animate-spin" /> : <ImageUp size={15} />}
                {isUploading ? "Mengunggah..." : "Ganti Gambar"}
                <input type="file" accept={QRIS_ACCEPT} className="hidden" onChange={handleQris} disabled={isUploading} />
              </label>
              <button
                type="button"
                onClick={() => setConfirmTarget({ kind: "qris" })}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-rose-400 bg-red-50 dark:bg-rose-950/30 hover:bg-red-100 dark:hover:bg-rose-950/50 transition-colors"
              >
                <Trash2 size={15} />
                Hapus QRIS
              </button>
            </div>
          </div>
        ) : (
          <label className="flex w-full min-w-0 cursor-pointer items-center gap-3 overflow-hidden rounded-xl border-2 border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/5 px-4 py-4 hover:border-red-300 dark:hover:border-rose-800 transition-colors">
            {isUploading ? <Loader2 size={22} className="shrink-0 animate-spin text-slate-400" /> : <QrCode size={22} className="shrink-0 text-slate-400" />}
            <span className="min-w-0 text-sm">
              <span className="block font-semibold text-slate-700 dark:text-slate-200">{isUploading ? "Mengunggah..." : "Pilih gambar QRIS"}</span>
              <span className="block text-[11px] text-slate-500">JPG, PNG, atau WebP · Maks {MAX_PROOF_MB} MB</span>
            </span>
            <input type="file" accept={QRIS_ACCEPT} className="hidden" onChange={handleQris} disabled={isUploading} />
          </label>
        )}
      </div>

      {/* Pratinjau */}
      <div>
        <p className={labelClass}>Pratinjau di halaman anggota</p>
        {previewBanks.length > 0 || qrisUrl ? (
          <div className="max-w-md">
            <PaymentMethods banks={previewBanks} qrisUrl={qrisUrl} />
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-neutral-400">Belum ada metode pembayaran — kartu Metode Pembayaran tidak ditampilkan ke anggota.</p>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3">
        {isDirty && (
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <AlertCircle size={14} />
            Ada perubahan yang belum disimpan.
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting || isUploading || uploadingLogo !== null}
          className="px-5 py-2.5 rounded-xl font-semibold text-white bg-red-600 dark:bg-rose-600 hover:bg-red-700 dark:hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? "Menyimpan..." : "Simpan Metode Pembayaran"}
        </button>
      </div>

      <ConfirmModal
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (!confirmTarget) return;
          if (confirmTarget.kind === "account") remove(confirmTarget.index);
          else if (confirmTarget.kind === "logo") update(confirmTarget.index, "logoUrl", null);
          else setQrisUrl(null);
          setConfirmTarget(null);
        }}
        offsetSidebar={false}
        title={confirmTarget?.kind === "qris" ? "Hapus gambar QRIS?" : confirmTarget?.kind === "logo" ? "Hapus logo bank?" : "Hapus rekening ini?"}
        description={
          confirmTarget?.kind === "account"
            ? `Rekening ${accounts[confirmTarget.index]?.bank || ""} ${accounts[confirmTarget.index]?.number || ""} akan dihapus dari daftar. Perubahan berlaku setelah klik Simpan Metode Pembayaran.`
            : "Gambar akan dihapus. Perubahan berlaku setelah klik Simpan Metode Pembayaran."
        }
        confirmText="Ya, Hapus"
      />
    </form>
  );
}

// Logo bank satu rekening: pratinjau + unggah/ganti/hapus. Tanpa logo, nama bank yang ditampilkan.
function LogoField({ account, uploading, onPick, onRemove }: { account: KasBankAccount; uploading: boolean; onPick: (e: React.ChangeEvent<HTMLInputElement>) => void; onRemove: () => void }) {
  const src = account.logoUrl ?? null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <div className="flex h-12 w-28 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-1.5">
        {src ? (
          <Image src={src} alt={account.bank || "Logo bank"} width={240} height={80} sizes="112px" className="max-h-full w-auto object-contain" />
        ) : (
          <Landmark size={18} className="text-slate-400" />
        )}
      </div>
      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
        {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImageUp size={13} />}
        {uploading ? "Mengunggah..." : account.logoUrl ? "Ganti Logo" : "Unggah Logo"}
        <input type="file" accept={QRIS_ACCEPT} className="hidden" onChange={onPick} disabled={uploading} />
      </label>
      {account.logoUrl && (
        <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/30 transition-colors">
          <X size={13} />
          Hapus Logo
        </button>
      )}
      <p className="w-full text-[11px] text-slate-500">
        {account.logoUrl ? "Memakai logo yang diunggah." : "Opsional. Tanpa logo, nama bank yang ditampilkan."}
      </p>
    </div>
  );
}
