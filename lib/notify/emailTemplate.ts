// Templat email notifikasi agenda — murni (hanya string), tanpa dependency template engine.
// Semua teks yang berasal dari agenda lewat escapeHtml: judul/lokasi/deskripsi diisi sekretaris
// lewat form, jadi tidak boleh dipercaya begitu saja di dalam HTML.
import type { EmailChange, EmailDetails } from "@/lib/notify/emailDetails";

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export type EmailReason = "CREATED" | "UPDATED" | "REMINDER_H1";

export type EmailInput = {
  title: string;
  /** Ringkasan satu baris: teks pratinjau di kotak masuk. */
  summary: string;
  url: string;
  recipientName?: string | null;
  reason?: EmailReason;
  kindLabel?: string;
  details: EmailDetails;
  /** Hanya untuk "Agenda diperbarui". */
  changes?: EmailChange[];
  logoUrl?: string;
  profileUrl?: string;
};

export type EmailContent = { subject: string; html: string; text: string };

// Warna aksen per jenis pemberitahuan.
const REASON_STYLE: Record<EmailReason, { label: string; bg: string; fg: string }> = {
  CREATED: { label: "Agenda baru", bg: "#fee2e2", fg: "#991b1b" },
  UPDATED: { label: "Agenda diperbarui", bg: "#fef3c7", fg: "#92400e" },
  REMINDER_H1: { label: "Pengingat · Besok", bg: "#dbeafe", fg: "#1e40af" },
};

const FONT = "'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const INK = "#0f172a"; // teks utama
const BODY = "#1e293b"; // paragraf
const MUTED = "#475569"; // keterangan (cukup gelap supaya terbaca, bukan abu-abu pucat)
const LINE = "#e2e8f0";

// Satu kalimat besar tentang KAPAN, supaya anggota tidak perlu menyusunnya dari beberapa baris.
function headline(reason: EmailReason, d: EmailDetails): string | null {
  if (reason !== "REMINDER_H1") return null;
  return d.timeLabel === "Sepanjang hari" ? "Berlangsung besok, sepanjang hari" : `Dimulai besok · ${d.timeLabel.replace(/^Mulai pukul /, "pukul ")}`;
}

function row(label: string, valueHtml: string, last: boolean): string {
  return `
      <tr>
        <td valign="top" width="96" style="padding:17px 12px 13px 0;${last ? "" : `border-bottom:1px solid ${LINE};`}font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:${MUTED};">${escapeHtml(label)}</td>
        <td valign="top" style="padding:13px 0;${last ? "" : `border-bottom:1px solid ${LINE};`}font-size:16px;line-height:1.5;color:${INK};">${valueHtml}</td>
      </tr>`;
}

function paragraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px 0;">${escapeHtml(p.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function buildEmail(input: EmailInput): EmailContent {
  const reasonKey = input.reason ?? "CREATED";
  const reason = REASON_STYLE[reasonKey];
  const d = input.details;
  const firstName = input.recipientName?.trim().split(/\s+/)[0];
  const greeting = firstName ? `Halo ${firstName},` : "Halo,";
  const title = escapeHtml(input.title);
  const url = escapeHtml(input.url);
  const sub = headline(reasonKey, d);

  const logo = input.logoUrl
    ? `<td width="54" valign="middle" style="padding-right:14px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#ffffff" style="border-radius:12px;padding:6px;"><img src="${escapeHtml(input.logoUrl)}" width="42" height="42" alt="PC KMHDI Malang" style="display:block;border:0;"></td></tr></table></td>`
    : "";

  const kind = input.kindLabel ? `<span style="display:inline-block;background:#f1f5f9;color:${MUTED};font-size:13px;font-weight:700;padding:5px 11px;border-radius:999px;margin-left:6px;">${escapeHtml(input.kindLabel)}</span>` : "";

  // Ubin tanggal: bulan di pita berwarna, tanggal besar di tengah.
  const tile = `<table role="presentation" cellpadding="0" cellspacing="0" width="76" style="border:1px solid ${LINE};border-radius:14px;overflow:hidden;background:#ffffff;">
          <tr><td align="center" bgcolor="${reason.fg}" style="background:${reason.fg};padding:5px 0;font-size:12px;font-weight:700;letter-spacing:1px;color:#ffffff;">${escapeHtml(d.tile.month)}</td></tr>
          <tr><td align="center" style="padding:6px 0 0 0;font-size:32px;line-height:1.1;font-weight:800;color:${INK};">${escapeHtml(d.tile.day)}</td></tr>
          <tr><td align="center" style="padding:0 0 8px 0;font-size:12px;color:${MUTED};font-weight:600;">${escapeHtml(d.tile.weekday)}</td></tr>
        </table>`;

  const changed = input.changes && input.changes.length
    ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
          <tr><td bgcolor="#fffbeb" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 18px;">
            <div style="font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#92400e;margin-bottom:10px;">Yang berubah</div>
            ${input.changes
              .map(
                (c) => `<div style="font-size:15px;line-height:1.5;color:${INK};margin-top:8px;"><span style="font-weight:700;">${escapeHtml(c.label)}:</span><br><span style="color:${MUTED};text-decoration:line-through;">${escapeHtml(c.from)}</span> &rarr; <span style="font-weight:700;">${escapeHtml(c.to)}</span></div>`,
              )
              .join("")}
          </td></tr>
        </table>`
    : "";

  const rows: { label: string; html: string }[] = [
    {
      label: "Waktu",
      html: `<strong>${escapeHtml(d.dateLabel)}</strong><br>${escapeHtml(d.timeLabel)}${d.durationLabel ? ` <span style="color:${MUTED};">(${escapeHtml(d.durationLabel)})</span>` : ""}`,
    },
  ];
  if (d.location) rows.push({ label: "Lokasi", html: escapeHtml(d.location) });
  if (d.link) rows.push({ label: "Tautan", html: `<a href="${escapeHtml(d.link)}" style="color:#1d4ed8;font-weight:600;word-break:break-all;">${escapeHtml(d.link)}</a>` });
  if (d.locationNote) rows.push({ label: "Detail lokasi", html: escapeHtml(d.locationNote) });
  rows.push({ label: "Untuk", html: escapeHtml(d.audience) });
  const detailTable = `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px 0;border-top:1px solid ${LINE};border-bottom:1px solid ${LINE};">${rows.map((r, i) => row(r.label, r.html, i === rows.length - 1)).join("")}
        </table>`;

  const about = d.description
    ? `
        <div style="font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:${MUTED};margin:0 0 8px 0;">Tentang agenda</div>
        <div style="font-size:16px;line-height:1.65;color:${BODY};margin:0 0 22px 0;">${paragraphs(d.description)}</div>`
    : "";

  const note = d.note
    ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
          <tr><td bgcolor="#f8fafc" style="background:#f8fafc;border-left:4px solid #94a3b8;border-radius:8px;padding:14px 16px;">
            <div style="font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:${MUTED};margin-bottom:6px;">Catatan</div>
            <div style="font-size:15px;line-height:1.6;color:${BODY};">${paragraphs(d.note)}</div>
          </td></tr>
        </table>`
    : "";

  const footerLink = input.profileUrl ? ` <a href="${escapeHtml(input.profileUrl)}" style="color:${MUTED};text-decoration:underline;">Atur email notifikasi</a>` : "";

  const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f6;font-family:${FONT};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f6;">${escapeHtml(input.summary)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#eef2f6" style="background:#eef2f6;">
  <tr><td align="center" style="padding:28px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

      <tr><td bgcolor="#991b1b" style="background:#991b1b;border-radius:18px 18px 0 0;padding:22px 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          ${logo}
          <td valign="middle">
            <div style="font-size:18px;font-weight:700;color:#ffffff;line-height:1.2;">PC KMHDI Malang</div>
            <div style="font-size:13px;color:#fecaca;margin-top:3px;">Kalender Kegiatan</div>
          </td>
        </tr></table>
      </td></tr>

      <tr><td bgcolor="#ffffff" style="background:#ffffff;padding:30px 28px 30px 28px;border-radius:0 0 18px 18px;">
        <div style="font-size:16px;color:${MUTED};margin-bottom:18px;">${escapeHtml(greeting)}</div>

        <div style="margin-bottom:16px;">
          <span style="display:inline-block;background:${reason.bg};color:${reason.fg};font-size:13px;font-weight:700;padding:5px 12px;border-radius:999px;">${reason.label}</span>${kind}
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 ${sub ? "10px" : "22px"} 0;"><tr>
          <td width="92" valign="top">${tile}</td>
          <td valign="middle" style="padding-left:6px;"><h1 style="margin:0;font-size:25px;line-height:1.3;font-weight:800;color:${INK};">${title}</h1></td>
        </tr></table>
        ${sub ? `<div style="font-size:17px;font-weight:700;color:${reason.fg};margin:0 0 22px 0;">${escapeHtml(sub)}</div>` : ""}
        ${changed}${detailTable}${about}${note}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td align="center" bgcolor="#dc2626" style="background:#dc2626;border-radius:12px;">
            <a href="${url}" style="display:block;padding:16px 24px;font-family:${FONT};font-size:17px;font-weight:700;color:#ffffff;text-decoration:none;">Lihat detail agenda</a>
          </td>
        </tr></table>
        <div style="font-size:14px;line-height:1.5;color:${MUTED};margin-top:14px;text-align:center;">Masuk dengan akun anggota untuk melihat agenda ini.</div>
      </td></tr>

      <tr><td style="padding:20px 8px 0 8px;text-align:center;font-size:13px;line-height:1.7;color:${MUTED};">
        Pemberitahuan otomatis dari PC KMHDI Malang untuk anggota.<br>${footerLink}
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text: string[] = [greeting, "", `[${reason.label}] ${input.title}`];
  if (input.kindLabel) text.push(input.kindLabel);
  if (sub) text.push(sub);
  text.push("");
  if (input.changes?.length) {
    text.push("YANG BERUBAH");
    for (const c of input.changes) text.push(`- ${c.label}: ${c.from} -> ${c.to}`);
    text.push("");
  }
  text.push(`Waktu   : ${d.dateLabel}`, `          ${d.timeLabel}${d.durationLabel ? ` (${d.durationLabel})` : ""}`);
  if (d.location) text.push(`Lokasi  : ${d.location}`);
  if (d.link) text.push(`Tautan  : ${d.link}`);
  if (d.locationNote) text.push(`Detail  : ${d.locationNote}`);
  text.push(`Untuk   : ${d.audience}`);
  if (d.description) text.push("", "TENTANG AGENDA", d.description);
  if (d.note) text.push("", "CATATAN", d.note);
  text.push("", `Lihat detail agenda: ${input.url}`, "Masuk dengan akun anggota untuk melihat agenda ini.", "", "Pemberitahuan otomatis dari PC KMHDI Malang untuk anggota.");
  if (input.profileUrl) text.push(`Atur email notifikasi: ${input.profileUrl}`);

  return { subject: input.title, html, text: text.join("\n") };
}
