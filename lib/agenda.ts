import { isProtectedAccountEmail } from "@/lib/protectedAccounts";
import { isViewerRole } from "@/lib/roles";
import { BIDANG_OPTIONS, isSameBidang, isTargetableBidang } from "@/lib/bidang";
import { DAY_SHORT, MONTH_NAMES, dateInJakarta, timeInJakarta, todayInJakarta } from "@/lib/date";

// Logika murni fitur Agenda (tanpa akses database) supaya dipakai bersama oleh halaman anggota
// (/agenda), halaman sekretaris (/agenda/kelola), Server Action di app/actions/agenda.ts,
// dispatcher notifikasi, dan unit test — semuanya menghitung status & visibilitas dengan cara
// yang sama. Sengaja TIDAK mengimpor lib/kas.ts: helper tanggal yang dipakai bersama sudah
// dipindah ke lib/date.ts, jadi kedua fitur tidak saling bergantung.

// Satu-satunya akun yang boleh mengelola agenda. Sengaja berdasarkan email, bukan role —
// meniru TREASURER_EMAIL di lib/kas.ts. Akunnya ber-role KONTRIBUTOR (supaya tetap bisa
// mengelola Artikel & e-Book di panel admin), tapi hak kelola agenda tidak berasal dari role
// itu: role dan hak agenda sengaja dua hal terpisah. Konsekuensinya ADMIN pun tidak bisa
// mengubah agenda, sama seperti ADMIN tidak bisa mengubah data kas.
export const SECRETARY_EMAIL = "sekretaris@kmhdimalang.org";

export function isSecretaryEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === SECRETARY_EMAIL;
}

// ---------------------------------------------------------------------------
// Bentuk data
// ---------------------------------------------------------------------------

export const AGENDA_KINDS = ["RAPAT", "KEGIATAN", "DEADLINE", "LAINNYA"] as const;
export type AgendaKind = (typeof AGENDA_KINDS)[number];

export const AGENDA_KIND_LABEL: Record<AgendaKind, string> = {
  RAPAT: "Rapat",
  KEGIATAN: "Kegiatan",
  DEADLINE: "Tenggat",
  LAINNYA: "Lainnya",
};

export const AGENDA_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export type AgendaStatus = (typeof AGENDA_STATUSES)[number];

export const AGENDA_AUDIENCES = ["SEMUA", "BIDANG"] as const;
export type AgendaAudience = (typeof AGENDA_AUDIENCES)[number];

/** Satu baris tabel Agenda, apa adanya dari database. */
export type Agenda = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  kind: AgendaKind;
  startAt: string;
  endAt?: string | null;
  allDay: boolean;
  location?: string | null;
  /** Tautan rapat daring, nomor ruang, dsb. */
  locationDetail?: string | null;
  /** Catatan untuk peserta. */
  internalNote?: string | null;
  status: AgendaStatus;
  audience: AgendaAudience;
  audienceBidang?: string[] | null;
  coverImage?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

// ---------------------------------------------------------------------------
// Validasi & normalisasi input
// ---------------------------------------------------------------------------

const MONTH_PARAM_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isValidMonthParam(value: unknown): value is string {
  return typeof value === "string" && MONTH_PARAM_RE.test(value);
}

export function isAgendaKind(value: unknown): value is AgendaKind {
  return typeof value === "string" && (AGENDA_KINDS as readonly string[]).includes(value);
}

export function isAgendaStatus(value: unknown): value is AgendaStatus {
  return typeof value === "string" && (AGENDA_STATUSES as readonly string[]).includes(value);
}

export function isAgendaAudience(value: unknown): value is AgendaAudience {
  return typeof value === "string" && (AGENDA_AUDIENCES as readonly string[]).includes(value);
}

/** Bulan aktif halaman agenda: dari ?bulan= kalau sah, kalau tidak bulan berjalan (WIB). */
export function resolveMonthParam(value: unknown, now: Date = new Date()): string {
  return isValidMonthParam(value) ? value : todayInJakarta(now).slice(0, 7);
}

export function monthParamToParts(month: string): { year: number; month: number } {
  const [year, m] = month.split("-").map(Number);
  return { year, month: m };
}

/** Geser parameter bulan (?bulan=YYYY-MM) sebanyak `delta` bulan — untuk tombol prev/next. */
export function shiftMonthParam(month: string, delta: number): string {
  if (!isValidMonthParam(month)) return month;
  const { year, month: m } = monthParamToParts(month);
  const index = year * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

export function formatMonthParam(month: string): string {
  if (!isValidMonthParam(month)) return month;
  const { year, month: m } = monthParamToParts(month);
  return `${MONTH_NAMES[m - 1]} ${year}`;
}

// Judul → slug URL. Pemanggil menambah akhiran acak kalau slug-nya sudah terpakai.
export function slugifyAgenda(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ---------------------------------------------------------------------------
// Grid kalender
// ---------------------------------------------------------------------------

export type MonthGridCell = {
  /** Tanggal WIB, YYYY-MM-DD. */
  date: string;
  day: number;
  /** false untuk tanggal "pengisi" dari bulan sebelum/sesudahnya. */
  inMonth: boolean;
};

export { DAY_SHORT };

// Matriks 6 baris x 7 kolom (42 sel), selalu dimulai hari Senin. Panjangnya dibuat tetap supaya
// tinggi kalender tidak berubah-ubah antar bulan.
export function monthGrid(year: number, month: number): MonthGridCell[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  // getUTCDay(): 0 = Minggu. Digeser supaya Senin = 0, Minggu = 6.
  const lead = (first.getUTCDay() + 6) % 7;

  const cells: MonthGridCell[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(Date.UTC(year, month - 1, 1 - lead + i));
    cells.push({
      date: d.toISOString().slice(0, 10),
      day: d.getUTCDate(),
      inMonth: d.getUTCMonth() === month - 1 && d.getUTCFullYear() === year,
    });
  }
  return cells;
}

/** Kelompokkan agenda per tanggal WIB, supaya tiap sel kalender bisa langsung dilihat isinya. */
export function groupAgendaByDate<T extends Pick<Agenda, "startAt">>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = dateInJakarta(item.startAt);
    if (!key) continue;
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Status & format tampilan
// ---------------------------------------------------------------------------

export type AgendaTimeStatus = "AKAN_DATANG" | "BERLANGSUNG" | "SELESAI";

// Tepat di startAt sudah dianggap BERLANGSUNG. Tanpa endAt, agenda dianggap berlangsung
// sepanjang hari itu (WIB) — kalau tidak, agenda tanpa jam akhir langsung tampak "selesai"
// satu detik setelah dimulai.
export function agendaStatus(agenda: Pick<Agenda, "startAt" | "endAt" | "allDay">, now: Date = new Date()): AgendaTimeStatus {
  const start = new Date(agenda.startAt).getTime();
  const current = now.getTime();
  if (Number.isNaN(start)) return "AKAN_DATANG";

  const explicitEnd = agenda.endAt ? new Date(agenda.endAt).getTime() : NaN;
  let end: number;
  if (!Number.isNaN(explicitEnd)) {
    end = explicitEnd;
  } else {
    // Akhir hari WIB dari tanggal mulai.
    const day = dateInJakarta(agenda.startAt);
    end = new Date(`${day}T23:59:59.999+07:00`).getTime();
  }

  if (current < start) return "AKAN_DATANG";
  if (current <= end) return "BERLANGSUNG";
  return "SELESAI";
}

export const AGENDA_STATUS_LABEL: Record<AgendaTimeStatus, string> = {
  AKAN_DATANG: "Akan datang",
  BERLANGSUNG: "Berlangsung",
  SELESAI: "Selesai",
};

/** Rentang waktu agenda dalam bahasa Indonesia, WIB. */
export function formatAgendaRange(agenda: Pick<Agenda, "startAt" | "endAt" | "allDay">): string {
  const startDate = dateInJakarta(agenda.startAt);
  if (!startDate) return "";
  const startLabel = formatLongDate(startDate);

  if (agenda.allDay) {
    const endDate = agenda.endAt ? dateInJakarta(agenda.endAt) : "";
    if (endDate && endDate !== startDate) return `${startLabel} - ${formatLongDate(endDate)}`;
    return `${startLabel} · Sepanjang hari`;
  }

  const startTime = timeInJakarta(agenda.startAt);
  if (!agenda.endAt) return `${startLabel} · ${startTime} WIB`;

  const endDate = dateInJakarta(agenda.endAt);
  const endTime = timeInJakarta(agenda.endAt);
  if (endDate === startDate) return `${startLabel} · ${startTime}-${endTime} WIB`;
  return `${startLabel} ${startTime} - ${formatLongDate(endDate)} ${endTime} WIB`;
}

function formatLongDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DAY_SHORT[(weekday + 6) % 7]}, ${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

// ---------------------------------------------------------------------------
// Akses halaman
// ---------------------------------------------------------------------------

type SessionLike = { user?: { email?: string | null; role?: string | null } | null } | null | undefined;

// Agenda KHUSUS ANGGOTA: semua halamannya wajib login, dan Akun Umum (VIEWER) juga tidak
// termasuk — sama seperti Uang Kas. Dipakai halaman sebagai pengecekan kedua setelah
// authorized() di lib/auth.ts, supaya aturannya tidak bergantung pada satu lapis saja.
export function canViewAgenda(session: SessionLike): boolean {
  if (!session?.user) return false;
  return !isViewerRole(session.user.role);
}

// ---------------------------------------------------------------------------
// Penerima notifikasi
// ---------------------------------------------------------------------------

export type NotifiableUser = {
  id: string;
  name?: string | null;
  email: string | null;
  role: string | null;
  bidang?: string | null;
};

// Yang berhak menerima notifikasi agenda: akun login yang BUKAN Akun Umum (VIEWER) dan bukan
// akun sistem/bersama (mis. pcmalang@kmhdi.info) — akun bersama dipakai banyak kader sekaligus,
// jadi mengirim notifikasi pribadi ke sana tidak ada artinya.
export function isAgendaRecipient(user: NotifiableUser): boolean {
  if (!user.email) return false;
  if (isViewerRole(user.role)) return false;
  return !isProtectedAccountEmail(user.email);
}

// Daftar penerima akhir untuk satu agenda. SEMUA = semua penerima yang sah; BIDANG = disaring
// menurut kolom User.bidang, dicocokkan tahan beda kapitalisasi (lihat lib/bidang.ts).
export function resolveAudience<T extends NotifiableUser>(agenda: Pick<Agenda, "audience" | "audienceBidang">, users: T[]): T[] {
  const eligible = users.filter(isAgendaRecipient);
  if (agenda.audience !== "BIDANG") return eligible;

  const targets = (agenda.audienceBidang ?? []).filter(isTargetableBidang);
  if (targets.length === 0) return [];
  return eligible.filter((user) => targets.some((target) => isSameBidang(user.bidang, target)));
}

/** Ringkasan audiens untuk ditampilkan di halaman sekretaris. */
export function describeAudience(agenda: Pick<Agenda, "audience" | "audienceBidang">): string {
  if (agenda.audience !== "BIDANG") return "Semua anggota";
  const targets = (agenda.audienceBidang ?? []).filter(isTargetableBidang);
  if (targets.length === 0) return "Belum ada bidang dipilih";
  return `Bidang: ${targets.join(", ")}`;
}

// ---------------------------------------------------------------------------
// Parser input form sekretaris
// ---------------------------------------------------------------------------

// Bentuk mentah dari form (semua string, tanggal & jam terpisah karena begitulah <input> HTML).
// Diparse di SERVER — apa pun yang dikirim klien dianggap tidak tepercaya.
export type AgendaInput = {
  title?: unknown;
  description?: unknown;
  kind?: unknown;
  startDate?: unknown;
  startTime?: unknown;
  endDate?: unknown;
  endTime?: unknown;
  allDay?: unknown;
  location?: unknown;
  locationDetail?: unknown;
  internalNote?: unknown;
  audience?: unknown;
  audienceBidang?: unknown;
};

/** Field Agenda yang siap ditulis ke database (tanpa id/slug/status/createdBy). */
export type ParsedAgenda = Pick<
  Agenda,
  "title" | "description" | "kind" | "startAt" | "endAt" | "allDay" | "location" | "locationDetail" | "internalNote" | "audience" | "audienceBidang"
>;

export type ParseResult = { ok: true; value: ParsedAgenda } | { ok: false; error: string };

export const AGENDA_LIMITS = { title: 120, description: 2000, location: 200, locationDetail: 500, internalNote: 2000 } as const;

const DATE_ONLY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME_ONLY = /^([01]\d|2[0-3]):[0-5]\d$/;

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}

// Tanggal + jam WIB → ISO dengan offset +07:00 yang eksplisit. WIB tidak punya DST, jadi
// offsetnya konstan. Hasilnya divalidasi lewat Date.parse supaya "2026-02-30" ditolak.
function toIsoWib(date: string, time: string): string | null {
  const iso = `${date}T${time}+07:00`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  // Date menggulung tanggal yang mustahil (30 Feb -> 2 Mar); bandingkan baliknya untuk menolak itu.
  if (dateInJakarta(parsed) !== date) return null;
  return iso;
}

export function parseAgendaInput(input: AgendaInput): ParseResult {
  const title = text(input.title, AGENDA_LIMITS.title);
  if (!title) return { ok: false, error: "Judul agenda wajib diisi." };

  const kind = input.kind ?? "KEGIATAN";
  if (!isAgendaKind(kind)) return { ok: false, error: "Jenis agenda tidak valid." };

  const audience = input.audience ?? "SEMUA";
  if (!isAgendaAudience(audience)) return { ok: false, error: "Penerima notifikasi tidak valid." };

  const allDay = input.allDay === true || input.allDay === "true" || input.allDay === "on";

  const startDate = typeof input.startDate === "string" ? input.startDate.trim() : "";
  if (!DATE_ONLY.test(startDate)) return { ok: false, error: "Tanggal mulai tidak valid." };

  const endDateRaw = typeof input.endDate === "string" ? input.endDate.trim() : "";
  if (endDateRaw && !DATE_ONLY.test(endDateRaw)) return { ok: false, error: "Tanggal selesai tidak valid." };

  let startAt: string | null;
  let endAt: string | null = null;

  if (allDay) {
    startAt = toIsoWib(startDate, "00:00:00");
    if (!startAt) return { ok: false, error: "Tanggal mulai tidak valid." };
    if (endDateRaw) {
      endAt = toIsoWib(endDateRaw, "23:59:59");
      if (!endAt) return { ok: false, error: "Tanggal selesai tidak valid." };
    }
  } else {
    const startTime = typeof input.startTime === "string" ? input.startTime.trim() : "";
    if (!TIME_ONLY.test(startTime)) return { ok: false, error: "Jam mulai wajib diisi (format JJ:MM)." };
    startAt = toIsoWib(startDate, `${startTime}:00`);
    if (!startAt) return { ok: false, error: "Tanggal mulai tidak valid." };

    const endTime = typeof input.endTime === "string" ? input.endTime.trim() : "";
    if (endTime) {
      if (!TIME_ONLY.test(endTime)) return { ok: false, error: "Jam selesai tidak valid (format JJ:MM)." };
      endAt = toIsoWib(endDateRaw || startDate, `${endTime}:00`);
      if (!endAt) return { ok: false, error: "Tanggal selesai tidak valid." };
    } else if (endDateRaw) {
      return { ok: false, error: "Isi jam selesai kalau tanggal selesai diisi." };
    }
  }

  if (endAt && new Date(endAt).getTime() < new Date(startAt).getTime()) {
    return { ok: false, error: "Waktu selesai tidak boleh sebelum waktu mulai." };
  }

  // Bidang dinormalisasi ke ejaan baku di BIDANG_OPTIONS (input klien dicocokkan tanpa peduli
  // kapitalisasi), dan yang tidak dikenal dibuang — daftar ini menentukan siapa yang dikirimi
  // notifikasi, jadi tidak boleh berisi string sembarangan.
  let audienceBidang: string[] | null = null;
  if (audience === "BIDANG") {
    const raw = Array.isArray(input.audienceBidang) ? input.audienceBidang : [];
    const canonical = new Set<string>();
    for (const item of raw) {
      const match = BIDANG_OPTIONS.find((option) => isSameBidang(option, item));
      if (match) canonical.add(match);
    }
    if (canonical.size === 0) return { ok: false, error: "Pilih minimal satu bidang penerima notifikasi." };
    audienceBidang = [...canonical];
  }

  return {
    ok: true,
    value: {
      title,
      description: text(input.description, AGENDA_LIMITS.description),
      kind,
      startAt,
      endAt,
      allDay,
      location: text(input.location, AGENDA_LIMITS.location),
      locationDetail: text(input.locationDetail, AGENDA_LIMITS.locationDetail),
      internalNote: text(input.internalNote, AGENDA_LIMITS.internalNote),
      audience,
      audienceBidang,
    },
  };
}
