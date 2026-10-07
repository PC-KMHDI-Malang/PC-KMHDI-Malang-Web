// Daftar bidang kepengurusan, satu sumber kebenaran.
//
// Sebelumnya daftar ini ditulis ulang (hardcode) di AddUserModal dan EditUserModal, dan kini
// dibutuhkan pihak ketiga: pemilih audiens notifikasi agenda. Dipusatkan supaya ketiganya tidak
// pernah berbeda isi — kalau ada bidang baru, cukup diubah di sini.
//
// Catatan penting: kolom User.bidang itu TEXT bebas (migrasi 003), bukan enum. Data lama bisa
// berisi ejaan/kapitalisasi yang tidak persis sama dengan daftar ini, jadi SEMUA pencocokan
// bidang wajib lewat isSameBidang() di bawah, bukan perbandingan string biasa.

export const BIDANG_OPTIONS = [
  "Organisasi",
  "Kaderisasi",
  "Data dan Informasi",
  "Sosial Masyarakat",
  "Kajian dan Isu",
  "Litbang",
  "Hubungan Masyarakat",
] as const;

// Nilai yang dipakai akun tanpa bidang. Ikut ditawarkan di form user, tapi tidak pernah jadi
// target audiens agenda.
export const BIDANG_NONE = "Tidak Ada";

// Pilihan untuk <select> di form user: daftar bidang + "Tidak Ada".
export const BIDANG_SELECT_OPTIONS: readonly string[] = [...BIDANG_OPTIONS, BIDANG_NONE];

export function normalizeBidang(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

// Pencocokan tahan beda kapitalisasi dan spasi berlebih (lihat catatan di atas).
export function isSameBidang(a: unknown, b: unknown): boolean {
  const left = normalizeBidang(a);
  if (!left) return false;
  return left === normalizeBidang(b);
}

// Bidang yang sah sebagai target audiens: ada isinya dan bukan "Tidak Ada".
export function isTargetableBidang(value: unknown): value is string {
  const normalized = normalizeBidang(value);
  return !!normalized && normalized !== normalizeBidang(BIDANG_NONE);
}
