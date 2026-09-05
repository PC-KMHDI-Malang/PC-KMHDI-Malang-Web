"use server";

import { supabaseAdmin } from "@/lib/supabase";

export async function toggleLikeAction(type: "news" | "ebook", id: string, isLike: boolean) {
  try {
    // `type` is typed as a union at the call site, but a server action is a public HTTP
    // endpoint once built — nothing stops a request crafted outside the UI from sending an
    // arbitrary string here, which would otherwise fall through to the "Ebook" table below.
    if (type !== "news" && type !== "ebook") {
      return { success: false, error: "Tipe tidak valid" };
    }
    if (!id || typeof id !== "string") {
      return { success: false, error: "ID tidak valid" };
    }

    const table = type === "news" ? "News" : "Ebook";
    const delta = isLike ? 1 : -1;

    // Increment atomik lewat fungsi Postgres (lihat migrasi 018) supaya aman dari race condition
    // saat dua request like/unlike terjadi hampir bersamaan.
    const { data: newLikes, error: rpcError } = await supabaseAdmin.rpc("increment_counter", {
      p_table: table,
      p_column: "likes",
      p_id: id,
      p_delta: delta,
    });

    if (!rpcError) {
      return { success: true, likes: newLikes as number };
    }

    // Migrasi 018 belum dijalankan (fungsi belum ada) — fallback ke cara lama (non-atomik).
    if (!rpcError.message.includes("increment_counter")) {
      console.error(`Gagal update like ${table}:`, rpcError.message);
      return { success: false, error: rpcError.message };
    }

    const { data, error } = await supabaseAdmin.from(table).select("likes").eq("id", id).single();
    if (error) {
      console.error(`Gagal mengambil data like ${table}:`, error.message);
      return { success: false, error: error.message };
    }

    const currentLikes = typeof data.likes === "number" ? data.likes : 0;
    const fallbackLikes = Math.max(0, currentLikes + delta);

    const { error: updateError } = await supabaseAdmin.from(table).update({ likes: fallbackLikes }).eq("id", id);
    if (updateError) {
      console.error(`Gagal update like ${table}:`, updateError.message);
      return { success: false, error: updateError.message };
    }

    return { success: true, likes: fallbackLikes };
  } catch (err: any) {
    console.error("Error toggleLikeAction:", err);
    return { success: false, error: err?.message || "Terjadi kesalahan" };
  }
}
