// Pengubah data agenda menjadi rincian siap tampil di email: ubin tanggal, waktu + durasi, lokasi,
// tautan, audiens, deskripsi, catatan — dan daftar "yang berubah" antara dua versi agenda. Murni
// (tanpa database/jaringan), jadi bisa diuji dan dipakai kanal mana pun.
import { MONTH_NAMES, MONTH_SHORT, dateInJakarta, timeInJakarta } from "@/lib/date";
import { describeAudience, type Agenda } from "@/lib/agenda";

const DAY_LONG = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export type EmailDetails = {
  tile: { weekday: string; day: string; month: string; year: string };
  dateLabel: string;
  /** null = tidak ada keterangan jam (agenda sepanjang hari sudah ditulis di sini). */
  timeLabel: string;
  durationLabel: string | null;
  location: string | null;
  link: string | null;
  locationNote: string | null;
  audience: string;
  description: string | null;
  note: string | null;
};

export type EmailChange = { label: string; from: string; to: string };

function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

function longDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${DAY_LONG[weekdayOf(date)]}, ${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

function formatDuration(minutes: number): string | null {
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h && m) return `${h} jam ${m} menit`;
  if (h) return `${h} jam`;
  return `${m} menit`;
}

export function buildEmailDetails(agenda: Agenda): EmailDetails {
  const startDate = dateInJakarta(agenda.startAt);
  const endDate = agenda.endAt ? dateInJakarta(agenda.endAt) : "";
  const multiDay = !!endDate && endDate !== startDate;
  const [y, m, d] = startDate.split("-").map(Number);

  let dateLabel = longDate(startDate);
  if (multiDay) dateLabel = `${longDate(startDate)} – ${longDate(endDate)}`;

  let timeLabel: string;
  let durationLabel: string | null = null;
  if (agenda.allDay) {
    timeLabel = "Sepanjang hari";
    if (multiDay) {
      const days = Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000) + 1;
      durationLabel = `${days} hari`;
    }
  } else if (agenda.endAt) {
    timeLabel = multiDay ? `${timeInJakarta(agenda.startAt)} WIB, hingga ${timeInJakarta(agenda.endAt)} WIB` : `${timeInJakarta(agenda.startAt)} – ${timeInJakarta(agenda.endAt)} WIB`;
    if (!multiDay) durationLabel = formatDuration((Date.parse(agenda.endAt) - Date.parse(agenda.startAt)) / 60_000);
  } else {
    timeLabel = `Mulai pukul ${timeInJakarta(agenda.startAt)} WIB`;
  }

  const detail = agenda.locationDetail?.trim() || null;
  const isUrl = !!detail && /^https?:\/\//i.test(detail);

  return {
    tile: { weekday: DAY_LONG[weekdayOf(startDate)], day: String(d), month: MONTH_SHORT[m - 1].toUpperCase(), year: String(y) },
    dateLabel,
    timeLabel,
    durationLabel,
    location: agenda.location?.trim() || null,
    link: isUrl ? detail : null,
    locationNote: !isUrl ? detail : null,
    audience: describeAudience(agenda),
    description: agenda.description?.trim() || null,
    note: agenda.internalNote?.trim() || null,
  };
}

// Apa saja yang berubah antara dua versi agenda — untuk kotak "Yang berubah" di email
// "Agenda diperbarui". Hanya yang benar-benar berbeda; kosong -> "—".
export function describeChanges(before: Agenda, after: Agenda): EmailChange[] {
  const a = buildEmailDetails(before);
  const b = buildEmailDetails(after);
  const out: EmailChange[] = [];
  const dash = (v: string | null) => v || "—";
  if (before.title !== after.title) out.push({ label: "Judul", from: before.title, to: after.title });
  if (a.dateLabel !== b.dateLabel) out.push({ label: "Tanggal", from: a.dateLabel, to: b.dateLabel });
  if (a.timeLabel !== b.timeLabel) out.push({ label: "Waktu", from: a.timeLabel, to: b.timeLabel });
  if (a.location !== b.location) out.push({ label: "Lokasi", from: dash(a.location), to: dash(b.location) });
  const linkA = a.link ?? a.locationNote;
  const linkB = b.link ?? b.locationNote;
  if (linkA !== linkB) out.push({ label: "Tautan / detail lokasi", from: dash(linkA), to: dash(linkB) });
  return out;
}
