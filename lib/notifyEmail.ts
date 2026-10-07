// Validasi "email notifikasi": alamat email ASLI anggota untuk menerima email notifikasi, terpisah
// dari User.email.
//
// Kenapa terpisah: User.email adalah nama login, dan banyak akun memakai alamat yang bukan kotak
// masuk sungguhan. Mengirim email ke alamat seperti itu hanya memantul (bounce), dan Resend
// menangguhkan akun yang tingkat bouncenya tinggi. Maka kanal email HANYA memakai kolom ini,
// tidak pernah User.email, dan anggota yang belum mengisinya dilewati.
//
// Modul ini murni (tanpa database) supaya dipakai bersama form admin, form profil anggota, dan
// unit test dengan aturan yang sama persis.

export const NOTIFY_EMAIL_MAX_LENGTH = 254;

// Sengaja sederhana: bukan validator RFC penuh (yang terkenal rumit), cuma menolak input yang
// jelas bukan alamat email. Alamat yang bentuknya benar tapi tidak ada tetap akan ketahuan
// lewat bounce di dashboard Resend.
const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

// Domain yang dicadangkan untuk contoh/uji (RFC 2606 & 6761): dijamin tidak punya kotak masuk,
// jadi pasti memantul. Di-tolak di muka karena "dummy@example.com" adalah isian yang sangat umum.
const RESERVED_DOMAINS = ["example.com", "example.org", "example.net"];
const RESERVED_SUFFIXES = [".test", ".example", ".invalid", ".localhost"];

export function isReservedEmailDomain(domain: string): boolean {
  const d = domain.toLowerCase();
  return RESERVED_DOMAINS.includes(d) || RESERVED_SUFFIXES.some((suffix) => d.endsWith(suffix));
}

export type NotifyEmailResult = { ok: true; value: string | null } | { ok: false; error: string };

// Kosong = hapus email notifikasi (ok, value null). Selain itu dinormalkan ke huruf kecil.
export function parseNotifyEmail(input: unknown): NotifyEmailResult {
  if (input === null || input === undefined) return { ok: true, value: null };
  if (typeof input !== "string") return { ok: false, error: "Email notifikasi tidak valid." };

  const value = input.trim().toLowerCase();
  if (!value) return { ok: true, value: null };

  if (value.length > NOTIFY_EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(value)) {
    return { ok: false, error: "Format email notifikasi tidak valid." };
  }
  if (isReservedEmailDomain(value.slice(value.lastIndexOf("@") + 1))) {
    return { ok: false, error: "Gunakan email asli yang bisa menerima pesan, bukan alamat contoh." };
  }
  return { ok: true, value };
}
