import { absoluteAppLink } from "@/lib/notify/links";
import { buildWhatsAppMessage } from "@/lib/notify/whatsappMessage";
import type { BroadcastChannel, BroadcastResult, NotifyPayload } from "@/lib/notify/types";

// Kanal grup WhatsApp lewat Fonnte (https://docs.fonnte.com/api-send-message/). Mengirim SATU
// pesan per kejadian ke SATU grup — bukan satu pesan per anggota — jadi pemakaian kuota tetap
// kecil walau anggotanya banyak.
//
// Aktif hanya kalau FONNTE_TOKEN dan FONNTE_GROUP_ID terisi; tanpa keduanya dilewati diam-diam.
// FONNTE_GROUP_ID berformat "123456789@g.us" (lihat docs.fonnte.com/get-whatsapp-group-id).
//
// Hal yang perlu disadari pemilik akun:
//  - Fonnte BUKAN API resmi WhatsApp: ia mengendalikan satu nomor WhatsApp biasa yang tersambung
//    lewat scan QR. Pakai nomor khusus (bukan nomor pribadi/pengurus), dan nomor itu harus
//    menjadi anggota grup.
//  - Paket gratis menambahkan watermark Fonnte di tiap pesan.
//  - Kalau sambungan perangkat putus, pengiriman gagal dan dicatat FAILED di NotificationBroadcast.
//    Tidak ada percobaan ulang otomatis: kejadian yang sama baru dikirim ulang kalau dispatcher
//    dipanggil lagi untuknya (mis. sekretaris menarik lalu menerbitkan ulang agenda, atau cron
//    pengingat dijalankan ulang di hari yang sama).

const FONNTE_SEND_URL = "https://api.fonnte.com/send";
const TIMEOUT_MS = 15_000;

export const whatsappChannel: BroadcastChannel = {
  name: "WHATSAPP",

  isEnabled: () => !!process.env.FONNTE_TOKEN && !!process.env.FONNTE_GROUP_ID,

  async send(payload: NotifyPayload, audience: string, target?: string): Promise<BroadcastResult> {
    const token = process.env.FONNTE_TOKEN;
    const destination = target || process.env.FONNTE_GROUP_ID;
    if (!token || !destination) return { ok: false, error: "FONNTE_TOKEN / FONNTE_GROUP_ID belum diatur." };

    const message = buildWhatsAppMessage({ title: payload.title, body: payload.body, audience, url: absoluteAppLink(payload.path) });

    const form = new FormData();
    form.set("target", destination);
    form.set("message", message);

    try {
      // Authorization berisi token apa adanya, TANPA awalan "Bearer" (aturan Fonnte).
      const response = await fetch(FONNTE_SEND_URL, { method: "POST", headers: { Authorization: token }, body: form, signal: AbortSignal.timeout(TIMEOUT_MS) });
      const json = (await response.json().catch(() => null)) as { status?: boolean; reason?: string } | null;

      // Fonnte membalas status:true bila pesan masuk antrean; status:false disertai "reason"
      // (mis. "token invalid", "target invalid", "insufficient quota").
      if (!response.ok || !json || json.status !== true) return { ok: false, error: json?.reason ?? `Fonnte membalas HTTP ${response.status}` };
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Gagal menghubungi Fonnte" };
    }
  },
};
