import type { Agenda, NotifiableUser } from "@/lib/agenda";
import type { NotifyReason } from "@/lib/notify/content";

// Kontrak kanal notifikasi. Ada dua jenis, karena cara "tidak dobel"-nya berbeda:
//
//  - NotificationChannel (per anggota): lonceng dan email. Satu pengiriman per penerima, dicatat
//    di tabel NotificationDelivery.
//  - BroadcastChannel (satu pesan untuk banyak orang): grup WhatsApp. Satu pengiriman per
//    kejadian, dicatat di tabel NotificationBroadcast.
//
// Menambah kanal baru = satu file yang mengimplementasi salah satu interface + satu entri di
// defaultChannels() / defaultBroadcastChannels() (lib/notify/dispatch.ts). Dispatcher yang
// mengurus penerima, klaim pengiriman (anti-dobel), dan pencatatan hasil — kanal cukup mengirim
// dan melaporkan hasilnya.

export type ChannelName = "INAPP" | "EMAIL" | "WHATSAPP";

export type NotifyPayload = {
  agenda: Agenda;
  reason: NotifyReason;
  title: string;
  body: string;
  /** Path relatif halaman agenda; domain ditentukan kanal masing-masing. */
  path: string;
};

export type ChannelResult = {
  /** id user yang berhasil dikirimi. */
  sent: string[];
  failed: { userId: string; error: string }[];
};

export interface NotificationChannel {
  readonly name: ChannelName;
  /** false = kanal dilewati (mis. email tanpa RESEND_API_KEY) tanpa dianggap error. */
  isEnabled(): boolean;
  send(payload: NotifyPayload, recipients: NotifiableUser[]): Promise<ChannelResult>;
}

export type BroadcastResult = { ok: true } | { ok: false; error: string };

export interface BroadcastChannel {
  readonly name: ChannelName;
  isEnabled(): boolean;
  /**
   * `audience` = ringkasan siapa yang dituju ("Semua anggota" / "Bidang: …"). Grup tidak bisa
   * disaring per bidang, jadi tujuan ini hanya dicantumkan di teks pesan.
   * `target` kosong = pakai tujuan bawaan kanal (grup); diisi = kirim ke tujuan lain (mode uji).
   */
  send(payload: NotifyPayload, audience: string, target?: string): Promise<BroadcastResult>;
}
