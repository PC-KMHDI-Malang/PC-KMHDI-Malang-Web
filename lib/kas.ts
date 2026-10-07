import { isProtectedAccountEmail } from "@/lib/protectedAccounts";
import { MONTH_NAMES, MONTH_SHORT, todayInJakarta } from "@/lib/date";

// Helper tanggal WIB kini tinggal di lib/date.ts karena agenda memakainya juga. Di-re-export
// dari sini supaya seluruh pemanggil lama (yang mengimpor MONTH_NAMES / MONTH_SHORT /
// todayInJakarta dari "@/lib/kas") tetap jalan tanpa diubah.
export { MONTH_NAMES, MONTH_SHORT, todayInJakarta };

// Logika murni fitur uang kas (tanpa akses database) supaya bisa dipakai bersama oleh halaman
// anggota (/kas), halaman bendahara (/kas/kelola), Server Action di app/actions/kas.ts, dan
// unit test — semuanya dijamin menghitung status lunas/tunggakan dengan cara yang sama.

// Satu-satunya akun yang boleh mengelola kas. Sengaja berdasarkan email, bukan role: akun ini
// cukup ber-role USER biasa, dan ADMIN pun tidak otomatis bisa mengubah data kas.
export const TREASURER_EMAIL = "bendahara@kmhdimalang.org";

export function isTreasurerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === TREASURER_EMAIL;
}

// Yang ditagih iuran cuma akun ber-role USER (ADMIN dan KONTRIBUTOR tidak ikut). Akun sistem
// (bendahara sendiri dan akun bersama seperti pcmalang@kmhdi.info) tetap dikecualikan walau
// role-nya USER, karena bukan anggota perorangan.
export function isKasMember(user: { email: string | null | undefined; role: string | null | undefined }): boolean {
  if (!user.email || user.role !== "USER") return false;
  return !isTreasurerEmail(user.email) && !isProtectedAccountEmail(user.email);
}

// Rekening tujuan pembayaran iuran — diatur bendahara di Kelola Kas → Pengaturan (migrasi 030)
// dan ditampilkan ke anggota di halaman Uang Kas (kartu Rekening Pembayaran & form Upload Bukti).
export type KasBankAccount = {
  bank: string;
  number: string;
  holder: string;
  /** Logo yang diunggah bendahara; kosong = nama bank yang ditampilkan. */
  logoUrl?: string | null;
};

// Dipakai hanya selama kolom rekening (migrasi 030) belum ada di database, supaya kartu rekening
// tidak hilang sebelum migrasi dijalankan. Setelah itu, nilai di Pengaturan yang dipakai.
const DEFAULT_KAS_BANK: KasBankAccount = { bank: "SeaBank", number: "901643108142", holder: "Ni Luh Putu Kayla Padma Dewi" };


const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function isValidPeriod(period: unknown): period is string {
  return typeof period === "string" && PERIOD_RE.test(period);
}

export function isValidDate(date: unknown): date is string {
  return typeof date === "string" && DATE_RE.test(date) && !Number.isNaN(Date.parse(date));
}

// Periode & tanggal "hari ini" dihitung di zona waktu WIB, bukan zona waktu server — lihat
// lib/date.ts untuk alasannya. todayInJakarta() diimpor dari sana dan di-re-export di atas.

export function currentPeriod(now: Date = new Date()): string {
  return todayInJakarta(now).slice(0, 7);
}

export function periodsOfYear(year: number): string[] {
  return MONTH_NAMES.map((_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
}

// Semua periode dari `from` sampai `to` (inklusif). Kosong kalau `from` sesudah `to`.
export function periodRange(from: string, to: string): string[] {
  if (!isValidPeriod(from) || !isValidPeriod(to) || from > to) return [];
  const result: string[] = [];
  let [y, m] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    result.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return result;
}

export function formatPeriod(period: string): string {
  if (!isValidPeriod(period)) return period;
  const [y, m] = period.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export function formatDate(date: string): string {
  if (!isValidDate(date)) return date;
  const [y, m, d] = date.split("-").map(Number);
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

// Input nominal dari form boleh ditulis "10.000", "Rp 10.000", atau "10000". Hasilnya bilangan
// bulat positif, atau null kalau tidak valid.
export function parseRupiahInput(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const digits = String(value).replace(/[^\d]/g, "");
  if (!digits) return null;
  const amount = Number(digits);
  if (!Number.isSafeInteger(amount) || amount <= 0) return null;
  return amount;
}

export type KasSetting = {
  monthlyFee: number;
  startPeriod: string | null;
  /** Akhir periode (inklusif) yang diatur bendahara; kosong = default 2 tahun dari startPeriod. */
  endPeriod?: string | null;
  /** Rekening tujuan pembayaran; null = tidak ditampilkan. */
  /** Rekening tujuan pembayaran (urutan = urutan tampil). Kosong = tidak ada rekening. */
  banks?: KasBankAccount[];
  /** Gambar QRIS untuk pembayaran; null = tidak ada. */
  qrisUrl?: string | null;
};

// Baris KasSetting dari database → KasSetting. Dibaca dengan select("*") supaya halaman kas tetap
// jalan walau kolom endPeriod (migrasi 028) belum ada — nilainya cuma dianggap kosong.
export function toKasSetting(row: Record<string, unknown> | null | undefined): KasSetting {
  return {
    monthlyFee: typeof row?.monthlyFee === "number" ? row.monthlyFee : 0,
    startPeriod: isValidPeriod(row?.startPeriod) ? row.startPeriod : null,
    endPeriod: isValidPeriod(row?.endPeriod) ? row.endPeriod : null,
    banks: toBankAccounts(row),
    qrisUrl: typeof row?.qrisUrl === "string" && row.qrisUrl.trim() ? row.qrisUrl.trim() : null,
  };
}

export const KAS_MAX_BANKS = 5;

function toBankAccounts(row: Record<string, unknown> | null | undefined): KasBankAccount[] {
  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  // Daftar rekening (migrasi 031).
  if (row && Array.isArray(row.bankAccounts)) {
    return (row.bankAccounts as unknown[])
      .map((a) => (a && typeof a === "object" ? (a as Record<string, unknown>) : {}))
      .map((a) => ({ bank: text(a.bank) || "Bank", number: text(a.number), holder: text(a.holder), logoUrl: text(a.logoUrl) || null }))
      .filter((a) => a.number)
      .slice(0, KAS_MAX_BANKS);
  }
  // Belum migrasi 031: rekening tunggal dari migrasi 030, atau rekening bawaan kalau 030 pun belum.
  if (!row || !("bankAccountNumber" in row)) return [DEFAULT_KAS_BANK];
  const number = text(row.bankAccountNumber);
  return number ? [{ bank: text(row.bankName) || "Bank", number, holder: text(row.bankAccountHolder) }] : [];
}

// Status satu baris KasIuran di database (lihat migrasi 026). Baris tanpa status (data lama /
// unit test) dianggap LUNAS — dulu semua baris memang dicatat langsung oleh bendahara.
export type IuranStatus = "LUNAS" | "MENUNGGU" | "DITOLAK";

export type IuranPayment = {
  id: string;
  period: string;
  amount: number;
  paidAt: string;
  note?: string | null;
  status?: IuranStatus | null;
  proofUrl?: string | null;
  rejectReason?: string | null;
};

export function paymentStatus(payment: Pick<IuranPayment, "status"> | null | undefined): IuranStatus | null {
  if (!payment) return null;
  return payment.status ?? "LUNAS";
}

// Bulan dianggap "beres" (bukan tunggakan) kalau sudah LUNAS, atau buktinya sedang MENUNGGU
// konfirmasi — anggota sudah membayar, tinggal diverifikasi. DITOLAK kembali jadi tunggakan.
export function isSettled(status: IuranStatus | null): boolean {
  return status === "LUNAS" || status === "MENUNGGU";
}

// LUNAS: sudah dibayar. MENUNGGU: bukti sudah diunggah, menunggu konfirmasi bendahara.
// BELUM: sudah jatuh tempo tapi belum dibayar (tunggakan, termasuk yang buktinya ditolak).
// MENDATANG: bulan setelah bulan berjalan. TIDAK_BERLAKU: sebelum iuran mulai berlaku.
export type MonthStatus = "LUNAS" | "MENUNGGU" | "BELUM" | "MENDATANG" | "TIDAK_BERLAKU";

// `paid` boleh boolean (true = LUNAS) atau status baris iuran-nya langsung.
// Satu periode iuran berlaku dari bulan mulai sampai bulan akhir (keduanya diatur bendahara di
// Pengaturan). Kalau akhir periode belum diisi, default-nya 24 bulan (2 tahun kepengurusan)
// sesudah bulan mulai, mis. mulai Juni 2025 → berlaku s.d. Juni 2027.
export const KAS_PERIOD_MONTHS = 24;
// Batas wajar panjang satu periode, supaya salah ketik tahun tidak membuat tagihan puluhan tahun.
export const KAS_PERIOD_MAX_MONTHS = 60;

export function addMonths(period: string, months: number): string {
  const [y, m] = period.split("-").map(Number);
  const index = y * 12 + (m - 1) + months;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

// Bulan terakhir iuran berlaku untuk periode ini (inklusif), atau null kalau iuran belum diatur.
export function periodEnd(setting: KasSetting): string | null {
  if (!setting.startPeriod) return null;
  if (setting.endPeriod && setting.endPeriod >= setting.startPeriod) return setting.endPeriod;
  return addMonths(setting.startPeriod, KAS_PERIOD_MONTHS);
}

// Periode iuran khusus satu anggota (tabel KasMemberPeriod, migrasi 029) — untuk anggota yang
// masuk atau keluar di tengah periode. Kosong = ikut periode umum.
export type MemberPeriod = { startPeriod: string | null; endPeriod: string | null };

// Periode efektif seorang anggota: irisan periode umum (KasSetting) dengan periode khususnya.
// Hasilnya KasSetting biasa, jadi monthStatus/arrearsPeriods/dst. bisa dipakai apa adanya.
// Kalau irisannya kosong (mis. anggota berhenti sebelum periode dimulai), tidak ada bulan yang ditagih.
export function memberSetting(setting: KasSetting, member?: MemberPeriod | null): KasSetting {
  const generalEnd = periodEnd(setting);
  if (!setting.startPeriod || !generalEnd) return setting;
  const start = member?.startPeriod && member.startPeriod > setting.startPeriod ? member.startPeriod : setting.startPeriod;
  const end = member?.endPeriod && member.endPeriod < generalEnd ? member.endPeriod : generalEnd;
  if (end < start) return { monthlyFee: setting.monthlyFee, startPeriod: null, endPeriod: null };
  return { monthlyFee: setting.monthlyFee, startPeriod: start, endPeriod: end };
}

export function toMemberPeriod(row: Record<string, unknown> | null | undefined): MemberPeriod | null {
  if (!row) return null;
  return {
    startPeriod: isValidPeriod(row.startPeriod) ? row.startPeriod : null,
    endPeriod: isValidPeriod(row.endPeriod) ? row.endPeriod : null,
  };
}

export function monthStatus(period: string, paid: boolean | IuranStatus | null, setting: KasSetting, nowPeriod: string): MonthStatus {
  const status: IuranStatus | null = paid === true ? "LUNAS" : paid === false ? null : paid;
  if (status === "LUNAS") return "LUNAS";
  if (status === "MENUNGGU") return "MENUNGGU";
  const end = periodEnd(setting);
  if (!setting.startPeriod || !end || period < setting.startPeriod || period > end) return "TIDAK_BERLAKU";
  if (period > nowPeriod) return "MENDATANG";
  return "BELUM";
}

// Daftar bulan yang sudah jatuh tempo tapi belum dibayar, sejak iuran berlaku sampai bulan berjalan.
// `paidPeriods` berisi bulan yang sudah beres (LUNAS atau MENUNGGU — lihat isSettled).
export function arrearsPeriods(paidPeriods: Iterable<string>, setting: KasSetting, nowPeriod: string): string[] {
  const end = periodEnd(setting);
  if (!setting.startPeriod || !end) return [];
  const paid = new Set(paidPeriods);
  // Tunggakan dihitung sampai bulan berjalan, tapi tidak melewati akhir periode.
  return periodRange(setting.startPeriod, nowPeriod < end ? nowPeriod : end).filter((p) => !paid.has(p));
}

export function memberYearStatus(payments: IuranPayment[], year: number, setting: KasSetting, nowPeriod: string) {
  const byPeriod = new Map(payments.map((p) => [p.period, p]));
  const months = periodsOfYear(year).map((period) => {
    const payment = byPeriod.get(period) ?? null;
    return { period, payment, status: monthStatus(period, paymentStatus(payment), setting, nowPeriod) };
  });
  const lunas = (p: IuranPayment | null) => paymentStatus(p) === "LUNAS";
  const yearPaid = months.reduce((sum, m) => sum + (lunas(m.payment) ? m.payment!.amount : 0), 0);
  const arrears = arrearsPeriods(
    payments.filter((p) => isSettled(paymentStatus(p))).map((p) => p.period),
    setting,
    nowPeriod,
  );
  return {
    months,
    yearPaid,
    totalPaid: payments.filter(lunas).reduce((sum, p) => sum + p.amount, 0),
    pendingCount: payments.filter((p) => paymentStatus(p) === "MENUNGGU").length,
    arrearsCount: arrears.length,
    arrearsAmount: arrears.length * setting.monthlyFee,
  };
}

// Tahun yang ditampilkan dari ?tahun=..., dibatasi ke rentang wajar supaya URL iseng tidak
// menghasilkan tabel tahun 99999.
export function parseYearParam(value: string | string[] | undefined, fallback: number): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const year = Number(raw);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return fallback;
  return year;
}
