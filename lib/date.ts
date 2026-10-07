// Primitif tanggal yang dipakai bersama lebih dari satu fitur (uang kas dan agenda).
//
// Alasan modul ini ada: Vercel menjalankan server di UTC, sedangkan seluruh isi situs ini
// berpikir dalam WIB. Tanpa helper di bawah, antara pukul 00.00–07.00 WIB "hari ini" menurut
// server masih tanggal kemarin — cukup untuk membuat bulan iuran belum dianggap jatuh tempo
// dan pengingat agenda H-1 terkirim di hari yang salah. Semua kode yang butuh "hari ini"
// WAJIB lewat sini, bukan new Date().getDate() dan sejenisnya.
//
// lib/kas.ts me-re-export isi modul ini supaya pemanggil lama (yang mengimpor MONTH_NAMES,
// MONTH_SHORT, atau todayInJakarta dari "@/lib/kas") tidak perlu diubah.

export const JAKARTA_TIME_ZONE = "Asia/Jakarta";

export const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
export const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
// Senin dulu, mengikuti kebiasaan kalender Indonesia (grid agenda ikut urutan ini).
export const DAY_SHORT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const DATE_ONLY_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function isValidDateOnly(date: unknown): date is string {
  return typeof date === "string" && DATE_ONLY_RE.test(date) && !Number.isNaN(Date.parse(date));
}

// Intl.DateTimeFormat mahal dibuat (puluhan–ratusan mikrodetik, membaca data locale) tapi murah
// dipakai. Dibuat SEKALI di sini, bukan di setiap pemanggilan: fungsi-fungsi di bawah dipanggil
// untuk setiap agenda/iuran di setiap render, jadi membuatnya berulang membuat daftar yang panjang
// melambat (diukur: 500 agenda butuh ±53 ms hanya untuk menentukan status waktunya).
const DATE_FORMAT = new Intl.DateTimeFormat("en-CA", { timeZone: JAKARTA_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const TIME_FORMAT = new Intl.DateTimeFormat("id-ID", { timeZone: JAKARTA_TIME_ZONE, hour: "2-digit", minute: "2-digit" });
const TIME_INPUT_FORMAT = new Intl.DateTimeFormat("en-GB", { timeZone: JAKARTA_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

// "Hari ini" di WIB, format YYYY-MM-DD. en-CA dipilih karena formatnya memang YYYY-MM-DD.
export function todayInJakarta(now: Date = new Date()): string {
  return DATE_FORMAT.format(now);
}

// Tanggal WIB (YYYY-MM-DD) dari sebuah timestamp — mis. kolom TIMESTAMPTZ dari database.
export function dateInJakarta(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return todayInJakarta(date);
}

// Jam:menit WIB dari sebuah timestamp, mis. "19.30" (pemisah titik, kebiasaan Indonesia).
export function timeInJakarta(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return TIME_FORMAT.format(date);
}

// Jam WIB dalam format "HH:mm" (pemisah titik dua) — format yang diminta <input type="time">,
// berbeda dari timeInJakarta() yang memakai titik untuk ditampilkan. hourCycle h23 supaya
// tengah malam jadi "00:00", bukan "24:00".
export function timeInputInJakarta(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return TIME_INPUT_FORMAT.format(date);
}

// Geser tanggal YYYY-MM-DD sebanyak `days` hari. Dihitung lewat UTC murni (bukan zona waktu
// lokal) supaya pergeseran hari tidak pernah terpengaruh DST atau offset server.
export function addDays(date: string, days: number): string {
  if (!isValidDateOnly(date)) return date;
  const [y, m, d] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + days));
  return shifted.toISOString().slice(0, 10);
}

// Tanggal besok menurut WIB — dipakai pengingat agenda H-1.
export function tomorrowInJakarta(now: Date = new Date()): string {
  return addDays(todayInJakarta(now), 1);
}

// Awal dan akhir sebuah tanggal WIB sebagai ISO timestamp (UTC), untuk dipakai sebagai batas
// query TIMESTAMPTZ: startAt >= dayStart && startAt <= dayEnd. WIB = UTC+7 tanpa DST, jadi
// offsetnya konstan dan aman ditulis langsung.
export function jakartaDayRange(date: string): { start: string; end: string } {
  return { start: `${date}T00:00:00.000+07:00`, end: `${date}T23:59:59.999+07:00` };
}

// Format "17 Agustus 2026" dari YYYY-MM-DD.
export function formatDateOnly(date: string): string {
  if (!isValidDateOnly(date)) return date;
  const [y, m, d] = date.split("-").map(Number);
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
}
