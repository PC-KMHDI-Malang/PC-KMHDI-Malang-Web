import { supabaseAdmin } from "@/lib/supabase";
import type { ChannelResult, NotificationChannel, NotifyPayload } from "@/lib/notify/types";
import type { NotifiableUser } from "@/lib/agenda";

// Kanal lonceng di navbar: satu baris tabel "Notification" per anggota. Selalu aktif — tidak
// butuh layanan luar, jadi inilah kanal yang pasti sampai selama anggota membuka situs.

const CHUNK = 500;

export const inAppChannel: NotificationChannel = {
  name: "INAPP",

  isEnabled: () => true,

  async send(payload: NotifyPayload, recipients: NotifiableUser[]): Promise<ChannelResult> {
    const result: ChannelResult = { sent: [], failed: [] };

    for (let i = 0; i < recipients.length; i += CHUNK) {
      const chunk = recipients.slice(i, i + CHUNK);
      const { error } = await supabaseAdmin.from("Notification").insert(
        chunk.map((user) => ({
          userId: user.id,
          agendaId: payload.agenda.id,
          reason: payload.reason,
          title: payload.title,
          body: payload.body,
          url: payload.path,
        })),
      );

      if (error) for (const user of chunk) result.failed.push({ userId: user.id, error: error.message });
      else for (const user of chunk) result.sent.push(user.id);
    }

    return result;
  },
};
