"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Clock, ExternalLink, Pencil, Search, Trash2 } from "lucide-react";

import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { KasModal, ModalActions, ModalError } from "@/components/kas/KasModal";
import { STATUS_CLASS, STATUS_LABEL, inputClass, labelClass } from "@/components/kas/KasUi";
import { deleteIuranAction, recordIuranAction, updateIuranAction } from "@/app/actions/kas";
import { formatDate, formatPeriod, formatRupiah, monthStatus, MONTH_SHORT, paymentStatus, periodsOfYear, todayInJakarta, type IuranPayment, type KasSetting } from "@/lib/kas";

type Member = { id: string; name: string; jabatan: string | null };
type Payment = IuranPayment & { userId: string };

interface IuranMatrixProps {
  members: Member[];
  payments: Payment[];
  arrears: Record<string, number>;
  setting: KasSetting;
  year: number;
  nowPeriod: string;
}

export function IuranMatrix({ members, payments, arrears, setting, year, nowPeriod }: IuranMatrixProps) {
  const [query, setQuery] = useState("");
  const [recordTarget, setRecordTarget] = useState<{ member: Member; period: string } | null>(null);
  const [detailTarget, setDetailTarget] = useState<{ member: Member; payment: Payment } | null>(null);

  const periods = periodsOfYear(year);
  const paymentMap = useMemo(() => new Map(payments.map((p) => [`${p.userId}:${p.period}`, p])), [payments]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.name.toLowerCase().includes(q) || (m.jabatan ?? "").toLowerCase().includes(q));
  }, [members, query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama atau jabatan..." className={`${inputClass} pl-10 py-2.5 text-sm`} />
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
          {(["LUNAS", "MENUNGGU", "BELUM", "MENDATANG", "TIDAK_BERLAKU"] as const).map((s) => (
            <span key={s} className={`inline-flex items-center rounded-full border px-2.5 py-1 ${STATUS_CLASS[s]}`}>
              {STATUS_LABEL[s]}
            </span>
          ))}
        </div>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-neutral-400 text-center py-10">Belum ada akun anggota ber-role User. Akun anggota dibuat oleh Admin di panel Manajemen User.</p>
      ) : (
        <div className="max-h-[60vh] overflow-auto rounded-2xl border border-slate-200 dark:border-white/10">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="sticky top-0 z-20 bg-slate-50 dark:bg-[#18181b] text-[11px] uppercase tracking-wider text-slate-500 dark:text-neutral-400 shadow-[0_1px_0_rgb(226,232,240)] dark:shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                <th className="sticky left-0 z-30 bg-slate-50 dark:bg-[#18181b] text-left font-bold px-4 py-3 min-w-44">Anggota</th>
                {MONTH_SHORT.map((m) => (
                  <th key={m} className="font-bold px-1 py-3 text-center min-w-11">
                    {m}
                  </th>
                ))}
                <th className="font-bold px-4 py-3 text-right min-w-28">Tunggakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="sticky left-0 z-10 bg-white dark:bg-[#121215] px-4 py-2.5">
                    <p className="font-bold text-slate-800 dark:text-white truncate max-w-44">{member.name}</p>
                    {member.jabatan && <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate max-w-44">{member.jabatan}</p>}
                  </td>
                  {periods.map((period) => {
                    const payment = paymentMap.get(`${member.id}:${period}`);
                    const status = monthStatus(period, paymentStatus(payment), setting, nowPeriod);
                    return (
                      <td key={period} className="px-1 py-2.5 text-center">
                        <button
                          type="button"
                          title={`${formatPeriod(period)} — ${STATUS_LABEL[status]}`}
                          onClick={() => (payment ? setDetailTarget({ member, payment }) : setRecordTarget({ member, period }))}
                          className={`w-9 h-9 inline-flex items-center justify-center rounded-xl border transition hover:scale-110 ${STATUS_CLASS[status]}`}
                        >
                          {status === "MENUNGGU" ? <Clock size={15} strokeWidth={2.5} /> : payment ? <Check size={15} strokeWidth={3} /> : <span className="text-xs">–</span>}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {arrears[member.id] ? (
                      <span className="text-xs font-bold text-red-600 dark:text-rose-400">
                        {arrears[member.id]} bln
                        <span className="block text-[11px] font-semibold text-slate-500 dark:text-neutral-400">{formatRupiah(arrears[member.id] * setting.monthlyFee)}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Tidak ada</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={14} className="text-center text-sm text-slate-500 dark:text-neutral-400 py-8">
                    Tidak ada anggota yang cocok dengan &ldquo;{query}&rdquo;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <RecordIuranModal target={recordTarget} onClose={() => setRecordTarget(null)} periods={periods} paymentMap={paymentMap} setting={setting} />

      <PaymentDetailModal target={detailTarget} onClose={() => setDetailTarget(null)} />
    </div>
  );
}

function RecordIuranModal({
  target,
  onClose,
  periods,
  paymentMap,
  setting,
}: {
  target: { member: Member; period: string } | null;
  onClose: () => void;
  periods: string[];
  paymentMap: Map<string, Payment>;
  setting: KasSetting;
}) {
  const router = useRouter();
  const [shown, setShown] = useState<typeof target>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form di-reset setiap kali dibuka untuk sel lain. Dilakukan saat render (bukan useEffect,
  // pola yang sama dengan Navbar.tsx), dan `shown` sengaja tidak ikut dikosongkan saat ditutup
  // supaya isi modal tetap terlihat selama animasi keluar.
  if (target && target !== shown) {
    setShown(target);
    setSelected([target.period]);
    setAmount(setting.monthlyFee ? String(setting.monthlyFee) : "");
    setPaidAt(todayInJakarta());
    setNote("");
    setError(null);
  }

  const unpaidPeriods = shown ? periods.filter((p) => !paymentMap.has(`${shown.member.id}:${p}`)) : [];

  const perMonth = Number(amount.replace(/[^\d]/g, "")) || 0;

  const toggle = (period: string) => setSelected((prev) => (prev.includes(period) ? prev.filter((p) => p !== period) : [...prev, period].sort()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shown) return;
    setIsSubmitting(true);
    setError(null);
    const result = await recordIuranAction({ userId: shown.member.id, periods: selected, amount, paidAt, note });
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error);
      toast.error(result.error ?? "Gagal menyimpan");
      return;
    }
    toast.success(`Iuran ${shown.member.name} berhasil dicatat.`);
    router.refresh();
    onClose();
  };

  return (
    <KasModal isOpen={!!target} onClose={onClose} disableClose={isSubmitting} title="Catat Pembayaran Iuran" description={shown ? `Anggota: ${shown.member.name}` : undefined}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <ModalError message={error} onDismiss={() => setError(null)} />

        <div>
          <label className={labelClass}>Bulan yang Dibayar</label>
          <div className="grid grid-cols-4 gap-2">
            {unpaidPeriods.map((period) => {
              const active = selected.includes(period);
              return (
                <button
                  key={period}
                  type="button"
                  onClick={() => toggle(period)}
                  className={`rounded-xl border px-2 py-2 text-xs font-bold transition ${
                    active ? "bg-red-600 dark:bg-rose-600 border-red-600 dark:border-rose-600 text-white" : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-red-300"
                  }`}
                >
                  {MONTH_SHORT[Number(period.slice(5)) - 1]}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">Pilih beberapa bulan sekaligus untuk pembayaran rapel. Bulan yang sudah lunas tidak ditampilkan.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nominal per Bulan (Rp)</label>
            <input inputMode="numeric" required value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} placeholder="10000" />
          </div>
          <div>
            <label className={labelClass}>Tanggal Bayar</label>
            <input type="date" required value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Catatan (Opsional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className={inputClass} placeholder="mis. Transfer BRI / tunai saat rapat" />
        </div>

        <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3 flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-neutral-400">
            Total {selected.length} bulan
          </span>
          <span className="font-extrabold text-slate-900 dark:text-white">{formatRupiah(perMonth * selected.length)}</span>
        </div>

        <ModalActions onCancel={onClose} isSubmitting={isSubmitting} submitLabel="Simpan Pembayaran" />
      </form>
    </KasModal>
  );
}

function PaymentDetailModal({ target, onClose }: { target: { member: Member; payment: Payment } | null; onClose: () => void }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Mode edit manual (bendahara): nominal, tanggal bayar, catatan, dan status.
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"LUNAS" | "MENUNGGU">("LUNAS");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data ditahan selama animasi tutup, supaya isi modal tidak kosong mendadak saat memudar.
  // Setiap kali dibuka untuk catatan lain, modal kembali ke tampilan detail (bukan form edit).
  const [shown, setShown] = useState(target);
  if (target && target !== shown) {
    setShown(target);
    setEditing(false);
    setError(null);
  }

  const startEdit = () => {
    if (!shown) return;
    setAmount(String(shown.payment.amount));
    setPaidAt(shown.payment.paidAt);
    setNote(shown.payment.note ?? "");
    setStatus(paymentStatus(shown.payment) === "MENUNGGU" ? "MENUNGGU" : "LUNAS");
    setError(null);
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shown) return;
    setIsSaving(true);
    setError(null);
    const result = await updateIuranAction({ id: shown.payment.id, amount, paidAt, note, status });
    setIsSaving(false);
    if (!result.success) {
      setError(result.error);
      toast.error(result.error ?? "Gagal menyimpan");
      return;
    }
    toast.success("Catatan iuran diperbarui.");
    router.refresh();
    onClose();
  };

  const handleDelete = async () => {
    if (!shown) return;
    setIsDeleting(true);
    const result = await deleteIuranAction(shown.payment.id);
    setIsDeleting(false);
    if (!result.success) {
      toast.error(result.error ?? "Gagal membatalkan");
      return;
    }
    toast.success("Catatan iuran dibatalkan.");
    setConfirmOpen(false);
    router.refresh();
    onClose();
  };

  return (
    <>
      <KasModal
        isOpen={!!target && !confirmOpen}
        onClose={onClose}
        disableClose={isSaving}
        title={editing ? "Ubah Pembayaran" : "Detail Pembayaran"}
        description={shown ? `Anggota: ${shown.member.name} · ${formatPeriod(shown.payment.period)}` : undefined}
      >
        {shown && editing && (
          <form onSubmit={handleSave} className="space-y-5">
            <ModalError message={error} onDismiss={() => setError(null)} />

            <div>
              <label className={labelClass}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as "LUNAS" | "MENUNGGU")} className={inputClass}>
                <option value="LUNAS">{STATUS_LABEL.LUNAS}</option>
                {shown.payment.proofUrl && <option value="MENUNGGU">{STATUS_LABEL.MENUNGGU}</option>}
              </select>
              <p className="text-[11px] text-slate-500 mt-1.5">Untuk menjadikan &ldquo;Belum Bayar&rdquo;, gunakan tombol Batalkan pada detail pembayaran.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nominal (Rp)</label>
                <input inputMode="numeric" required value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Tanggal Bayar</label>
                <input type="date" required value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Catatan (Opsional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className={inputClass} />
            </div>

            <ModalActions onCancel={() => setEditing(false)} isSubmitting={isSaving} submitLabel="Simpan Perubahan" />
          </form>
        )}

        {shown && !editing && (
          <div className="space-y-5">
            <dl className="rounded-2xl border border-slate-200 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/10 text-sm">
              {[
                ["Status", STATUS_LABEL[paymentStatus(shown.payment) === "MENUNGGU" ? "MENUNGGU" : "LUNAS"]],
                ["Periode", formatPeriod(shown.payment.period)],
                ["Nominal", formatRupiah(shown.payment.amount)],
                ["Tanggal Bayar", formatDate(shown.payment.paidAt)],
                ["Catatan", shown.payment.note || "-"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-3">
                  <dt className="text-slate-500 dark:text-neutral-400">{k}</dt>
                  <dd className="font-semibold text-slate-800 dark:text-white text-right">{v}</dd>
                </div>
              ))}
            </dl>

            {/* Bukti dari anggota (kalau iuran ini diunggah lewat /kas). Konfirmasi/tolak ada di tab Konfirmasi. */}
            {shown.payment.proofUrl && (
              <a
                href={`/kas/bukti/${shown.payment.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <ExternalLink size={16} />
                Lihat Bukti Pembayaran
              </a>
            )}

            <div className="flex gap-3 justify-between pt-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-red-600 dark:text-rose-400 bg-red-50 dark:bg-rose-950/30 hover:bg-red-100 dark:hover:bg-rose-950/50 transition-colors"
              >
                <Trash2 size={16} />
                Batalkan
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={startEdit}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-red-600 dark:bg-rose-600 hover:bg-red-700 dark:hover:bg-rose-700 transition-colors shadow-sm"
                >
                  <Pencil size={16} />
                  Ubah
                </button>
              </div>
            </div>
          </div>
        )}
      </KasModal>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        offsetSidebar={false}
        title="Batalkan catatan iuran?"
        description={shown ? `Iuran ${formatPeriod(shown.payment.period)} milik ${shown.member.name} akan kembali berstatus belum dibayar.` : ""}
        confirmText="Ya, Batalkan"
      />
    </>
  );
}
