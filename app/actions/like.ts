"use server";

import { supabaseAdmin } from "@/lib/supabase";

export async function toggleLikeAction(type: "news" | "ebook", id: string, isLike: boolean) {
  try {
    const table = type === "news" ? "News" : "Ebook";

    // Ambil jumlah likes saat ini
    const { data, error } = await supabaseAdmin.from(table).select("likes").eq("id", id).single();

    if (error) {
      console.error(`Gagal mengambil data like ${table}:`, error.message);
      return { success: false, error: error.message };
    }

    const currentLikes = typeof data.likes === "number" ? data.likes : 0;
    const newLikes = isLike ? currentLikes + 1 : Math.max(0, currentLikes - 1);

    const { error: updateError } = await supabaseAdmin.from(table).update({ likes: newLikes }).eq("id", id);

    if (updateError) {
      console.error(`Gagal update like ${table}:`, updateError.message);
      return { success: false, error: updateError.message };
    }

    return { success: true, likes: newLikes };
  } catch (err: any) {
    console.error("Error toggleLikeAction:", err);
    return { success: false, error: err?.message || "Terjadi kesalahan" };
  }
}
