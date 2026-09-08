import { supabaseAdmin } from "@/lib/supabase";

// Status "saya sudah menyukai ini" dulu disimpan di localStorage browser, jadi tidak bertahan
// antar-perangkat dan gampang dipalsukan. Sekarang dibaca dari server saat halaman dirender.
// Mengembalikan false kalau tabelnya belum ada (migrasi 022 belum dijalankan) — tombolnya
// tetap berfungsi, cuma belum mengingat pilihan pengguna.
export async function hasLiked(userId: string | undefined, type: "news" | "ebook", targetId: string): Promise<boolean> {
  if (!userId) return false;

  const { data, error } = await supabaseAdmin
    .from("Like")
    .select("id")
    .match({ userId, targetType: type, targetId })
    .maybeSingle();

  if (error) return false;
  return !!data;
}
