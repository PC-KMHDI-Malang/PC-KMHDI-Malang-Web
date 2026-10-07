import { Resend } from "resend";

import { absoluteAppLink } from "@/lib/notify/links";
import { buildEmail } from "@/lib/notify/emailTemplate";
import type { ChannelResult, NotificationChannel, NotifyPayload } from "@/lib/notify/types";
import type { NotifiableUser } from "@/lib/agenda";

// Kanal email lewat Resend. Aktif hanya kalau RESEND_API_KEY dan RESEND_FROM terisi — tanpa
// keduanya, kanal ini dilewati diam-diam (bukan error), jadi lonceng tetap jalan sebelum
// domain pengirim selesai diverifikasi di Resend.

// Batas Resend: 100 email per panggilan batch.
const BATCH_SIZE = 100;

export const emailChannel: NotificationChannel = {
  name: "EMAIL",

  isEnabled: () => !!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM,

  async send(payload: NotifyPayload, recipients: NotifiableUser[]): Promise<ChannelResult> {
    const result: ChannelResult = { sent: [], failed: [] };
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;
    if (!apiKey || !from) return result;

    const resend = new Resend(apiKey);
    const url = absoluteAppLink(payload.path);
    const withEmail = recipients.filter((user): user is NotifiableUser & { email: string } => !!user.email);

    for (let i = 0; i < withEmail.length; i += BATCH_SIZE) {
      const chunk = withEmail.slice(i, i + BATCH_SIZE);
      const emails = chunk.map((user) => {
        const content = buildEmail({ title: payload.title, body: payload.body, url, recipientName: user.name });
        return { from, to: user.email, subject: content.subject, html: content.html, text: content.text };
      });

      try {
        // "permissive": satu alamat yang ditolak tidak menggagalkan 99 lainnya — response memuat
        // daftar error per indeks, dipetakan balik ke user di bawah.
        const { data, error } = await resend.batch.send(emails, { batchValidation: "permissive" });

        if (error || !data) {
          for (const user of chunk) result.failed.push({ userId: user.id, error: error?.message ?? "Resend tidak mengembalikan data" });
          continue;
        }

        const failedByIndex = new Map<number, string>((data.errors ?? []).map((e) => [e.index, e.message]));
        chunk.forEach((user, index) => {
          const message = failedByIndex.get(index);
          if (message) result.failed.push({ userId: user.id, error: message });
          else result.sent.push(user.id);
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal menghubungi Resend";
        for (const user of chunk) result.failed.push({ userId: user.id, error: message });
      }
    }

    return result;
  },
};
