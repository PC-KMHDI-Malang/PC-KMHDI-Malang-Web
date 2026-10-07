"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { canViewAgenda } from "@/lib/agenda";

// Jalur baca/tulis lonceng notifikasi. Server Action adalah endpoint HTTP publik (lihat catatan
// di lib/guard.ts), jadi setiap action memeriksa sesinya sendiri, dan SELALU memfilter dengan
// userId dari SESI — tidak pernah dari argumen. Dengan begitu seorang anggota tidak bisa membaca
// atau menandai notifikasi anggota lain walau memalsukan panggilan action-nya.

export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  url: string | null;
  reason: string;
  readAt: string | null;
  createdAt: string;
};

export type MyNotifications = { unread: number; items: NotificationItem[] };

const EMPTY: MyNotifications = { unread: 0, items: [] };
const LIST_LIMIT = 15;

async function currentMemberId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id || !canViewAgenda(session)) return null;
  return session.user.id;
}

// Hanya JUMLAH belum dibaca (satu query ringan, tanpa isi) — dipakai lonceng setiap kali halaman
// dimuat. Daftar lengkapnya baru diambil (getMyNotificationsAction) saat lonceng DIBUKA, jadi
// kebanyakan kunjungan halaman tidak membayar query kedua yang tidak pernah dilihat.
export async function getMyUnreadCountAction(): Promise<number> {
  const userId = await currentMemberId();
  if (!userId) return 0;

  const { count, error } = await supabaseAdmin.from("Notification").select("id", { count: "exact", head: true }).eq("userId", userId).is("readAt", null);
  return error ? 0 : (count ?? 0);
}

// Gagal membaca (mis. tabel belum dimigrasi) dianggap "tidak ada notifikasi": lonceng bukan
// fitur kritis, dan tidak boleh memunculkan error di setiap halaman yang memuat navbar.
export async function getMyNotificationsAction(): Promise<MyNotifications> {
  const userId = await currentMemberId();
  if (!userId) return EMPTY;

  const [unreadResult, listResult] = await Promise.all([
    supabaseAdmin.from("Notification").select("id", { count: "exact", head: true }).eq("userId", userId).is("readAt", null),
    supabaseAdmin.from("Notification").select("id, title, body, url, reason, readAt, createdAt").eq("userId", userId).order("createdAt", { ascending: false }).limit(LIST_LIMIT),
  ]);

  if (unreadResult.error || listResult.error) return EMPTY;
  return { unread: unreadResult.count ?? 0, items: (listResult.data ?? []) as NotificationItem[] };
}

// ids kosong/tidak diberikan = tandai semua milik sendiri. Selalu dibatasi userId sesi.
export async function markNotificationsReadAction(ids?: string[]): Promise<{ success: boolean }> {
  const userId = await currentMemberId();
  if (!userId) return { success: false };

  let query = supabaseAdmin.from("Notification").update({ readAt: new Date().toISOString() }).eq("userId", userId).is("readAt", null);

  // Server Action = endpoint publik: argumennya bisa berupa apa saja, bukan hanya yang dikirim UI.
  if (ids !== undefined && !Array.isArray(ids)) return { success: false };
  if (ids !== undefined) {
    const valid = ids.filter((id): id is string => typeof id === "string" && id.length > 0).slice(0, 50);
    if (valid.length === 0) return { success: true };
    query = query.in("id", valid);
  }

  const { error } = await query;
  return { success: !error };
}
