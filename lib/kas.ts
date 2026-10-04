import { isProtectedAccountEmail } from "@/lib/protectedAccounts";

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

export const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
export const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function isValidPeriod(period: unknown): period is string {
  return typeof period === "string" && PERIOD_RE.test(period);
}

export function isValidDate(date: unknown): date is string {
  return typeof date === "string" && DATE_RE.test(date) && !Number.isNaN(Date.parse(date));
}

// Periode & tanggal "hari ini" dihitung di zona waktu WIB, bukan zona waktu server (Vercel
// berjalan di UTC) — tanpa ini, antara pukul 00.00–07.00 WIB tanggal 1 bulan baru, bulan itu
// belum dianggap jatuh tempo.
export function todayInJakarta(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

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
};

export type IuranPayment = {
  id: string;
  period: string;
  amount: number;
  paidAt: string;
  note?: string | null;
};

// LUNAS: sudah dibayar. BELUM: sudah jatuh tempo tapi belum dibayar (tunggakan).
// MENDATANG: bulan setelah bulan berjalan. TIDAK_BERLAKU: sebelum iuran mulai berlaku.
export type MonthStatus = "LUNAS" | "BELUM" | "MENDATANG" | "TIDAK_BERLAKU";

export function monthStatus(period: string, paid: boolean, setting: KasSetting, nowPeriod: string): MonthStatus {
  if (paid) return "LUNAS";
  if (!setting.startPeriod || period < setting.startPeriod) return "TIDAK_BERLAKU";
  if (period > nowPeriod) return "MENDATANG";
  return "BELUM";
}

// Daftar bulan yang sudah jatuh tempo tapi belum dibayar, sejak iuran berlaku sampai bulan berjalan.
export function arrearsPeriods(paidPeriods: Iterable<string>, setting: KasSetting, nowPeriod: string): string[] {
  if (!setting.startPeriod) return [];
  const paid = new Set(paidPeriods);
  return periodRange(setting.startPeriod, nowPeriod).filter((p) => !paid.has(p));
}

export function memberYearStatus(payments: IuranPayment[], year: number, setting: KasSetting, nowPeriod: string) {
  const byPeriod = new Map(payments.map((p) => [p.period, p]));
  const months = periodsOfYear(year).map((period) => {
    const payment = byPeriod.get(period) ?? null;
    return { period, payment, status: monthStatus(period, !!payment, setting, nowPeriod) };
  });
  const yearPaid = months.reduce((sum, m) => sum + (m.payment?.amount ?? 0), 0);
  const arrears = arrearsPeriods(byPeriod.keys(), setting, nowPeriod);
  return {
    months,
    yearPaid,
    totalPaid: payments.reduce((sum, p) => sum + p.amount, 0),
    arrearsCount: arrears.length,
    arrearsAmount: arrears.length * setting.monthlyFee,
  };
}

export type KasTransaksiType = "MASUK" | "KELUAR";

export function ledgerSummary(iuranTotal: number, transaksi: { type: KasTransaksiType; amount: number }[]) {
  const otherIncome = transaksi.filter((t) => t.type === "MASUK").reduce((s, t) => s + t.amount, 0);
  const expense = transaksi.filter((t) => t.type === "KELUAR").reduce((s, t) => s + t.amount, 0);
  const totalIncome = iuranTotal + otherIncome;
  return { iuranTotal, otherIncome, expense, totalIncome, balance: totalIncome - expense };
}

// Tahun yang ditampilkan dari ?tahun=..., dibatasi ke rentang wajar supaya URL iseng tidak
// menghasilkan tabel tahun 99999.
export function parseYearParam(value: string | string[] | undefined, fallback: number): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const year = Number(raw);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return fallback;
  return year;
}
