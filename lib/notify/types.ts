import type { Agenda, NotifiableUser } from "@/lib/agenda";
import type { NotifyReason } from "@/lib/notify/content";

// Kontrak kanal notifikasi. Menambah kanal baru = satu file yang mengimplementasi
// NotificationChannel + satu entri di defaultChannels() (lib/notify/dispatch.ts). Dispatcher yang
// mengurus penerima, klaim pengiriman per anggota (anti-dobel, tabel NotificationDelivery), dan
// pencatatan hasil — kanal cukup mengirim ke daftar penerima yang diberikan dan melaporkan siapa
// yang berhasil/gagal.

export type ChannelName = "INAPP" | "EMAIL";

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
  /**
   * Opsional: apakah kanal ini bisa menjangkau anggota tersebut (mis. email butuh notifyEmail).
   * Dispatcher hanya mengklaim dan mengirim ke yang terjangkau, jadi anggota yang tidak
   * terjangkau tidak meninggalkan catatan PENDING yang menggantung. Kosong = semua terjangkau.
   */
  canReach?(user: NotifiableUser): boolean;
  send(payload: NotifyPayload, recipients: NotifiableUser[]): Promise<ChannelResult>;
}
