"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { errorMessage } from "@/lib/errors";

type LikeTarget = "news" | "ebook";

const TABLE_FOR: Record<LikeTarget, "News" | "Ebook"> = { news: "News", ebook: "Ebook" };

// Tabel "Like" datang dari migrasi 022. Selama migrasi itu belum dijalankan, PostgREST membalas
// PGRST205/42P01 — sama seperti fallback fungsi increment_counter (migrasi 018) di bawah, fitur
// sukanya tetap jalan (dan tetap wajib login), cuma belum bisa mencegah suka ganda.
function isMissingLikeTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "PGRST205" || error.code === "42P01" || /relation .*Like.* does not exist/i.test(error.message || "");
}

async function adjustCounter(table: "News" | "Ebook", id: string, delta: number): Promise<number | null> {
  // Increment atomik lewat fungsi Postgres (lihat migrasi 018) supaya aman dari race condition
  // saat dua request like/unlike terjadi hampir bersamaan.
  const { data, error } = await supabaseAdmin.rpc("increment_counter", {
    p_table: table,
    p_column: "likes",
    p_id: id,
    p_delta: delta,
  });

  if (!error) return data as number;
  if (!error.message.includes("increment_counter")) {
    console.error(`Gagal update like ${table}:`, error.message);
    return null;
  }

  // Migrasi 018 belum dijalankan (fungsi belum ada) — fallback ke cara lama (non-atomik).
  const { data: row, error: selectError } = await supabaseAdmin.from(table).select("likes").eq("id", id).single();
  if (selectError) return null;

  const next = Math.max(0, (typeof row.likes === "number" ? row.likes : 0) + delta);
  const { error: updateError } = await supabaseAdmin.from(table).update({ likes: next }).eq("id", id);
  return updateError ? null : next;
}

async function currentCount(table: "News" | "Ebook", id: string): Promise<number> {
  const { data } = await supabaseAdmin.from(table).select("likes").eq("id", id).single();
  return typeof data?.likes === "number" ? data.likes : 0;
}

export async function toggleLikeAction(type: LikeTarget, id: string, isLike: boolean) {
  try {
    // `type` bertipe union di sisi pemanggil, tapi server action adalah endpoint HTTP publik
    // begitu di-build — request di luar UI bisa mengirim string sembarang ke sini.
    if (type !== "news" && type !== "ebook") return { success: false, error: "Tipe tidak valid" };
    if (!id || typeof id !== "string") return { success: false, error: "ID tidak valid" };

    // Dulu action ini terbuka tanpa sesi sama sekali: siapa pun bisa memanggilnya berulang kali
    // dari luar UI dan menaikkan angka suka sebanyak yang dia mau.
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Silakan login untuk menyukai konten ini.", requiresLogin: true };

    const table = TABLE_FOR[type];

    if (isLike) {
      const { error } = await supabaseAdmin.from("Like").insert([{ userId, targetType: type, targetId: id }]);

      if (error) {
        // 23505 = melanggar indeks unik: akun ini memang sudah menyukainya. Bukan error bagi
        // pengguna, tapi angkanya jelas tidak boleh naik lagi.
        if (error.code === "23505") return { success: true, likes: await currentCount(table, id), liked: true };
        if (!isMissingLikeTable(error)) {
          console.error("Gagal menyimpan like:", error.message);
          return { success: false, error: "Gagal menyimpan suka." };
        }
      }
    } else {
      const { data: removed, error } = await supabaseAdmin
        .from("Like")
        .delete()
        .match({ userId, targetType: type, targetId: id })
        .select("id");

      if (error && !isMissingLikeTable(error)) {
        console.error("Gagal menghapus like:", error.message);
        return { success: false, error: "Gagal menghapus suka." };
      }

      // Tidak ada baris yang terhapus berarti akun ini memang belum pernah menyukainya —
      // hitungannya tidak boleh ikut turun.
      if (!error && removed && removed.length === 0) {
        return { success: true, likes: await currentCount(table, id), liked: false };
      }
    }

    const likes = await adjustCounter(table, id, isLike ? 1 : -1);
    if (likes === null) return { success: false, error: "Gagal memperbarui jumlah suka." };

    return { success: true, likes, liked: isLike };
  } catch (err: unknown) {
    console.error("Error toggleLikeAction:", err);
    return { success: false, error: errorMessage(err, "Terjadi kesalahan") };
  }
}
