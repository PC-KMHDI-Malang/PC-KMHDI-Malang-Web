import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isAppPath } from "@/lib/appHost";
import { decideUpdateNotification } from "@/lib/notify/content";
import { addDays, dateInJakarta, jakartaDayRange, timeInputInJakarta, todayInJakarta, tomorrowInJakarta } from "@/lib/date";
import { BIDANG_OPTIONS, isSameBidang, isTargetableBidang } from "@/lib/bidang";
import { currentPeriod, isKasMember, isTreasurerEmail } from "@/lib/kas";
import {
  SECRETARY_EMAIL,
  agendaStatus,
  canViewAgenda,
  describeAudience,
  formatAgendaRange,
  groupAgendaByDate,
  isAgendaRecipient,
  isSecretaryEmail,
  monthGrid,
  parseAgendaInput,
  pickUpcoming,
  resolveAudience,
  resolveMonthParam,
  shiftMonthParam,
  slugifyAgenda,
  type Agenda,
} from "@/lib/agenda";

const baseAgenda: Agenda = {
  id: "a1",
  title: "Rapat Pleno",
  slug: "rapat-pleno-abcde",
  description: "Pembahasan program kerja",
  kind: "RAPAT",
  startAt: "2026-10-10T12:00:00.000Z", // 19.00 WIB
  endAt: "2026-10-10T14:00:00.000Z", // 21.00 WIB
  allDay: false,
  location: "Sekretariat",
  locationDetail: "https://meet.example/ruang",
  internalNote: "Bawa laptop",
  status: "PUBLISHED",
  sendNotification: true,
  audience: "BIDANG",
  audienceBidang: ["Kaderisasi"],
  createdBy: "u-sekretaris",
};

describe("date — helper tanggal WIB bersama (lib/date.ts)", () => {
  it("memetakan timestamp UTC ke tanggal WIB, bukan tanggal UTC", () => {
    // 20.00 UTC tanggal 9 = 03.00 WIB tanggal 10.
    assert.equal(dateInJakarta("2026-10-09T20:00:00.000Z"), "2026-10-10");
    // 16.59 UTC tanggal 9 = 23.59 WIB tanggal 9 (belum ganti hari).
    assert.equal(dateInJakarta("2026-10-09T16:59:00.000Z"), "2026-10-09");
  });

  it("mengembalikan string kosong untuk timestamp rusak", () => {
    assert.equal(dateInJakarta("bukan-tanggal"), "");
    assert.equal(timeInputInJakarta("bukan-tanggal"), "");
  });

  it("menulis jam untuk <input type=time> sebagai HH:mm, termasuk tengah malam", () => {
    assert.equal(timeInputInJakarta("2026-10-10T12:30:00.000Z"), "19:30");
    // 17.00 UTC = 00.00 WIB — harus "00:00", bukan "24:00".
    assert.equal(timeInputInJakarta("2026-10-09T17:00:00.000Z"), "00:00");
  });

  it("menggeser tanggal melewati batas bulan dan tahun", () => {
    assert.equal(addDays("2026-10-31", 1), "2026-11-01");
    assert.equal(addDays("2026-12-31", 1), "2027-01-01");
    assert.equal(addDays("2028-02-28", 1), "2028-02-29");
    assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  });

  it("menghitung 'besok' menurut WIB walau server berjalan di UTC", () => {
    // 18.00 UTC tanggal 9 = 01.00 WIB tanggal 10 -> hari ini 10, besok 11 (bukan 10).
    assert.equal(tomorrowInJakarta(new Date("2026-10-09T18:00:00.000Z")), "2026-10-11");
  });

  it("membuat rentang query satu hari WIB", () => {
    const range = jakartaDayRange("2026-10-10");
    assert.equal(new Date(range.start).toISOString(), "2026-10-09T17:00:00.000Z");
    assert.equal(new Date(range.end).toISOString(), "2026-10-10T16:59:59.999Z");
  });
});

describe("bidang — pencocokan bidang kepengurusan", () => {
  it("mencocokkan tanpa peduli kapitalisasi dan spasi", () => {
    assert.equal(isSameBidang("Kaderisasi", "  kaderisasi "), true);
    assert.equal(isSameBidang("Data dan Informasi", "DATA DAN INFORMASI"), true);
  });

  it("tidak pernah mencocokkan nilai kosong", () => {
    assert.equal(isSameBidang("", ""), false);
    assert.equal(isSameBidang(null, "Kaderisasi"), false);
    assert.equal(isSameBidang("Kaderisasi", undefined), false);
  });

  it("menolak 'Tidak Ada' dan kosong sebagai target audiens", () => {
    assert.equal(isTargetableBidang("Tidak Ada"), false);
    assert.equal(isTargetableBidang(" tidak ada "), false);
    assert.equal(isTargetableBidang(""), false);
    assert.equal(isTargetableBidang("Litbang"), true);
  });

  it("tidak memuat 'Tidak Ada' di daftar bidang yang bisa ditarget", () => {
    assert.equal((BIDANG_OPTIONS as readonly string[]).includes("Tidak Ada"), false);
  });
});

describe("agenda — hak kelola sekretaris (berbasis email, bukan role)", () => {
  it("hanya menerima email sekretaris, tahan kapitalisasi & spasi", () => {
    assert.equal(isSecretaryEmail(SECRETARY_EMAIL), true);
    assert.equal(isSecretaryEmail(`  ${SECRETARY_EMAIL.toUpperCase()} `), true);
  });

  it("menolak email lain, termasuk bendahara dan kosong", () => {
    assert.equal(isSecretaryEmail("bendahara@kmhdimalang.org"), false);
    assert.equal(isSecretaryEmail("kader@gmail.com"), false);
    assert.equal(isSecretaryEmail(""), false);
    assert.equal(isSecretaryEmail(null), false);
    assert.equal(isSecretaryEmail(undefined), false);
  });

  it("tidak tertukar dengan hak bendahara", () => {
    assert.equal(isTreasurerEmail(SECRETARY_EMAIL), false);
  });
});

describe("agenda — akses halaman (khusus anggota yang login)", () => {
  it("menolak pengunjung yang belum login", () => {
    assert.equal(canViewAgenda(null), false);
    assert.equal(canViewAgenda(undefined), false);
    assert.equal(canViewAgenda({ user: null }), false);
  });

  it("menolak Akun Umum (VIEWER), sama seperti Uang Kas", () => {
    assert.equal(canViewAgenda({ user: { email: "umum@gmail.com", role: "VIEWER" } }), false);
  });

  it("menerima semua role anggota lain, termasuk KONTRIBUTOR dan ADMIN", () => {
    for (const role of ["USER", "KONTRIBUTOR", "ADMIN"]) {
      assert.equal(canViewAgenda({ user: { email: "kader@gmail.com", role } }), true, role);
    }
  });
});

describe("agenda — grid kalender", () => {
  it("selalu 42 sel dan dimulai hari Senin", () => {
    for (const [y, m] of [[2026, 2], [2026, 10], [2027, 1], [2028, 2]] as const) {
      const cells = monthGrid(y, m);
      assert.equal(cells.length, 42, `${y}-${m}`);
      const first = new Date(`${cells[0].date}T00:00:00Z`).getUTCDay();
      assert.equal(first, 1, `${y}-${m} harus mulai Senin`);
    }
  });

  it("menandai sel pengisi sebagai di luar bulan", () => {
    // Oktober 2026: 1 Oktober = Kamis, jadi Sen-Rab (28-30 September) adalah pengisi.
    const cells = monthGrid(2026, 10);
    assert.deepEqual(cells.slice(0, 3).map((c) => c.date), ["2026-09-28", "2026-09-29", "2026-09-30"]);
    assert.equal(cells.slice(0, 3).every((c) => !c.inMonth), true);
    assert.equal(cells[3].date, "2026-10-01");
    assert.equal(cells[3].inMonth, true);
    assert.equal(cells.filter((c) => c.inMonth).length, 31);
  });

  it("menangani Februari kabisat dan bukan kabisat", () => {
    assert.equal(monthGrid(2028, 2).filter((c) => c.inMonth).length, 29);
    assert.equal(monthGrid(2026, 2).filter((c) => c.inMonth).length, 28);
  });

  it("menggeser bulan melewati pergantian tahun", () => {
    assert.equal(shiftMonthParam("2026-12", 1), "2027-01");
    assert.equal(shiftMonthParam("2026-01", -1), "2025-12");
    assert.equal(shiftMonthParam("2026-10", 0), "2026-10");
  });

  it("mengabaikan parameter bulan yang rusak", () => {
    const now = new Date("2026-10-09T18:00:00.000Z"); // 10 Okt WIB
    assert.equal(resolveMonthParam("2026-13", now), "2026-10");
    assert.equal(resolveMonthParam("abc", now), "2026-10");
    assert.equal(resolveMonthParam(undefined, now), "2026-10");
    assert.equal(resolveMonthParam("2027-03", now), "2027-03");
  });

  it("mengelompokkan agenda ke tanggal WIB-nya, bukan tanggal UTC", () => {
    // 20.00 UTC tanggal 9 = tanggal 10 WIB.
    const grouped = groupAgendaByDate([{ startAt: "2026-10-09T20:00:00.000Z" }, { startAt: "2026-10-10T05:00:00.000Z" }]);
    assert.equal(grouped.get("2026-10-10")?.length, 2);
    assert.equal(grouped.has("2026-10-09"), false);
  });
});

describe("agenda — status waktu", () => {
  it("AKAN_DATANG sebelum mulai", () => {
    assert.equal(agendaStatus(baseAgenda, new Date("2026-10-10T11:59:59.000Z")), "AKAN_DATANG");
  });

  it("BERLANGSUNG tepat di startAt dan di tengah rentang", () => {
    assert.equal(agendaStatus(baseAgenda, new Date("2026-10-10T12:00:00.000Z")), "BERLANGSUNG");
    assert.equal(agendaStatus(baseAgenda, new Date("2026-10-10T13:00:00.000Z")), "BERLANGSUNG");
  });

  it("SELESAI setelah endAt", () => {
    assert.equal(agendaStatus(baseAgenda, new Date("2026-10-10T14:00:01.000Z")), "SELESAI");
  });

  it("tanpa endAt dianggap berlangsung sampai akhir hari WIB, bukan selesai seketika", () => {
    const noEnd = { ...baseAgenda, endAt: null };
    // 23.00 WIB hari itu masih berlangsung.
    assert.equal(agendaStatus(noEnd, new Date("2026-10-10T16:00:00.000Z")), "BERLANGSUNG");
    // 00.30 WIB hari berikutnya sudah selesai.
    assert.equal(agendaStatus(noEnd, new Date("2026-10-10T17:30:00.000Z")), "SELESAI");
  });

  it("memformat rentang waktu dalam WIB", () => {
    assert.equal(formatAgendaRange(baseAgenda), "Sab, 10 Oktober 2026 · 19.00-21.00 WIB");
    assert.match(formatAgendaRange({ ...baseAgenda, endAt: null }), /19\.00 WIB$/);
    assert.match(formatAgendaRange({ ...baseAgenda, allDay: true, endAt: null }), /Sepanjang hari$/);
  });
});

describe("agenda — penerima notifikasi", () => {
  const users = [
    { id: "1", email: "a@gmail.com", role: "USER", bidang: "Kaderisasi" },
    { id: "2", email: "b@gmail.com", role: "USER", bidang: "  kaderisasi " },
    { id: "3", email: "c@gmail.com", role: "USER", bidang: "Litbang" },
    { id: "4", email: "d@gmail.com", role: "KONTRIBUTOR", bidang: "Kaderisasi" },
    { id: "5", email: "e@gmail.com", role: "VIEWER", bidang: "Kaderisasi" },
    { id: "6", email: "pcmalang@kmhdi.info", role: "USER", bidang: "Kaderisasi" },
    { id: "7", email: null, role: "USER", bidang: "Kaderisasi" },
    { id: "8", email: "h@gmail.com", role: "USER", bidang: null },
    { id: "9", email: "i@gmail.com", role: "ADMIN", bidang: "Tidak Ada" },
  ];

  it("mengecualikan VIEWER, akun bersama, dan akun tanpa email", () => {
    const ids = users.filter(isAgendaRecipient).map((u) => u.id);
    assert.deepEqual(ids, ["1", "2", "3", "4", "8", "9"]);
  });

  it("SEMUA mengirim ke semua penerima sah, termasuk KONTRIBUTOR dan ADMIN", () => {
    const ids = resolveAudience({ audience: "SEMUA", audienceBidang: null }, users).map((u) => u.id);
    assert.deepEqual(ids, ["1", "2", "3", "4", "8", "9"]);
  });

  it("BIDANG hanya mengirim ke bidang yang dipilih, tahan beda kapitalisasi/spasi", () => {
    const ids = resolveAudience({ audience: "BIDANG", audienceBidang: ["Kaderisasi"] }, users).map((u) => u.id);
    assert.deepEqual(ids, ["1", "2", "4"]); // 5 (VIEWER) dan 6 (akun bersama) tetap tersaring
  });

  it("BIDANG dengan beberapa bidang menyatukan keduanya", () => {
    const ids = resolveAudience({ audience: "BIDANG", audienceBidang: ["Kaderisasi", "Litbang"] }, users).map((u) => u.id);
    assert.deepEqual(ids, ["1", "2", "3", "4"]);
  });

  it("BIDANG kosong atau hanya 'Tidak Ada' tidak mengirim ke siapa pun (bukan ke semua)", () => {
    assert.deepEqual(resolveAudience({ audience: "BIDANG", audienceBidang: [] }, users), []);
    assert.deepEqual(resolveAudience({ audience: "BIDANG", audienceBidang: null }, users), []);
    assert.deepEqual(resolveAudience({ audience: "BIDANG", audienceBidang: ["Tidak Ada"] }, users), []);
  });

  it("merangkum audiens untuk ditampilkan", () => {
    assert.equal(describeAudience({ audience: "SEMUA", audienceBidang: null }), "Semua anggota");
    assert.equal(describeAudience({ audience: "BIDANG", audienceBidang: ["Kaderisasi", "Litbang"] }), "Bidang: Kaderisasi, Litbang");
    assert.equal(describeAudience({ audience: "BIDANG", audienceBidang: [] }), "Belum ada bidang dipilih");
  });
});

describe("agenda — parser input form", () => {
  const valid = { title: "  Rapat Pleno  ", kind: "RAPAT", startDate: "2026-10-10", startTime: "19:00", endTime: "21:00", audience: "SEMUA" };

  it("mengubah tanggal+jam WIB menjadi timestamp UTC yang benar", () => {
    const r = parseAgendaInput(valid);
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.value.title, "Rapat Pleno");
    assert.equal(new Date(r.value.startAt).toISOString(), "2026-10-10T12:00:00.000Z");
    assert.equal(new Date(r.value.endAt as string).toISOString(), "2026-10-10T14:00:00.000Z");
  });

  it("menolak judul kosong dan tanggal tidak valid", () => {
    assert.equal(parseAgendaInput({ ...valid, title: "   " }).ok, false);
    assert.equal(parseAgendaInput({ ...valid, startDate: "10-10-2026" }).ok, false);
    assert.equal(parseAgendaInput({ ...valid, startDate: "" }).ok, false);
  });

  it("menolak tanggal yang mustahil, bukan menggulungnya diam-diam", () => {
    assert.equal(parseAgendaInput({ ...valid, startDate: "2026-02-30" }).ok, false);
    assert.equal(parseAgendaInput({ ...valid, startDate: "2026-04-31" }).ok, false);
    assert.equal(parseAgendaInput({ ...valid, startDate: "2028-02-29" }).ok, true);
    assert.equal(parseAgendaInput({ ...valid, startDate: "2026-02-29" }).ok, false);
  });

  it("mewajibkan jam mulai untuk agenda berjam, tapi tidak untuk sepanjang hari", () => {
    assert.equal(parseAgendaInput({ ...valid, startTime: "" }).ok, false);
    assert.equal(parseAgendaInput({ ...valid, startTime: "25:00" }).ok, false);
    assert.equal(parseAgendaInput({ ...valid, allDay: true, startTime: "", endTime: "" }).ok, true);
  });

  it("menolak waktu selesai sebelum waktu mulai", () => {
    assert.equal(parseAgendaInput({ ...valid, startTime: "19:00", endTime: "18:00" }).ok, false);
    // Tanggal selesai lebih akhir membuat jam yang lebih kecil sah (menginap / lintas hari).
    assert.equal(parseAgendaInput({ ...valid, startTime: "19:00", endDate: "2026-10-11", endTime: "08:00" }).ok, true);
  });

  it("menolak tanggal selesai tanpa jam selesai pada agenda berjam", () => {
    assert.equal(parseAgendaInput({ ...valid, endTime: "", endDate: "2026-10-11" }).ok, false);
  });

  it("agenda sepanjang hari: endAt di akhir hari, endDate opsional", () => {
    const withEnd = parseAgendaInput({ ...valid, allDay: true, endDate: "2026-10-12" });
    assert.equal(withEnd.ok, true);
    if (!withEnd.ok) return;
    assert.equal(withEnd.value.allDay, true);
    assert.equal(dateInJakarta(withEnd.value.endAt as string), "2026-10-12");

    const withoutEnd = parseAgendaInput({ ...valid, allDay: true, endDate: "" });
    assert.equal(withoutEnd.ok, true);
    if (!withoutEnd.ok) return;
    assert.equal(withoutEnd.value.endAt, null);
  });

  it("menolak enum yang tidak dikenal", () => {
    assert.equal(parseAgendaInput({ ...valid, kind: "RAHASIA" }).ok, false);
    // Audiens hanya dihitung kalau notifikasi menyala.
    assert.equal(parseAgendaInput({ ...valid, sendNotification: true, audience: "SEMUA-ORANG" }).ok, false);
  });

  it("audiens BIDANG wajib punya minimal satu bidang yang dikenal", () => {
    const on = { ...valid, sendNotification: true };
    assert.equal(parseAgendaInput({ ...on, audience: "BIDANG", audienceBidang: [] }).ok, false);
    assert.equal(parseAgendaInput({ ...on, audience: "BIDANG", audienceBidang: ["Bidang Palsu"] }).ok, false);
    assert.equal(parseAgendaInput({ ...on, audience: "BIDANG", audienceBidang: ["Tidak Ada"] }).ok, false);
  });

  it("menormalkan ejaan bidang ke bentuk baku dan membuang duplikat", () => {
    const r = parseAgendaInput({ ...valid, sendNotification: true, audience: "BIDANG", audienceBidang: ["kaderisasi", " KADERISASI ", "litbang", "Entah"] });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.deepEqual(r.value.audienceBidang, ["Kaderisasi", "Litbang"]);
  });

  it("audiens SEMUA mengosongkan audienceBidang walau klien mengirimnya", () => {
    const r = parseAgendaInput({ ...valid, audience: "SEMUA", audienceBidang: ["Kaderisasi"] });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.value.audienceBidang, null);
  });

  it("memotong teks panjang ke batasnya dan mengubah teks kosong jadi null", () => {
    const r = parseAgendaInput({ ...valid, description: "x".repeat(5000), location: "   ", internalNote: 123 });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.value.description?.length, 2000);
    assert.equal(r.value.location, null);
    assert.equal(r.value.internalNote, null);
  });

  it("membuat slug aman URL dari judul berbahasa Indonesia", () => {
    assert.equal(slugifyAgenda("Rapat Pleno: Pembahasan Proker 2026!"), "rapat-pleno-pembahasan-proker-2026");
    assert.equal(slugifyAgenda("  --Kajian & Isu--  "), "kajian-isu");
    assert.equal(slugifyAgenda("!!!"), "");
  });
});

describe("routing — agenda tinggal di domain sistem", () => {
  it("seluruh /agenda (kalender, detail, kelola) dianggap halaman sistem", () => {
    assert.equal(isAppPath("/agenda"), true);
    assert.equal(isAppPath("/agenda/rapat-pleno-abcde"), true);
    assert.equal(isAppPath("/agenda/kelola"), true);
    assert.equal(isAppPath("/agenda/kelola/apa-saja"), true);
  });

  it("tidak menarik path lain yang kebetulan berawalan 'agenda'", () => {
    assert.equal(isAppPath("/agenda-kegiatan-2026"), false);
    assert.equal(isAppPath("/agendakita"), false);
  });
});

describe("regresi — refactor lib/date.ts tidak mengubah perilaku kas", () => {
  it("todayInJakarta (via lib/kas maupun lib/date) tetap menghitung di WIB", () => {
    assert.equal(todayInJakarta(new Date("2026-10-09T18:00:00.000Z")), "2026-10-10");
  });

  it("currentPeriod tetap dihitung di WIB", () => {
    assert.equal(currentPeriod(new Date("2026-09-30T18:00:00.000Z")), "2026-10");
  });

  it("isKasMember tetap mengikuti aturan lama", () => {
    assert.equal(isKasMember({ email: "kader@gmail.com", role: "USER" }), true);
    // Role KONTRIBUTOR (akun sekretaris) memang tidak ditagih iuran — perilaku lama, bukan baru.
    assert.equal(isKasMember({ email: SECRETARY_EMAIL, role: "KONTRIBUTOR" }), false);
  });
});

describe("agenda — daftar Akan Datang menyertakan yang sedang berlangsung", () => {
  // Sekarang = 14.00 WIB, 10 Okt 2026.
  const now = new Date("2026-10-10T07:00:00.000Z");
  const at = (startAt: string, endAt: string | null = null, allDay = false) => ({ startAt, endAt, allDay });

  it("agenda yang sudah mulai hari ini tanpa jam selesai tetap tampil (kasus tangkapan layar)", () => {
    // Mulai 09.00 WIB, belum ada jam selesai: dianggap berlangsung sampai akhir hari.
    const ongoing = at("2026-10-10T02:00:00.000Z");
    assert.deepEqual(pickUpcoming([ongoing], now), [ongoing]);
  });

  it("agenda sepanjang hari hari ini tampil", () => {
    const allDay = at("2026-10-09T17:00:00.000Z", null, true); // 00.00 WIB tanggal 10
    assert.deepEqual(pickUpcoming([allDay], now), [allDay]);
  });

  it("agenda berjam yang sudah lewat jam selesainya TIDAK tampil", () => {
    const done = at("2026-10-10T01:00:00.000Z", "2026-10-10T03:00:00.000Z"); // 08.00-10.00 WIB
    assert.deepEqual(pickUpcoming([done], now), []);
  });

  it("agenda lintas hari yang mulai kemarin dan belum berakhir tampil", () => {
    const multiDay = at("2026-10-08T02:00:00.000Z", "2026-10-11T10:00:00.000Z");
    assert.deepEqual(pickUpcoming([multiDay], now), [multiDay]);
  });

  it("agenda kemarin tanpa jam selesai TIDAK tampil lagi", () => {
    assert.deepEqual(pickUpcoming([at("2026-10-09T02:00:00.000Z")], now), []);
  });

  it("urut terdekat dulu: yang berlangsung di depan yang akan datang", () => {
    const later = at("2026-10-12T02:00:00.000Z");
    const ongoing = at("2026-10-10T02:00:00.000Z");
    const soon = at("2026-10-10T12:00:00.000Z");
    assert.deepEqual(pickUpcoming([later, soon, ongoing], now), [ongoing, soon, later]);
  });

  it("dibatasi sesuai limit", () => {
    const items = [1, 2, 3, 4].map((day) => at(`2026-10-1${day}T02:00:00.000Z`));
    assert.equal(pickUpcoming(items, now, 2).length, 2);
  });
});

describe("agenda — toggle kirim notifikasi", () => {
  const valid = { title: "Rapat", kind: "RAPAT", startDate: "2026-10-10", startTime: "19:00", endTime: "21:00" };

  it("mati secara default: tanpa isian, agenda tidak memakai notifikasi", () => {
    const r = parseAgendaInput(valid);
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.value.sendNotification, false);
  });

  it("menyala hanya untuk nilai yang jelas (true / 'true' / 'on')", () => {
    for (const value of [true, "true", "on"]) {
      const r = parseAgendaInput({ ...valid, sendNotification: value });
      assert.equal(r.ok && r.value.sendNotification, true, String(value));
    }
    for (const value of [false, "false", "off", "", 0, null, undefined, "yes", 1]) {
      const r = parseAgendaInput({ ...valid, sendNotification: value });
      assert.equal(r.ok && r.value.sendNotification, false, String(value));
    }
  });

  it("notifikasi mati: pilihan audiens sisa di form diabaikan, tidak menggagalkan penyimpanan", () => {
    // Sekretaris sempat memilih 'Bidang tertentu' tanpa mencentang bidang, lalu mematikan toggle.
    const r = parseAgendaInput({ ...valid, sendNotification: false, audience: "BIDANG", audienceBidang: [] });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.value.audience, "SEMUA");
    assert.equal(r.value.audienceBidang, null);
  });

  it("notifikasi mati: audiens sampah pun tidak ditolak", () => {
    assert.equal(parseAgendaInput({ ...valid, sendNotification: false, audience: "ASAL" }).ok, true);
  });
});

describe("agenda — keputusan notifikasi setelah agenda diubah", () => {
  const base = {
    status: "PUBLISHED" as const,
    sendNotification: true,
    title: "Rapat Pleno",
    startAt: "2026-10-10T12:00:00.000Z",
    endAt: "2026-10-10T14:00:00.000Z",
    allDay: false,
    location: "Sekretariat",
    locationDetail: null as string | null,
  };

  it("draft tidak pernah memicu notifikasi", () => {
    assert.equal(decideUpdateNotification(base, { ...base, status: "DRAFT", location: "Aula" }), null);
  });

  it("notifikasi mati tidak memicu apa pun, walau jadwalnya berubah", () => {
    const off = { ...base, sendNotification: false };
    assert.equal(decideUpdateNotification(off, { ...off, startAt: "2026-10-11T12:00:00.000Z" }), null);
  });

  it("notifikasi baru DINYALAKAN pada agenda terbit = pengumuman pertama", () => {
    assert.equal(decideUpdateNotification({ ...base, sendNotification: false }, base), "CREATED");
  });

  it("notifikasi sudah menyala + jadwal/tempat/judul berubah = diperbarui", () => {
    assert.equal(decideUpdateNotification(base, { ...base, startAt: "2026-10-11T12:00:00.000Z" }), "UPDATED");
    assert.equal(decideUpdateNotification(base, { ...base, location: "Aula" }), "UPDATED");
    assert.equal(decideUpdateNotification(base, { ...base, title: "Rapat Pleno II" }), "UPDATED");
  });

  it("notifikasi sudah menyala tapi tidak ada perubahan berarti = tidak ada", () => {
    assert.equal(decideUpdateNotification(base, { ...base }), null);
  });

  it("notifikasi DIMATIKAN pada agenda yang sudah diumumkan tidak mengirim apa pun", () => {
    assert.equal(decideUpdateNotification(base, { ...base, sendNotification: false }), null);
  });
});
