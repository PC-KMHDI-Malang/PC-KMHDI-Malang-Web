// Akun bersama yang dipakai banyak kader untuk mengakses halaman tertentu (mis. /informasi-akun).
// Password akun-akun ini sengaja dikunci — kalau satu kader saja iseng menggantinya, semua
// kader lain yang memakai kredensial yang sama akan langsung kehilangan akses.
const PROTECTED_ACCOUNT_EMAILS = ["pcmalang@kmhdi.info"];

export function isProtectedAccountEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return PROTECTED_ACCOUNT_EMAILS.includes(email.trim().toLowerCase());
}
