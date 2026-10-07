import { AGENDA_KIND_LABEL, formatAgendaRange, type Agenda } from "@/lib/agenda";
import { dateInJakarta } from "@/lib/date";

// Isi notifikasi agenda — murni (tanpa database/jaringan) supaya bisa diuji unit dan dipakai sama
// persis oleh semua kanal (lonceng, email, dan kanal lain nanti).

export type NotifyReason = "CREATED" | "UPDATED" | "REMINDER_H1";

export type NotificationContent = { title: string; body: string };

/** Path halaman agenda (relatif). Domain ditambahkan oleh pemakainya — lihat lib/notify/channels. */
export function agendaPath(agenda: Pick<Agenda, "slug">): string {
  return `/agenda/${agenda.slug}`;
}

// Kunci idempotensi satu notifikasi (kolom NotificationDelivery.reason). Bukan sekadar jenisnya:
//  - CREATED: satu kali seumur agenda.
//  - UPDATED: unik per versi agenda (updatedAt), jadi dua kali diubah = dua notifikasi, tapi
//    pemanggilan ulang untuk versi yang sama tidak mengirim dobel.
//  - REMINDER_H1: unik per tanggal mulai, jadi agenda yang jadwalnya digeser mendapat pengingat
//    baru, sedangkan cron yang terpanggil dua kali di hari yang sama tidak mengirim dobel.
export function reasonKey(agenda: Pick<Agenda, "startAt" | "updatedAt">, reason: NotifyReason): string {
  if (reason === "UPDATED") return `UPDATED:${agenda.updatedAt ?? ""}`;
  if (reason === "REMINDER_H1") return `REMINDER_H1:${dateInJakarta(agenda.startAt)}`;
  return "CREATED";
}

export function buildNotificationContent(agenda: Pick<Agenda, "title" | "kind" | "startAt" | "endAt" | "allDay" | "location">, reason: NotifyReason): NotificationContent {
  const when = formatAgendaRange(agenda);
  const parts = [AGENDA_KIND_LABEL[agenda.kind], when];
  if (agenda.location) parts.push(agenda.location);
  const body = parts.join(" · ");

  if (reason === "UPDATED") return { title: `Agenda diperbarui: ${agenda.title}`, body };
  if (reason === "REMINDER_H1") return { title: `Besok: ${agenda.title}`, body };
  return { title: `Agenda baru: ${agenda.title}`, body };
}

function sameInstant(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  // Database mengembalikan "…+00:00", kode kita menulis "…Z": bandingkan sebagai waktu, bukan teks.
  return new Date(a).getTime() === new Date(b).getTime();
}

// Hanya perubahan yang menyangkut JADWAL atau TEMPAT yang layak memicu notifikasi "diperbarui".
// Mengoreksi typo di deskripsi atau mengganti audiens tidak boleh membanjiri notifikasi anggota.
export function hasMeaningfulChange(before: Pick<Agenda, "title" | "startAt" | "endAt" | "allDay" | "location" | "locationDetail">, after: Pick<Agenda, "title" | "startAt" | "endAt" | "allDay" | "location" | "locationDetail">): boolean {
  return (
    before.title !== after.title ||
    !sameInstant(before.startAt, after.startAt) ||
    !sameInstant(before.endAt, after.endAt) ||
    before.allDay !== after.allDay ||
    (before.location ?? "") !== (after.location ?? "") ||
    (before.locationDetail ?? "") !== (after.locationDetail ?? "")
  );
}

// Apakah agenda yang SUDAH diumumkan berubah (judul/jadwal/tempat/tautan) sejak keadaan terakhir
// yang diberitahukan ke anggota? Dihitung dari perbandingan dengan snapshot, bukan dari bendera
// yang dipasang saat edit — jadi:
//  - beberapa kali edit berturut-turut tetap SATU "ada perubahan" (dan satu pembaruan dengan selisih
//    bersihnya);
//  - edit yang dikembalikan seperti semula otomatis tidak lagi dianggap perubahan;
//  - koreksi kecil (typo di deskripsi) tidak pernah dianggap perubahan.
// Agenda yang belum diumumkan tidak punya "perubahan": anggota belum tahu apa-apa tentangnya.
// Pembaruan TIDAK dikirim otomatis; sekretaris menekan "Kirim pembaruan".
export function hasPendingChange(agenda: Pick<Agenda, "announcedAt" | "notifiedSnapshot" | "title" | "startAt" | "endAt" | "allDay" | "location" | "locationDetail">): boolean {
  if (!agenda.announcedAt || !agenda.notifiedSnapshot) return false;
  return hasMeaningfulChange(agenda.notifiedSnapshot, agenda);
}
