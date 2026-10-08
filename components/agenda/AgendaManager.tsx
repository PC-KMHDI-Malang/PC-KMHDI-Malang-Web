"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BellRing, Check, Eye, EyeOff, MapPin, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

import { announceAgendaAction, announcePendingAgendaAction, createAgendaAction, deleteAgendaAction, sendAgendaUpdateAction, setAgendaPublishedAction, updateAgendaAction } from "@/app/actions/agenda";
import { AGENDA_KINDS, AGENDA_KIND_LABEL, AGENDA_STATUS_LABEL, agendaStatus, canAnnounceAgenda, describeAudience, formatAgendaRange, type Agenda, type AgendaInput, type AgendaKind } from "@/lib/agenda";
import { BIDANG_OPTIONS } from "@/lib/bidang";
import { MONTH_SHORT, dateInJakarta, timeInputInJakarta } from "@/lib/date";
import { hasPendingChange } from "@/lib/notify/content";
import { describeChanges } from "@/lib/notify/emailDetails";
import { KasModal, ModalActions, ModalError } from "@/components/kas/KasModal";
import { dateInputClass, inputClass, labelClass } from "@/components/kas/KasUi";
import { KIND_CLASS } from "@/components/agenda/AgendaCalendar";

// Seluruh interaksi tulis sekretaris: tambah, ubah, terbit/tarik, umumkan, hapus. Setiap tombol
// memanggil Server Action yang memeriksa sesinya sendiri (requireSecretary) — komponen ini tidak
// menentukan siapa yang boleh, hanya merapikan tampilannya. Setelah action sukses, revalidatePath
// di server yang menyegarkan daftar; tidak ada state daftar lokal yang bisa basi.
//
// Menerbitkan agenda TIDAK mengirim notifikasi: itu hanya memunculkannya di kalender. Pengumuman
// ke anggota selalu lewat tombol "Kirim notifikasi" (per agenda, atau "Umumkan semua"). Agenda yang
// sudah diumumkan lalu diubah ditandai "Ada perubahan" dan baru dikabarkan lewat "Kirim pembaruan".

type FormState = {
  title: string;
  kind: AgendaKind;
  allDay: boolean;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  locationDetail: string;
  internalNote: string;
  description: string;
  remindH1: boolean;
  audience: "SEMUA" | "BIDANG";
  audienceBidang: string[];
};

const EMPTY_FORM: FormState = {
  title: "",
  kind: "KEGIATAN",
  allDay: false,
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  location: "",
  locationDetail: "",
  internalNote: "",
  description: "",
  // Menyala secara default: pengingat sehari sebelum acara umumnya diinginkan, dan hanya mengingatkan
  // agenda yang memang sudah ada di kalender.
  remindH1: true,
  audience: "SEMUA",
  audienceBidang: [],
};

function formFromAgenda(agenda: Agenda): FormState {
  // Agenda sepanjang hari menyimpan endAt di 23:59:59; jam itu tidak ditampilkan ke form.
  return {
    title: agenda.title,
    kind: agenda.kind,
    allDay: agenda.allDay,
    startDate: dateInJakarta(agenda.startAt),
    startTime: agenda.allDay ? "" : timeInputInJakarta(agenda.startAt),
    endDate: agenda.endAt ? dateInJakarta(agenda.endAt) : "",
    endTime: agenda.allDay || !agenda.endAt ? "" : timeInputInJakarta(agenda.endAt),
    location: agenda.location ?? "",
    locationDetail: agenda.locationDetail ?? "",
    internalNote: agenda.internalNote ?? "",
    description: agenda.description ?? "",
    remindH1: !!agenda.remindH1,
    audience: agenda.audience,
    audienceBidang: agenda.audienceBidang ?? [],
  };
}

// "8 Okt" dari timestamp WIB.
function shortDate(iso: string): string {
  const date = dateInJakarta(iso);
  if (!date) return "";
  const [, m, d] = date.split("-").map(Number);
  return `${d} ${MONTH_SHORT[m - 1]}`;
}

const primaryButton =
  "inline-flex items-center gap-1.5 rounded-xl bg-red-600 dark:bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 dark:hover:bg-rose-700 transition-colors disabled:opacity-40";

const secondaryButton =
  "inline-flex items-center gap-1.5 rounded-xl bg-slate-50 dark:bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-40";

export function AgendaManager({ items }: { items: Agenda[] }) {
  const [editing, setEditing] = useState<Agenda | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Agenda | null>(null);
  const [announcing, setAnnouncing] = useState<Agenda | null>(null);
  const [announcingAll, setAnnouncingAll] = useState(false);
  const [updating, setUpdating] = useState<Agenda | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Yang masih bisa diumumkan: terbit, belum lewat, dan belum pernah diumumkan.
  const pendingAnnounce = items.filter((agenda) => canAnnounceAgenda(agenda) && !agenda.announcedAt);

  function togglePublished(agenda: Agenda) {
    setRowError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await setAgendaPublishedAction(agenda.id, agenda.status !== "PUBLISHED");
      if (!result.success) setRowError(result.error);
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    setRowError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await deleteAgendaAction(target.id);
      if (result.success) setDeleting(null);
      else {
        setDeleting(null);
        setRowError(result.error);
      }
    });
  }

  function confirmAnnounce() {
    if (!announcing) return;
    const target = announcing;
    setRowError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await announceAgendaAction(target.id);
      setAnnouncing(null);
      if (result.success) setNotice(`Notifikasi "${target.title}" sedang dikirim ke anggota.`);
      else setRowError(result.error);
    });
  }

  function confirmSendUpdate() {
    if (!updating) return;
    const target = updating;
    setRowError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await sendAgendaUpdateAction(target.id);
      setUpdating(null);
      if (result.success) setNotice(`Pembaruan "${target.title}" sedang dikirim ke anggota.`);
      else setRowError(result.error);
    });
  }

  function confirmAnnounceAll() {
    setRowError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await announcePendingAgendaAction();
      setAnnouncingAll(false);
      if (!result.success) setRowError(result.error);
      else setNotice(result.count ? `Notifikasi ${result.count} agenda sedang dikirim ke anggota.` : "Tidak ada agenda yang perlu diumumkan.");
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-end gap-2 mb-5">
        {pendingAnnounce.length >= 2 && (
          <button type="button" disabled={pending} onClick={() => setAnnouncingAll(true)} className="inline-flex items-center gap-2 rounded-2xl border border-red-200 dark:border-rose-900/60 bg-red-50 dark:bg-rose-950/30 px-4 py-2.5 text-sm font-bold text-red-700 dark:text-rose-300 hover:bg-red-100 dark:hover:bg-rose-950/50 transition-colors disabled:opacity-40">
            <BellRing size={16} />
            Umumkan semua yang belum ({pendingAnnounce.length})
          </button>
        )}
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-red-600 dark:bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-700 dark:hover:bg-rose-700 transition-colors"
        >
          <Plus size={16} />
          Tambah Agenda
        </button>
      </div>

      {rowError && (
        <div className="mb-4">
          <ModalError message={rowError} onDismiss={() => setRowError(null)} />
        </div>
      )}

      {notice && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          <span className="inline-flex items-center gap-2">
            <Check size={16} className="shrink-0" /> {notice}
          </span>
          <button type="button" onClick={() => setNotice(null)} className="font-bold text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-200" aria-label="Tutup">
            &times;
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-neutral-400 py-6 text-center">Belum ada agenda di tab ini.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((agenda) => {
            const published = agenda.status === "PUBLISHED";
            const announceable = canAnnounceAgenda(agenda);
            // Sudah diumumkan, tapi judul/jadwal/tempat/tautannya berbeda dari yang terakhir diketahui anggota.
            const changed = announceable && hasPendingChange(agenda);
            return (
              <li key={agenda.id} className="rounded-2xl border border-slate-200/80 dark:border-white/10 p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${KIND_CLASS[agenda.kind]}`}>{AGENDA_KIND_LABEL[agenda.kind]}</span>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                      published
                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400"
                        : "bg-slate-100 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {published ? "Terbit" : "Draft"}
                  </span>
                  {agenda.announcedAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-950/30 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 dark:text-sky-300">
                      <BellRing size={11} /> Diumumkan {shortDate(agenda.announcedAt)}
                    </span>
                  ) : (
                    announceable && <span className="inline-flex rounded-full border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">Belum diumumkan</span>
                  )}
                  {changed && <span className="inline-flex rounded-full border border-orange-300 dark:border-orange-800/60 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-0.5 text-[11px] font-bold text-orange-700 dark:text-orange-300">Ada perubahan</span>}
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">{AGENDA_STATUS_LABEL[agendaStatus(agenda)]}</span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white">{agenda.title}</h3>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-neutral-400">
                  <span>{formatAgendaRange(agenda)}</span>
                  {agenda.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={13} /> {agenda.location}
                    </span>
                  )}
                  <span>Penerima: {describeAudience(agenda)}</span>
                  <span>Pengingat H-1: {agenda.remindH1 ? "aktif" : "mati"}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {changed && (
                    <button type="button" disabled={pending} onClick={() => setUpdating(agenda)} className={primaryButton}>
                      <BellRing size={13} /> Kirim pembaruan
                    </button>
                  )}
                  {announceable && !changed && (
                    <button type="button" disabled={pending} onClick={() => setAnnouncing(agenda)} className={agenda.announcedAt ? secondaryButton : primaryButton}>
                      {agenda.announcedAt ? <RefreshCw size={13} /> : <BellRing size={13} />}
                      {agenda.announcedAt ? "Kirim ulang" : "Kirim notifikasi"}
                    </button>
                  )}
                  {published && (
                    <Link href={`/agenda/${agenda.slug}`} className={secondaryButton}>
                      <Eye size={13} /> Detail acara
                    </Link>
                  )}
                  <button type="button" disabled={pending} onClick={() => setEditing(agenda)} className={secondaryButton}>
                    <Pencil size={13} /> Ubah
                  </button>
                  <button type="button" disabled={pending} onClick={() => togglePublished(agenda)} className={secondaryButton}>
                    {published ? <EyeOff size={13} /> : <Eye size={13} />}
                    {published ? "Tarik jadi draft" : "Terbitkan"}
                  </button>
                  <button type="button" disabled={pending} onClick={() => setDeleting(agenda)} className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 dark:bg-rose-950/30 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-rose-400 hover:bg-red-100 dark:hover:bg-rose-950/50 transition-colors disabled:opacity-40">
                    <Trash2 size={13} /> Hapus
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {creating && <AgendaFormModal key="create" mode="create" onClose={() => setCreating(false)} />}
      {editing && <AgendaFormModal key={editing.id} mode="edit" agenda={editing} onClose={() => setEditing(null)} />}

      <KasModal isOpen={!!deleting} onClose={() => setDeleting(null)} disableClose={pending} title="Hapus agenda?" description={deleting ? `"${deleting.title}" akan dihapus permanen dan tidak bisa dikembalikan.` : undefined}>
        <ConfirmButtons onCancel={() => setDeleting(null)} onConfirm={confirmDelete} pending={pending} label="Hapus" pendingLabel="Menghapus..." />
      </KasModal>

      <KasModal
        isOpen={!!announcing}
        onClose={() => setAnnouncing(null)}
        disableClose={pending}
        title={announcing?.announcedAt ? "Kirim ulang notifikasi?" : "Kirim notifikasi?"}
        description={
          announcing
            ? announcing.announcedAt
              ? `Hanya anggota yang sebelumnya gagal dikirimi "${announcing.title}" yang dicoba lagi. Yang sudah menerima tidak dikirimi lagi.`
              : `"${announcing.title}" akan diumumkan ke ${describeAudience(announcing).toLowerCase()} lewat lonceng dan email. Perubahan jadwal atau tempat sesudahnya tidak dikirim otomatis: agenda ditandai "Ada perubahan" dan Anda yang menekan "Kirim pembaruan".`
            : undefined
        }
      >
        <ConfirmButtons onCancel={() => setAnnouncing(null)} onConfirm={confirmAnnounce} pending={pending} label="Kirim" pendingLabel="Mengirim..." tone="primary" />
      </KasModal>

      <KasModal
        isOpen={!!updating}
        onClose={() => setUpdating(null)}
        disableClose={pending}
        title="Kirim pembaruan?"
        description={updating ? `Anggota akan diberi tahu perubahan pada "${updating.title}":` : undefined}
      >
        {updating?.notifiedSnapshot && (
          <ul className="mb-4 space-y-2 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/25 p-4 text-sm text-slate-800 dark:text-slate-200">
            {describeChanges({ ...updating, ...updating.notifiedSnapshot } as Agenda, updating).map((change) => (
              <li key={change.label}>
                <span className="font-bold">{change.label}:</span>
                <br />
                <span className="text-slate-500 dark:text-neutral-400 line-through">{change.from}</span> &rarr; <span className="font-bold">{change.to}</span>
              </li>
            ))}
          </ul>
        )}
        <ConfirmButtons onCancel={() => setUpdating(null)} onConfirm={confirmSendUpdate} pending={pending} label="Kirim pembaruan" pendingLabel="Mengirim..." tone="primary" />
      </KasModal>

      <KasModal
        isOpen={announcingAll}
        onClose={() => setAnnouncingAll(false)}
        disableClose={pending}
        title={`Umumkan ${pendingAnnounce.length} agenda?`}
        description="Semua agenda berikut diumumkan ke penerimanya masing-masing lewat lonceng dan email:"
      >
        <ul className="mb-4 max-h-48 space-y-1 overflow-y-auto text-sm text-slate-700 dark:text-slate-300">
          {pendingAnnounce.map((agenda) => (
            <li key={agenda.id} className="truncate">
              • {agenda.title}
            </li>
          ))}
        </ul>
        <ConfirmButtons onCancel={() => setAnnouncingAll(false)} onConfirm={confirmAnnounceAll} pending={pending} label="Umumkan semua" pendingLabel="Mengirim..." tone="primary" />
      </KasModal>
    </div>
  );
}

function ConfirmButtons({ onCancel, onConfirm, pending, label, pendingLabel, tone = "danger" }: { onCancel: () => void; onConfirm: () => void; pending: boolean; label: string; pendingLabel: string; tone?: "danger" | "primary" }) {
  return (
    <div className="flex gap-3 justify-end pt-2">
      <button type="button" onClick={onCancel} disabled={pending} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-40">
        Batal
      </button>
      <button type="button" onClick={onConfirm} disabled={pending} className={`px-5 py-2.5 rounded-xl font-semibold text-white transition-colors shadow-sm disabled:opacity-50 ${tone === "danger" ? "bg-red-600 dark:bg-rose-600 hover:bg-red-700 dark:hover:bg-rose-700" : "bg-red-600 dark:bg-rose-600 hover:bg-red-700 dark:hover:bg-rose-700"}`}>
        {pending ? pendingLabel : label}
      </button>
    </div>
  );
}

function AgendaFormModal({ mode, agenda, onClose }: { mode: "create" | "edit"; agenda?: Agenda; onClose: () => void }) {
  const [form, setForm] = useState<FormState>(agenda ? formFromAgenda(agenda) : EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  function toggleBidang(bidang: string) {
    setForm((prev) => ({
      ...prev,
      audienceBidang: prev.audienceBidang.includes(bidang) ? prev.audienceBidang.filter((b) => b !== bidang) : [...prev.audienceBidang, bidang],
    }));
  }

  function submit(publish: boolean) {
    setError(null);
    const input: AgendaInput = { ...form };
    startTransition(async () => {
      const result = mode === "edit" && agenda ? await updateAgendaAction(agenda.id, input) : await createAgendaAction(input, publish);
      if (result.success) onClose();
      else setError(result.error);
    });
  }

  return (
    <KasModal isOpen onClose={onClose} disableClose={pending} title={mode === "edit" ? "Ubah Agenda" : "Tambah Agenda"} description="Isi detail agenda. Agenda hanya terlihat oleh anggota yang login.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          // Submit lewat Enter = simpan tanpa menerbitkan. (Menerbitkan pun tidak mengirim notifikasi.)
          submit(false);
        }}
      >
        <ModalError message={error} onDismiss={() => setError(null)} />

        <div>
          <label className={labelClass}>Judul</label>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={120} required className={inputClass} placeholder="mis. Rapat Pleno Bulanan" />
        </div>

        <div>
          <label className={labelClass}>Jenis</label>
          <select value={form.kind} onChange={(e) => set("kind", e.target.value as AgendaKind)} className={`${inputClass} cursor-pointer`}>
            {AGENDA_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {AGENDA_KIND_LABEL[kind]}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
          <input type="checkbox" checked={form.allDay} onChange={(e) => set("allDay", e.target.checked)} className="w-4 h-4 accent-red-600" />
          Sepanjang hari (tanpa jam)
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Tanggal mulai</label>
            <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} required className={dateInputClass} />
          </div>
          {!form.allDay && (
            <div>
              <label className={labelClass}>Jam mulai (WIB)</label>
              <input type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} required className={dateInputClass} />
            </div>
          )}
          <div>
            <label className={labelClass}>Tanggal selesai (opsional)</label>
            <input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} className={dateInputClass} />
          </div>
          {!form.allDay && (
            <div>
              <label className={labelClass}>Jam selesai (opsional)</label>
              <input type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} className={dateInputClass} />
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>Lokasi</label>
          <input value={form.location} onChange={(e) => set("location", e.target.value)} maxLength={200} className={inputClass} placeholder="mis. Sekretariat PC KMHDI Malang" />
        </div>

        <div>
          <label className={labelClass}>Deskripsi</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={2000} rows={3} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Tautan rapat / detail lokasi (opsional)</label>
          <input value={form.locationDetail} onChange={(e) => set("locationDetail", e.target.value)} maxLength={500} className={inputClass} placeholder="mis. https://meet.google.com/..." />
        </div>

        <div>
          <label className={labelClass}>Catatan untuk peserta (opsional)</label>
          <textarea value={form.internalNote} onChange={(e) => set("internalNote", e.target.value)} maxLength={2000} rows={2} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Penerima notifikasi</label>
          <select value={form.audience} onChange={(e) => set("audience", e.target.value as FormState["audience"])} className={`${inputClass} cursor-pointer`}>
            <option value="SEMUA">Semua anggota</option>
            <option value="BIDANG">Bidang tertentu</option>
          </select>
          {form.audience === "BIDANG" && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BIDANG_OPTIONS.map((bidang) => (
                <label key={bidang} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.audienceBidang.includes(bidang)} onChange={() => toggleBidang(bidang)} className="w-4 h-4 accent-red-600" />
                  {bidang}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Ingatkan anggota H-1</span>
          <button
            type="button"
            role="switch"
            aria-checked={form.remindH1}
            aria-label="Ingatkan anggota H-1"
            onClick={() => set("remindH1", !form.remindH1)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${form.remindH1 ? "bg-red-600 dark:bg-rose-600" : "bg-slate-300 dark:bg-white/20"}`}
          >
            <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.remindH1 ? "translate-x-5" : ""}`} />
          </button>
        </div>

        {mode === "edit" ? (
          <ModalActions onCancel={onClose} isSubmitting={pending} submitLabel="Simpan Perubahan" />
        ) : (
          <div className="flex flex-wrap gap-3 justify-end pt-4">
            <button type="button" onClick={onClose} disabled={pending} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-40">
              Batal
            </button>
            <button type="submit" disabled={pending} className="px-5 py-2.5 rounded-xl font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors disabled:opacity-50">
              {pending ? "Menyimpan..." : "Simpan Draft"}
            </button>
            <button type="button" onClick={() => submit(true)} disabled={pending} className="px-5 py-2.5 rounded-xl font-semibold text-white bg-red-600 dark:bg-rose-600 hover:bg-red-700 dark:hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50">
              {pending ? "Menyimpan..." : "Simpan & Terbitkan"}
            </button>
          </div>
        )}
      </form>
    </KasModal>
  );
}
