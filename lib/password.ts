// Batas minimal sebelumnya 6 karakter. Dengan pembatas percobaan login (lihat lib/loginRateLimit.ts)
// serangan tebak-tebakan online sudah jauh melambat, tapi 6 karakter tetap terlalu pendek kalau
// suatu saat hash-nya sendiri yang bocor — di situ penyerang menebak offline tanpa batas kecepatan.
export const MIN_PASSWORD_LENGTH = 10;

export const PASSWORD_RULE_TEXT = `Password minimal ${MIN_PASSWORD_LENGTH} karakter.`;

export function isPasswordLongEnough(password: string): boolean {
  return password.trim().length >= MIN_PASSWORD_LENGTH;
}
