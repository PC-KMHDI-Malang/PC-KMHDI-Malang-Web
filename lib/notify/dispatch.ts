import { supabaseAdmin } from "@/lib/supabase";
import { resolveAudience, type Agenda, type NotifiableUser } from "@/lib/agenda";
import { agendaPath, buildNotificationContent, reasonKey, type NotifyReason } from "@/lib/notify/content";
import { describeChanges } from "@/lib/notify/emailDetails";
import { emailChannel } from "@/lib/notify/channels/email";
import { inAppChannel } from "@/lib/notify/channels/inapp";
import type { ChannelName, NotificationChannel, NotifyPayload } from "@/lib/notify/types";

// Satu pintu untuk semua notifikasi agenda: tentukan penerima, "klaim" pengiriman di tabel
// NotificationDelivery supaya tidak pernah dobel, lalu kirim lewat tiap kanal yang aktif.
//
// Sifatnya BEST-EFFORT: fungsi ini tidak pernah melempar. Notifikasi yang gagal tidak boleh
// menggagalkan penyimpanan agenda, dan satu kanal yang rusak tidak boleh menghentikan kanal lain
// (pola yang sama dengan writeLog() di app/actions/kas.ts).

export type ChannelSummary = { enabled: boolean; claimed: number; sent: number; failed: number; /** penerima yang dilewati karena kanal ini tidak bisa menjangkaunya (mis. belum punya email notifikasi) */ unreachable?: number; error?: string };

export type DispatchSummary = {
  agendaId: string;
  reason: NotifyReason;
  recipients: number;
  mode: "live" | "dry-run" | "test";
  channels: Partial<Record<ChannelName, ChannelSummary>>;
  /** Alasan tidak ada yang dikirim bukan karena error (mis. agenda ini memang tanpa notifikasi). */
  skipped?: string;
  error?: string;
};

export function defaultChannels(): NotificationChannel[] {
  return [inAppChannel, emailChannel];
}

const flag = (value: string | undefined) => value === "1" || value?.toLowerCase() === "true";

// Baris PENDING yang lebih tua dari ini dianggap macet (prosesnya mati di tengah jalan) dan boleh
// diklaim ulang — kalau tidak, penerima itu tidak akan pernah dikirimi lagi.
const STALE_PENDING_MS = 15 * 60 * 1000;
// .in("userId", …) masuk ke URL; 100 UUID ≈ 3.7 KB, aman di bawah batas panjang URL PostgREST.
const ID_CHUNK = 100;

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function fetchUsers(): Promise<NotifiableUser[]> {
  const PAGE = 1000;
  const all: NotifiableUser[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin.from("User").select("id, name, email, notifyEmail, role, bidang").order("id").range(from, from + PAGE - 1);
    if (error) throw new Error(`Gagal membaca daftar anggota: ${error.message}`);
    all.push(...((data ?? []) as NotifiableUser[]));
    if (!data || data.length < PAGE) break;
  }
  return all;
}

// Klaim penerima untuk satu kanal. Yang berhasil diklaim = satu-satunya yang boleh dikirimi
// proses ini. Dua jalur:
//  a) baris baru (belum pernah dikirimi) — upsert + ignoreDuplicates hanya mengembalikan baris
//     yang benar-benar dimasukkan, jadi proses lain yang berjalan bersamaan tidak ikut dapat;
//  b) baris lama yang FAILED, atau PENDING yang macet — diambil alih lewat UPDATE bersyarat.
async function claim(agendaId: string, channel: ChannelName, key: string, userIds: string[]): Promise<string[]> {
  const claimed: string[] = [];
  const staleBefore = new Date(Date.now() - STALE_PENDING_MS).toISOString();
  const nowIso = new Date().toISOString();

  for (const ids of chunks(userIds, ID_CHUNK)) {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("NotificationDelivery")
      .upsert(
        ids.map((userId) => ({ agendaId, userId, channel, reason: key, status: "PENDING" })),
        { onConflict: "agendaId,userId,channel,reason", ignoreDuplicates: true },
      )
      .select("userId");
    if (insertError) throw new Error(insertError.message);
    claimed.push(...(inserted ?? []).map((row) => row.userId as string));

    const { data: retried, error: retryError } = await supabaseAdmin
      .from("NotificationDelivery")
      .update({ status: "PENDING", error: null, createdAt: nowIso })
      .eq("agendaId", agendaId)
      .eq("channel", channel)
      .eq("reason", key)
      .in("userId", ids)
      .or(`status.eq.FAILED,and(status.eq.PENDING,createdAt.lt.${staleBefore})`)
      .select("userId");
    if (retryError) throw new Error(retryError.message);
    claimed.push(...(retried ?? []).map((row) => row.userId as string));
  }

  return claimed;
}

async function settle(agendaId: string, channel: ChannelName, key: string, sent: string[], failed: { userId: string; error: string }[]) {
  for (const ids of chunks(sent, ID_CHUNK)) {
    await supabaseAdmin
      .from("NotificationDelivery")
      .update({ status: "SENT", error: null, sentAt: new Date().toISOString() })
      .eq("agendaId", agendaId)
      .eq("channel", channel)
      .eq("reason", key)
      .in("userId", ids);
  }

  // Kelompokkan per pesan error supaya cukup satu UPDATE per jenis error, bukan satu per orang.
  const byError = new Map<string, string[]>();
  for (const f of failed) byError.set(f.error, [...(byError.get(f.error) ?? []), f.userId]);
  for (const [error, userIds] of byError) {
    for (const ids of chunks(userIds, ID_CHUNK)) {
      await supabaseAdmin
        .from("NotificationDelivery")
        .update({ status: "FAILED", error: error.slice(0, 500) })
        .eq("agendaId", agendaId)
        .eq("channel", channel)
        .eq("reason", key)
        .in("userId", ids);
    }
  }
}

// `options.before` = versi agenda SEBELUM diubah; dipakai hanya untuk reason "UPDATED", supaya
// email bisa menampilkan apa yang berubah (mis. "19.00 → 20.00").
export async function dispatchAgendaNotification(
  agenda: Agenda,
  reason: NotifyReason,
  channels: NotificationChannel[] = defaultChannels(),
  options: { before?: Agenda } = {},
): Promise<DispatchSummary> {
  const dryRun = flag(process.env.NOTIFY_DRY_RUN);
  const testRecipient = process.env.NOTIFY_TEST_RECIPIENT?.trim();
  const mode: DispatchSummary["mode"] = dryRun ? "dry-run" : testRecipient ? "test" : "live";
  const summary: DispatchSummary = { agendaId: agenda.id, reason, recipients: 0, mode, channels: {} };

  try {
    // Hanya agenda yang sudah terbit yang boleh memicu notifikasi — jaring pengaman kalau ada
    // pemanggil yang lupa memeriksa status.
    if (agenda.status !== "PUBLISHED") return { ...summary, error: "Agenda belum terbit; notifikasi tidak dikirim." };

    // Penjaga TERAKHIR per jenis notifikasi (setiap pemanggil sudah menyaring, tapi yang boleh
    // menentukan hanya satu tempat). CREATED = pengumuman manual dari tombol "Kirim notifikasi",
    // jadi tidak butuh penjaga di sini.
    if (reason === "REMINDER_H1" && !agenda.remindH1) return { ...summary, skipped: "Pengingat H-1 dimatikan untuk agenda ini." };
    if (reason === "UPDATED" && !agenda.announcedAt) return { ...summary, skipped: "Agenda ini belum diumumkan, jadi tidak ada yang perlu diperbarui." };

    const content = buildNotificationContent(agenda, reason);
    const changes = reason === "UPDATED" && options.before ? describeChanges(options.before, agenda) : undefined;
    const payloadBase = { agenda, reason, path: agendaPath(agenda), changes };
    const recipients = resolveAudience(agenda, await fetchUsers());
    summary.recipients = recipients.length;

    // Mode uji: kirim SATU email contoh ke NOTIFY_TEST_RECIPIENT saja, tanpa menyentuh lonceng
    // maupun buku catatan — untuk mencoba tampilan email tanpa mengganggu anggota.
    if (mode === "test" && testRecipient) {
      const testPayload: NotifyPayload = { ...payloadBase, title: `[TES] ${content.title}`, body: `${content.body} (akan dikirim ke ${recipients.length} penerima)` };
      const tester: NotifiableUser = { id: "test-recipient", name: "Penguji", email: testRecipient, notifyEmail: testRecipient, role: "USER" };
      const channel = channels.find((c) => c.name === "EMAIL");
      if (channel?.isEnabled()) {
        const result = await channel.send(testPayload, [tester]);
        summary.channels.EMAIL = { enabled: true, claimed: 1, sent: result.sent.length, failed: result.failed.length, error: result.failed[0]?.error };
      } else {
        summary.channels.EMAIL = { enabled: false, claimed: 0, sent: 0, failed: 0 };
      }
      return summary;
    }

    const payload: NotifyPayload = { ...payloadBase, title: content.title, body: content.body };
    const key = reasonKey(agenda, reason);

    for (const channel of channels) {
      const enabled = channel.isEnabled();
      const channelSummary: ChannelSummary = { enabled, claimed: 0, sent: 0, failed: 0 };
      summary.channels[channel.name] = channelSummary;
      if (!enabled) continue;

      // Hanya yang bisa dijangkau kanal ini (mis. email: yang sudah mengisi notifyEmail).
      const reachable = channel.canReach ? recipients.filter((r) => channel.canReach?.(r)) : recipients;
      channelSummary.unreachable = recipients.length - reachable.length;

      // Dry-run: laporkan siapa yang AKAN dikirimi, tanpa mengklaim, mengirim, atau menulis apa pun.
      if (dryRun) {
        channelSummary.claimed = reachable.length;
        console.info(`[notify:dry-run] ${channel.name} ${reason} "${agenda.title}" -> ${reachable.length} penerima (${channelSummary.unreachable} tidak terjangkau)`);
        continue;
      }

      try {
        const claimedIds = await claim(agenda.id, channel.name, key, reachable.map((r) => r.id));
        channelSummary.claimed = claimedIds.length;
        if (claimedIds.length === 0) continue;

        const claimedSet = new Set(claimedIds);
        const result = await channel.send(payload, reachable.filter((r) => claimedSet.has(r.id)));
        channelSummary.sent = result.sent.length;
        channelSummary.failed = result.failed.length;
        if (result.failed[0]) channelSummary.error = result.failed[0].error;

        await settle(agenda.id, channel.name, key, result.sent, result.failed);
      } catch (error) {
        // Satu kanal rusak (mis. tabel belum dimigrasi) tidak menghentikan kanal berikutnya.
        channelSummary.error = error instanceof Error ? error.message : String(error);
        console.error(`[notify] kanal ${channel.name} gagal untuk agenda ${agenda.id}:`, channelSummary.error);
      }
    }

    return summary;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[notify] gagal memproses agenda ${agenda.id}:`, message);
    return { ...summary, error: message };
  }
}
