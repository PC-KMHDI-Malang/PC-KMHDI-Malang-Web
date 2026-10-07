import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { agendaPath, buildNotificationContent, hasMeaningfulChange, reasonKey } from "@/lib/notify/content";
import { buildEmail, escapeHtml } from "@/lib/notify/emailTemplate";
import { buildEmailDetails, describeChanges } from "@/lib/notify/emailDetails";
import type { Agenda } from "@/lib/agenda";

const agenda = {
  title: "Rapat Pleno",
  slug: "rapat-pleno-abcde",
  kind: "RAPAT" as const,
  startAt: "2026-10-10T12:00:00.000Z", // 19.00 WIB, 10 Okt
  endAt: "2026-10-10T14:00:00.000Z",
  allDay: false,
  location: "Sekretariat",
  locationDetail: "https://meet.example/ruang",
  updatedAt: "2026-10-01T03:00:00.000Z",
};

describe("notify — kunci idempotensi (reasonKey)", () => {
  it("CREATED konstan: satu pengumuman per agenda", () => {
    assert.equal(reasonKey(agenda, "CREATED"), "CREATED");
  });

  it("UPDATED unik per versi agenda, supaya dua kali diubah = dua notifikasi", () => {
    const v1 = reasonKey({ ...agenda, updatedAt: "2026-10-01T03:00:00.000Z" }, "UPDATED");
    const v2 = reasonKey({ ...agenda, updatedAt: "2026-10-02T03:00:00.000Z" }, "UPDATED");
    assert.notEqual(v1, v2);
    // ...tapi pemanggilan ulang untuk versi yang sama menghasilkan kunci yang sama (tidak dobel).
    assert.equal(v1, reasonKey({ ...agenda, updatedAt: "2026-10-01T03:00:00.000Z" }, "UPDATED"));
  });

  it("REMINDER_H1 mengikuti tanggal mulai WIB, bukan tanggal UTC", () => {
    // 20.00 UTC tanggal 9 = tanggal 10 WIB.
    assert.equal(reasonKey({ ...agenda, startAt: "2026-10-09T20:00:00.000Z" }, "REMINDER_H1"), "REMINDER_H1:2026-10-10");
  });

  it("REMINDER_H1 untuk agenda yang digeser tanggalnya mendapat kunci baru", () => {
    const before = reasonKey(agenda, "REMINDER_H1");
    const moved = reasonKey({ ...agenda, startAt: "2026-10-17T12:00:00.000Z" }, "REMINDER_H1");
    assert.notEqual(before, moved);
  });

  it("ketiga jenis tidak pernah saling bertabrakan", () => {
    const keys = new Set([reasonKey(agenda, "CREATED"), reasonKey(agenda, "UPDATED"), reasonKey(agenda, "REMINDER_H1")]);
    assert.equal(keys.size, 3);
  });
});

describe("notify — isi notifikasi", () => {
  it("membedakan judul untuk baru, diperbarui, dan pengingat", () => {
    assert.equal(buildNotificationContent(agenda, "CREATED").title, "Agenda baru: Rapat Pleno");
    assert.equal(buildNotificationContent(agenda, "UPDATED").title, "Agenda diperbarui: Rapat Pleno");
    assert.equal(buildNotificationContent(agenda, "REMINDER_H1").title, "Besok: Rapat Pleno");
  });

  it("badan memuat jenis, waktu WIB, dan lokasi", () => {
    const { body } = buildNotificationContent(agenda, "CREATED");
    assert.match(body, /^Rapat · /);
    assert.match(body, /19\.00-21\.00 WIB/);
    assert.match(body, /Sekretariat$/);
  });

  it("tanpa lokasi, badan tidak berakhir dengan pemisah menggantung", () => {
    const { body } = buildNotificationContent({ ...agenda, location: null }, "CREATED");
    assert.equal(body.endsWith("·"), false);
    assert.equal(body.includes("null"), false);
  });

  it("path agenda memakai slug", () => {
    assert.equal(agendaPath(agenda), "/agenda/rapat-pleno-abcde");
  });
});

describe("notify — perubahan yang layak diberitahukan", () => {
  const same = { ...agenda };

  it("tidak ada perubahan = tidak diberitahukan", () => {
    assert.equal(hasMeaningfulChange(agenda, same), false);
  });

  it("format timestamp berbeda untuk waktu yang sama bukan perubahan", () => {
    // Database mengembalikan "+00:00", kode menulis "Z" — keduanya detik yang sama.
    assert.equal(hasMeaningfulChange(agenda, { ...agenda, startAt: "2026-10-10T12:00:00+00:00", endAt: "2026-10-10T14:00:00+00:00" }), false);
  });

  it("jadwal, tempat, judul, atau tautan yang berubah diberitahukan", () => {
    assert.equal(hasMeaningfulChange(agenda, { ...agenda, startAt: "2026-10-10T13:00:00.000Z" }), true);
    assert.equal(hasMeaningfulChange(agenda, { ...agenda, endAt: null }), true);
    assert.equal(hasMeaningfulChange(agenda, { ...agenda, allDay: true }), true);
    assert.equal(hasMeaningfulChange(agenda, { ...agenda, location: "Aula" }), true);
    assert.equal(hasMeaningfulChange(agenda, { ...agenda, locationDetail: "https://meet.example/lain" }), true);
    assert.equal(hasMeaningfulChange(agenda, { ...agenda, title: "Rapat Pleno II" }), true);
  });

  it("lokasi kosong dan null dianggap sama", () => {
    assert.equal(hasMeaningfulChange({ ...agenda, location: null }, { ...agenda, location: "" }), false);
  });
});

// Agenda lengkap untuk menguji rincian email.
const full = {
  id: "a1",
  title: "Rapat Pleno",
  slug: "rapat-pleno-abcde",
  description: "Evaluasi program kerja.\n\nBawa laporan singkat.",
  kind: "RAPAT",
  startAt: "2026-10-10T12:00:00.000Z", // Sabtu 10 Okt, 19.00 WIB
  endAt: "2026-10-10T14:00:00.000Z", // 21.00 WIB
  allDay: false,
  location: "Sekretariat",
  locationDetail: "https://meet.example/ruang",
  internalNote: "Bawa laptop",
  status: "PUBLISHED",
  remindH1: true,
  announcedAt: null,
  audience: "SEMUA",
  audienceBidang: null,
} as Agenda;

describe("notify — rincian email dari agenda", () => {
  it("ubin tanggal memakai tanggal WIB, bukan tanggal UTC", () => {
    const d = buildEmailDetails(full);
    assert.deepEqual(d.tile, { weekday: "Sabtu", day: "10", month: "OKT", year: "2026" });
    // 20.00 UTC tanggal 9 = 03.00 WIB tanggal 10.
    assert.equal(buildEmailDetails({ ...full, startAt: "2026-10-09T20:00:00.000Z", endAt: null }).tile.day, "10");
  });

  it("waktu: tanggal lengkap dengan nama hari, jam, dan durasi", () => {
    const d = buildEmailDetails(full);
    assert.equal(d.dateLabel, "Sabtu, 10 Oktober 2026");
    assert.equal(d.timeLabel, "19.00 – 21.00 WIB");
    assert.equal(d.durationLabel, "2 jam");
  });

  it("durasi ditulis jam + menit, atau menit saja", () => {
    assert.equal(buildEmailDetails({ ...full, endAt: "2026-10-10T13:30:00.000Z" }).durationLabel, "1 jam 30 menit");
    assert.equal(buildEmailDetails({ ...full, endAt: "2026-10-10T12:45:00.000Z" }).durationLabel, "45 menit");
  });

  it("tanpa jam selesai: hanya jam mulai, tanpa durasi", () => {
    const d = buildEmailDetails({ ...full, endAt: null });
    assert.equal(d.timeLabel, "Mulai pukul 19.00 WIB");
    assert.equal(d.durationLabel, null);
  });

  it("sepanjang hari, satu hari maupun beberapa hari", () => {
    const one = buildEmailDetails({ ...full, allDay: true, endAt: null });
    assert.equal(one.timeLabel, "Sepanjang hari");
    assert.equal(one.durationLabel, null);

    const multi = buildEmailDetails({ ...full, allDay: true, startAt: "2026-10-09T17:00:00.000Z", endAt: "2026-10-12T16:59:59.000Z" });
    assert.equal(multi.dateLabel, "Sabtu, 10 Oktober 2026 – Senin, 12 Oktober 2026");
    assert.equal(multi.durationLabel, "3 hari");
  });

  it("detail lokasi berupa URL menjadi tautan, selain itu menjadi catatan teks", () => {
    assert.equal(buildEmailDetails(full).link, "https://meet.example/ruang");
    assert.equal(buildEmailDetails(full).locationNote, null);

    const text = buildEmailDetails({ ...full, locationDetail: "Ruang 3.2 lantai 3" });
    assert.equal(text.link, null);
    assert.equal(text.locationNote, "Ruang 3.2 lantai 3");

    const blank = buildEmailDetails({ ...full, locationDetail: "   " });
    assert.equal(blank.link, null);
    assert.equal(blank.locationNote, null);
  });

  it("baris kosong menjadi null, dan audiens ikut dirangkum", () => {
    const d = buildEmailDetails({ ...full, location: null, description: "  ", internalNote: null, audience: "BIDANG", audienceBidang: ["Kaderisasi"] });
    assert.equal(d.location, null);
    assert.equal(d.description, null);
    assert.equal(d.note, null);
    assert.equal(d.audience, "Bidang: Kaderisasi");
  });
});

describe("notify — apa yang berubah", () => {
  it("tidak ada perubahan = daftar kosong", () => {
    assert.deepEqual(describeChanges(full, { ...full }), []);
  });

  it("hanya melaporkan yang benar-benar berbeda", () => {
    const changes = describeChanges(full, { ...full, startAt: "2026-10-10T13:00:00.000Z", endAt: "2026-10-10T15:30:00.000Z", location: "Aula" });
    assert.deepEqual(changes.map((c) => c.label), ["Waktu", "Lokasi"]);
    assert.equal(changes[0].from, "19.00 – 21.00 WIB");
    assert.equal(changes[0].to, "20.00 – 22.30 WIB");
    assert.equal(changes[1].from, "Sekretariat");
    assert.equal(changes[1].to, "Aula");
  });

  it("lokasi yang baru diisi atau dikosongkan tampil sebagai tanda hubung", () => {
    const added = describeChanges({ ...full, location: null }, full);
    assert.equal(added[0].from, "—");
    const removed = describeChanges(full, { ...full, location: null });
    assert.equal(removed[0].to, "—");
  });

  it("judul, tanggal, dan tautan juga terdeteksi", () => {
    const labels = describeChanges(full, { ...full, title: "Rapat Pleno II", startAt: "2026-10-11T12:00:00.000Z", endAt: "2026-10-11T14:00:00.000Z", locationDetail: "https://meet.example/lain" }).map((c) => c.label);
    assert.deepEqual(labels, ["Judul", "Tanggal", "Tautan / detail lokasi"]);
  });

  it("deskripsi dan catatan yang berubah tidak dilaporkan sebagai perubahan jadwal", () => {
    assert.deepEqual(describeChanges(full, { ...full, description: "Teks lain", internalNote: "Lain" }), []);
  });
});

describe("notify — templat email", () => {
  const base = { title: "Agenda baru: Rapat Pleno", summary: "ringkasan", url: "https://apps.kmhdimalang.org/agenda/rapat-pleno-abcde", details: buildEmailDetails(full) };

  it("meng-escape karakter HTML", () => {
    assert.equal(escapeHtml(`<b>"A" & 'B'</b>`), "&lt;b&gt;&quot;A&quot; &amp; &#39;B&#39;&lt;/b&gt;");
  });

  it("semua teks dari agenda di-escape, tidak ada yang lolos sebagai HTML", () => {
    const evil = { ...full, title: "<script>t()</script>", location: "<img src=x onerror=a()>", description: "<b>tebal</b>", internalNote: "<i>miring</i>", locationDetail: "ruang <u>x</u>" };
    const changes = [{ label: "Lokasi", from: "<s>lama</s>", to: "<em>baru</em>" }];
    const html = buildEmail({ ...base, title: evil.title, details: buildEmailDetails(evil), changes, reason: "UPDATED" }).html;
    for (const raw of ["<script>", "<img src=x", "<b>tebal", "<i>miring", "<u>x", "<s>lama", "<em>baru"]) {
      assert.equal(html.includes(raw), false, raw);
    }
    assert.equal(html.includes("&lt;script&gt;"), true);
  });

  it("memuat deskripsi per paragraf, tautan rapat yang bisa diklik, catatan, dan audiens", () => {
    const html = buildEmail(base).html;
    assert.equal(html.includes("Evaluasi program kerja."), true);
    assert.equal(html.includes("Bawa laporan singkat."), true);
    assert.equal(html.includes('href="https://meet.example/ruang"'), true);
    assert.equal(html.includes("Bawa laptop"), true);
    assert.equal(html.includes("Semua anggota"), true);
    assert.equal(html.includes("Sabtu, 10 Oktober 2026"), true);
    assert.equal(html.includes("19.00 – 21.00 WIB"), true);
    assert.equal(html.includes("(2 jam)"), true);
  });

  it("baris tanpa isi tidak ditampilkan sama sekali", () => {
    const html = buildEmail({ ...base, details: buildEmailDetails({ ...full, location: null, locationDetail: null, description: null, internalNote: null }) }).html;
    for (const label of ["Lokasi", "Tautan", "Tentang agenda", "Catatan"]) assert.equal(html.includes(label), false, label);
  });

  it("kotak 'Yang berubah' hanya muncul untuk agenda diperbarui yang punya perubahan", () => {
    const changes = [{ label: "Waktu", from: "19.00 WIB", to: "20.00 WIB" }];
    assert.equal(buildEmail({ ...base, reason: "UPDATED", changes }).html.includes("Yang berubah"), true);
    assert.equal(buildEmail({ ...base, reason: "UPDATED", changes: [] }).html.includes("Yang berubah"), false);
    assert.equal(buildEmail({ ...base, reason: "CREATED" }).html.includes("Yang berubah"), false);
  });

  it("jenis kabar membedakan label dan kalimat pengingat", () => {
    assert.equal(buildEmail({ ...base, reason: "CREATED" }).html.includes("Agenda baru"), true);
    assert.equal(buildEmail({ ...base, reason: "UPDATED" }).html.includes("Agenda diperbarui"), true);
    const reminder = buildEmail({ ...base, reason: "REMINDER_H1" });
    assert.equal(reminder.html.includes("Dimulai besok"), true);
    // Agenda berjam-rentang menyebut rentangnya; "pukul" hanya dipakai bila tidak ada jam selesai.
    assert.equal(reminder.html.includes("Dimulai besok · 19.00 – 21.00 WIB"), true);
    const noEnd = buildEmail({ ...base, reason: "REMINDER_H1", details: buildEmailDetails({ ...full, endAt: null }) });
    assert.equal(noEnd.html.includes("Dimulai besok · pukul 19.00 WIB"), true);
    const allDay = buildEmail({ ...base, reason: "REMINDER_H1", details: buildEmailDetails({ ...full, allDay: true, endAt: null }) });
    assert.equal(allDay.html.includes("Berlangsung besok, sepanjang hari"), true);
    assert.equal(buildEmail({ ...base, reason: "CREATED" }).html.includes("Dimulai besok"), false);
  });

  it("sapaan memakai nama depan saja, dan tetap wajar tanpa nama", () => {
    assert.equal(buildEmail({ ...base, recipientName: "Ayu Lestari" }).text.startsWith("Halo Ayu,"), true);
    assert.equal(buildEmail({ ...base, recipientName: "<i>Budi</i> S" }).html.includes("<i>"), false);
    assert.equal(buildEmail(base).text.startsWith("Halo,"), true);
    assert.equal(buildEmail({ ...base, recipientName: "   " }).text.startsWith("Halo,"), true);
  });

  it("logo dan tautan profil hanya ada kalau diberikan", () => {
    const without = buildEmail(base).html;
    assert.equal(without.includes("<img"), false);
    assert.equal(without.includes("Atur email notifikasi"), false);

    const withBoth = buildEmail({ ...base, logoUrl: "https://kmhdimalang.org/image/logo-192.png", profileUrl: "https://apps.kmhdimalang.org/profile" }).html;
    assert.equal(withBoth.includes('src="https://kmhdimalang.org/image/logo-192.png"'), true);
    assert.equal(withBoth.includes('href="https://apps.kmhdimalang.org/profile"'), true);
  });

  it("subjek = judul; versi teks memuat rincian dan tautan", () => {
    const email = buildEmail({ ...base, changes: [{ label: "Lokasi", from: "A", to: "B" }], reason: "UPDATED" });
    assert.equal(email.subject, "Agenda baru: Rapat Pleno");
    for (const needle of ["Sabtu, 10 Oktober 2026", "19.00 – 21.00 WIB", "Sekretariat", "https://meet.example/ruang", "Semua anggota", "Lokasi: A -> B", "Evaluasi program kerja.", "Bawa laptop", base.url]) {
      assert.equal(email.text.includes(needle), true, needle);
    }
  });
});
