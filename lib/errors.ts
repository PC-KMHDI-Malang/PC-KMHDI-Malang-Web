// Blok catch tidak bisa menjanjikan bahwa yang dilempar adalah Error — TypeScript memberinya
// tipe `unknown`. Helper ini mengambil pesannya kalau memang Error, dan jatuh ke teks cadangan
// kalau yang dilempar sesuatu yang lain (string, objek Supabase, dll).
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}
