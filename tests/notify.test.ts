import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { agendaPath, buildNotificationContent, hasMeaningfulChange, reasonKey } from "@/lib/notify/content";
import { buildEmail, escapeHtml } from "@/lib/notify/emailTemplate";

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

describe("notify — templat email", () => {
  it("meng-escape karakter HTML", () => {
    assert.equal(escapeHtml(`<b>"A" & 'B'</b>`), "&lt;b&gt;&quot;A&quot; &amp; &#39;B&#39;&lt;/b&gt;");
  });

  it("judul berisi tag skrip tidak pernah lolos mentah ke HTML", () => {
    const email = buildEmail({ title: `<script>alert(1)</script>`, body: `<img src=x onerror=alert(2)>`, url: "https://apps.kmhdimalang.org/agenda/x" });
    assert.equal(email.html.includes("<script>"), false);
    assert.equal(email.html.includes("<img src=x"), false);
    assert.equal(email.html.includes("&lt;script&gt;"), true);
  });

  it("nama penerima yang berisi HTML juga di-escape, dan hanya nama depan yang dipakai", () => {
    const email = buildEmail({ title: "T", body: "B", url: "https://x.test/a", recipientName: "<i>Budi</i> Santoso" });
    assert.equal(email.html.includes("<i>"), false);
    assert.equal(email.text.startsWith("Halo <i>Budi</i>,"), true);
    assert.equal(buildEmail({ title: "T", body: "B", url: "https://x.test/a", recipientName: "Ayu Lestari" }).text.startsWith("Halo Ayu,"), true);
  });

  it("tanpa nama, sapaan tetap wajar", () => {
    assert.equal(buildEmail({ title: "T", body: "B", url: "https://x.test/a" }).text.startsWith("Halo,"), true);
    assert.equal(buildEmail({ title: "T", body: "B", url: "https://x.test/a", recipientName: "   " }).text.startsWith("Halo,"), true);
  });

  it("subjek = judul, dan tautan ada di versi HTML maupun teks", () => {
    const email = buildEmail({ title: "Besok: Rapat Pleno", body: "B", url: "https://apps.kmhdimalang.org/agenda/rapat" });
    assert.equal(email.subject, "Besok: Rapat Pleno");
    assert.equal(email.html.includes('href="https://apps.kmhdimalang.org/agenda/rapat"'), true);
    assert.equal(email.text.includes("https://apps.kmhdimalang.org/agenda/rapat"), true);
  });
});
