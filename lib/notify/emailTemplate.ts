// Templat email notifikasi agenda — murni (hanya string), tanpa dependency template engine.
// Semua teks dari agenda lewat escapeHtml: judul/lokasi diisi sekretaris lewat form, jadi tidak
// boleh dipercaya begitu saja di dalam HTML.

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export type EmailContent = { subject: string; html: string; text: string };

export function buildEmail(input: { title: string; body: string; url: string; recipientName?: string | null }): EmailContent {
  const greeting = input.recipientName?.trim() ? `Halo ${input.recipientName.trim().split(/\s+/)[0]},` : "Halo,";
  const title = escapeHtml(input.title);
  const body = escapeHtml(input.body);
  const greetingHtml = escapeHtml(greeting);
  // URL berasal dari kode (bukan input pengguna), tapi tetap di-escape sebagai atribut.
  const url = escapeHtml(input.url);

  const html = `<!doctype html>
<html lang="id">
<body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
    <tr><td style="background:#991b1b;padding:20px 24px;color:#ffffff;font-size:13px;font-weight:bold;letter-spacing:.5px;">PC KMHDI MALANG &middot; KALENDER KEGIATAN</td></tr>
    <tr><td style="padding:24px;">
      <p style="margin:0 0 12px;font-size:14px;">${greetingHtml}</p>
      <h1 style="margin:0 0 8px;font-size:20px;line-height:1.3;">${title}</h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#475569;">${body}</p>
      <a href="${url}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 20px;border-radius:12px;">Buka agenda</a>
      <p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:#94a3b8;">Anda menerima email ini karena terdaftar sebagai anggota PC KMHDI Malang. Anda perlu masuk dengan akun anggota untuk melihat detail agenda.</p>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `${greeting}\n\n${input.title}\n${input.body}\n\nBuka agenda: ${input.url}\n\nAnda menerima email ini karena terdaftar sebagai anggota PC KMHDI Malang.`;

  return { subject: input.title, html, text };
}
