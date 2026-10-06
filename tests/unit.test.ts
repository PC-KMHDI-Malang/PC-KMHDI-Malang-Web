import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isAdminPanelRole, canAccessAdminPath } from "@/lib/roles";
import { looksLikeHtml, stripHtml } from "@/lib/richText";
import { isProtectedAccountEmail } from "@/lib/protectedAccounts";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { formatBytes, extractBucketUrlsFromHtml, resolveStoredUrl } from "@/lib/storage";
import { formatViewCount } from "@/lib/views";
import { lockDurationFor, nextAttemptState, lockStateOf, emailKey, ipKey, clientIpFrom, type AttemptRecord } from "@/lib/loginRateLimit";
import { isPasswordLongEnough, MIN_PASSWORD_LENGTH, PASSWORD_RULE_TEXT } from "@/lib/password";
import { orFilterLiteral, containsPattern } from "@/lib/search";
import { isAppPath } from "@/lib/appHost";
import {
  isTreasurerEmail,
  isKasMember,
  isValidPeriod,
  isValidDate,
  periodsOfYear,
  periodRange,
  currentPeriod,
  todayInJakarta,
  monthStatus,
  arrearsPeriods,
  memberYearStatus,
  parseRupiahInput,
  parseYearParam,
  formatPeriod,
  paymentStatus,
  isSettled,
  addMonths,
  periodEnd,
  toKasSetting,
  memberSetting,
} from "@/lib/kas";

describe("roles — siapa boleh masuk panel admin", () => {
  it("menerima ADMIN dan KONTRIBUTOR saja", () => {
    assert.equal(isAdminPanelRole("ADMIN"), true);
    assert.equal(isAdminPanelRole("KONTRIBUTOR"), true);
    assert.equal(isAdminPanelRole("ANGGOTA"), false);
    assert.equal(isAdminPanelRole(null), false);
    assert.equal(isAdminPanelRole(undefined), false);
    assert.equal(isAdminPanelRole(""), false);
  });

  it("membandingkan role persis, bukan case-insensitive", () => {
    assert.equal(isAdminPanelRole("admin"), false);
  });

  it("memberi ADMIN akses ke semua path", () => {
    for (const p of ["/admin", "/admin/users", "/admin/statistics", "/admin/apa-saja"]) {
      assert.equal(canAccessAdminPath("ADMIN", p), true, p);
    }
  });

  it("membatasi KONTRIBUTOR ke beranda admin, artikel, dan e-book", () => {
    assert.equal(canAccessAdminPath("KONTRIBUTOR", "/admin"), true);
    assert.equal(canAccessAdminPath("KONTRIBUTOR", "/admin/news"), true);
    assert.equal(canAccessAdminPath("KONTRIBUTOR", "/admin/news/abc"), true);
    assert.equal(canAccessAdminPath("KONTRIBUTOR", "/admin/ebooks"), true);

    assert.equal(canAccessAdminPath("KONTRIBUTOR", "/admin/users"), false);
    assert.equal(canAccessAdminPath("KONTRIBUTOR", "/admin/statistics"), false);
    assert.equal(canAccessAdminPath("KONTRIBUTOR", "/admin/pengurus"), false);
    assert.equal(canAccessAdminPath("KONTRIBUTOR", "/admin/mitra"), false);
    assert.equal(canAccessAdminPath("KONTRIBUTOR", "/admin/gallery"), false);
    assert.equal(canAccessAdminPath("KONTRIBUTOR", "/admin/profile"), false);
  });

  it("menolak role tak dikenal di path mana pun", () => {
    assert.equal(canAccessAdminPath("ANGGOTA", "/admin"), false);
    assert.equal(canAccessAdminPath(null, "/admin"), false);
  });
});

describe("richText — konten artikel lama (teks polos) vs baru (HTML)", () => {
  it("mengenali HTML dan teks polos", () => {
    assert.equal(looksLikeHtml("<p>halo</p>"), true);
    assert.equal(looksLikeHtml("Halo\nbaris kedua"), false);
    assert.equal(looksLikeHtml("2 < 3 dan 5 > 4"), false);
  });

  it("membuang tag beserta isi <script>/<style>", () => {
    assert.equal(stripHtml("<p>Halo <strong>dunia</strong></p>"), "Halo dunia");
    assert.equal(stripHtml("<style>p{color:red}</style><p>Isi</p>"), "Isi");
    assert.equal(stripHtml("<script>alert(1)</script>Aman"), "Aman");
  });

  it("mengembalikan string kosong untuk nilai kosong", () => {
    assert.equal(stripHtml(null), "");
    assert.equal(stripHtml(undefined), "");
    assert.equal(stripHtml(""), "");
  });

  it("men-decode entitas HTML yang umum dan merapikan spasi", () => {
    assert.equal(stripHtml("<p>a&nbsp;&amp;&nbsp;b</p>"), "a & b");
    assert.equal(stripHtml("<p>&lt;tag&gt; &quot;kutip&quot; &#39;apostrof&#39;</p>"), "<tag> \"kutip\" 'apostrof'");
    assert.equal(stripHtml("<p>  banyak   spasi  </p>"), "banyak spasi");
  });
});

describe("protectedAccounts — akun bersama", () => {
  it("mengenali akun bersama apa pun kapitalisasi dan spasinya", () => {
    assert.equal(isProtectedAccountEmail("pcmalang@kmhdi.info"), true);
    assert.equal(isProtectedAccountEmail("  PCMalang@KMHDI.info  "), true);
  });

  it("tidak menandai akun biasa atau nilai kosong", () => {
    assert.equal(isProtectedAccountEmail("admin@kmhdimalang.org"), false);
    assert.equal(isProtectedAccountEmail(null), false);
    assert.equal(isProtectedAccountEmail(undefined), false);
    assert.equal(isProtectedAccountEmail(""), false);
  });
});

describe("site — URL absolut", () => {
  it("tidak menyisakan garis miring ganda", () => {
    assert.equal(absoluteUrl("/berita"), `${siteConfig.url}/berita`);
    assert.equal(absoluteUrl("berita"), `${siteConfig.url}/berita`);
    assert.equal(absoluteUrl(), `${siteConfig.url}/`);
  });

  it("tidak menyimpan trailing slash pada origin", () => {
    assert.ok(!siteConfig.url.endsWith("/"));
  });
});

describe("storage — format ukuran & pelacakan gambar sisipan artikel", () => {
  it("memformat byte ke satuan yang terbaca", () => {
    assert.equal(formatBytes(0), "0 B");
    assert.equal(formatBytes(-5), "0 B");
    assert.equal(formatBytes(512), "512 B");
    assert.equal(formatBytes(1024), "1.0 KB");
    assert.equal(formatBytes(1536), "1.5 KB");
    assert.equal(formatBytes(1024 * 1024), "1.0 MB");
    assert.equal(formatBytes(1024 * 1024 * 1024), "1.0 GB");
  });

  it("tidak melampaui GB untuk angka sangat besar", () => {
    assert.ok(formatBytes(5 * 1024 ** 4).endsWith(" GB"));
  });

  it("hanya mengambil <img> dari bucket yang diminta", () => {
    const html = [
      '<p>teks</p>',
      '<img src="https://x.supabase.co/storage/v1/object/public/article-images/a.png" />',
      '<img src="https://x.supabase.co/storage/v1/object/public/news-covers/b.png" />',
      '<img src="https://contoh.com/luar.png" />',
    ].join("");

    assert.deepEqual(extractBucketUrlsFromHtml("article-images", html), ["https://x.supabase.co/storage/v1/object/public/article-images/a.png"]);
    assert.deepEqual(extractBucketUrlsFromHtml("news-covers", html), ["https://x.supabase.co/storage/v1/object/public/news-covers/b.png"]);
    assert.deepEqual(extractBucketUrlsFromHtml("gallery-photos", html), []);
  });

  it("aman untuk konten kosong atau tanpa gambar", () => {
    assert.deepEqual(extractBucketUrlsFromHtml("article-images", null), []);
    assert.deepEqual(extractBucketUrlsFromHtml("article-images", ""), []);
    assert.deepEqual(extractBucketUrlsFromHtml("article-images", "<p>tanpa gambar</p>"), []);
  });
});

describe("views — format hitungan dilihat", () => {
  it("memakai pemisah ribuan Indonesia", () => {
    assert.equal(formatViewCount(0), "0");
    assert.equal(formatViewCount(999), "999");
    assert.equal(formatViewCount(1234), "1.234");
    assert.equal(formatViewCount(1234567), "1.234.567");
  });
});

describe("pembatas percobaan login — tangga penguncian", () => {
  it("tidak mengunci pengguna yang salah ketik beberapa kali", () => {
    for (const n of [0, 1, 2, 3, 4]) {
      assert.equal(lockDurationFor(n), null, `${n} kegagalan seharusnya belum mengunci`);
    }
  });

  it("mengunci makin lama seiring bertambahnya kegagalan", () => {
    assert.equal(lockDurationFor(5), 60_000);
    assert.equal(lockDurationFor(7), 60_000);
    assert.equal(lockDurationFor(8), 5 * 60_000);
    assert.equal(lockDurationFor(9), 5 * 60_000);
    assert.equal(lockDurationFor(10), 15 * 60_000);
    assert.equal(lockDurationFor(500), 15 * 60_000);
  });

  it("tidak pernah mengunci lebih lama dari 15 menit, agar tidak bisa dipakai mengunci akun orang", () => {
    for (const n of [5, 10, 50, 1000]) {
      assert.ok((lockDurationFor(n) ?? 0) <= 15 * 60_000);
    }
  });
});

describe("pembatas percobaan login — perilaku penuh", () => {
  const T0 = Date.parse("2026-01-01T12:00:00.000Z");
  const MINUTE = 60_000;

  // Menirukan rangkaian percobaan gagal beruntun, seperti serangan tebak-tebakan.
  const failNTimes = (n: number, startAt = T0, stepMs = 1000) => {
    let rec: AttemptRecord | null = null;
    for (let i = 0; i < n; i++) rec = nextAttemptState(rec, startAt + i * stepMs);
    return rec as AttemptRecord;
  };

  it("empat kali salah ketik belum mengunci sama sekali", () => {
    const rec = failNTimes(4);
    assert.equal(rec.failedCount, 4);
    assert.equal(rec.lockedUntil, null);
    assert.equal(lockStateOf([rec], T0 + 4000).locked, false);
  });

  it("kegagalan kelima mulai mengunci selama satu menit", () => {
    const rec = failNTimes(5);
    assert.equal(rec.failedCount, 5);
    const state = lockStateOf([rec], T0 + 5000);
    assert.equal(state.locked, true);
    assert.ok(state.retryAfterSeconds > 0 && state.retryAfterSeconds <= 60);
  });

  it("kunci terbuka sendiri setelah masanya lewat", () => {
    const rec = failNTimes(5);
    assert.equal(lockStateOf([rec], T0 + 2 * MINUTE).locked, false);
  });

  it("kunci memanjang seiring serangan berlanjut", () => {
    const after8 = lockStateOf([failNTimes(8)], T0 + 8000).retryAfterSeconds;
    const after10 = lockStateOf([failNTimes(10)], T0 + 10000).retryAfterSeconds;
    assert.ok(after8 > 60, `8 kegagalan harus mengunci lebih dari 1 menit, dapat ${after8}s`);
    assert.ok(after10 > after8, "10 kegagalan harus mengunci lebih lama daripada 8");
  });

  it("hitungan jatuh kembali ke nol setelah jendela 15 menit terlewat", () => {
    const old = failNTimes(4);
    // Percobaan berikutnya jauh setelah jendela: dihitung sebagai kegagalan pertama lagi.
    const fresh = nextAttemptState(old, T0 + 16 * MINUTE);
    assert.equal(fresh.failedCount, 1);
    assert.equal(fresh.lockedUntil, null);
  });

  it("kegagalan beruntun di dalam jendela tetap terakumulasi meski berjarak", () => {
    // Lima kegagalan berjarak 2 menit — masih di dalam jendela 15 menit sejak yang pertama.
    const rec = failNTimes(5, T0, 2 * MINUTE);
    assert.equal(rec.failedCount, 5);
    assert.notEqual(rec.lockedUntil, null);
  });

  it("terkunci kalau salah satu saja dari penghitung email/IP sedang terkunci", () => {
    const emailRec = { lockedUntil: null };
    const ipRec = failNTimes(10);
    assert.equal(lockStateOf([emailRec, ipRec], T0 + 10000).locked, true);
  });

  it("tidak terkunci kalau tidak ada catatan sama sekali", () => {
    assert.equal(lockStateOf([], T0).locked, false);
    assert.equal(lockStateOf([{ lockedUntil: null }], T0).locked, false);
  });
});

describe("pembatas percobaan login — kunci penghitung", () => {
  it("menyamakan email tanpa peduli kapitalisasi dan spasi", () => {
    assert.equal(emailKey("  Admin@KMHDImalang.org "), emailKey("admin@kmhdimalang.org"));
    assert.equal(emailKey("a@b.c"), "email:a@b.c");
  });

  it("memisahkan penghitung email dan IP", () => {
    assert.notEqual(emailKey("a@b.c"), ipKey("a@b.c"));
    assert.equal(ipKey("1.2.3.4"), "ip:1.2.3.4");
  });

  it("mengambil IP asli dari rantai proxy", () => {
    assert.equal(clientIpFrom(new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" })), "203.0.113.9");
    assert.equal(clientIpFrom(new Headers({ "x-real-ip": "203.0.113.9" })), "203.0.113.9");
    assert.equal(clientIpFrom(new Headers()), null);
  });
});

describe("aturan panjang password", () => {
  it("menolak password pendek dan menerima yang cukup panjang", () => {
    assert.equal(isPasswordLongEnough("pendek"), false);
    assert.equal(isPasswordLongEnough("123456789"), false);
    assert.equal(isPasswordLongEnough("1234567890"), true);
  });

  it("tidak menghitung spasi di ujung sebagai panjang", () => {
    assert.equal(isPasswordLongEnough("   abc    "), false);
  });

  it("pesan aturannya menyebut angka yang sama dengan pemeriksaannya", () => {
    assert.match(PASSWORD_RULE_TEXT, new RegExp(String(MIN_PASSWORD_LENGTH)));
  });
});

describe("escaping filter pencarian PostgREST", () => {
  it("membungkus nilai sebagai literal berkutip", () => {
    assert.equal(orFilterLiteral("budi"), '"budi"');
    assert.equal(containsPattern("budi"), '"%budi%"');
  });

  it("menetralkan karakter yang bisa merusak struktur filter .or()", () => {
    // Tanpa ini, "a),role.eq.ADMIN" ikut terbaca sebagai bagian dari filter.
    assert.equal(containsPattern("a),role.eq.ADMIN"), '"%a),role.eq.ADMIN%"');
    assert.equal(containsPattern("a,b"), '"%a,b%"');
  });

  it("meng-escape kutip ganda dan backslash", () => {
    assert.equal(orFilterLiteral('sa"b'), '"sa\\"b"');
    assert.equal(orFilterLiteral("a\\b"), '"a\\\\b"');
    assert.equal(orFilterLiteral('\\"'), '"\\\\\\""');
  });
});

describe("kas — siapa bendahara & siapa anggota", () => {
  it("mengenali email bendahara tanpa peduli huruf besar/spasi", () => {
    assert.equal(isTreasurerEmail("bendahara@kmhdimalang.org"), true);
    assert.equal(isTreasurerEmail("  Bendahara@KMHDIMalang.org "), true);
    assert.equal(isTreasurerEmail("admin@kmhdimalang.org"), false);
    assert.equal(isTreasurerEmail("bendahara@kmhdimalang.org.evil.com"), false);
    assert.equal(isTreasurerEmail(null), false);
    assert.equal(isTreasurerEmail(""), false);
  });

  it("hanya memasukkan akun ber-role USER ke daftar anggota kas", () => {
    assert.equal(isKasMember({ email: "kader@gmail.com", role: "USER" }), true);
    assert.equal(isKasMember({ email: "kader@gmail.com", role: "ADMIN" }), false);
    assert.equal(isKasMember({ email: "kader@gmail.com", role: "KONTRIBUTOR" }), false);
    assert.equal(isKasMember({ email: "kader@gmail.com", role: null }), false);
  });

  it("mengecualikan akun bendahara dan akun bersama walau role-nya USER", () => {
    assert.equal(isKasMember({ email: "bendahara@kmhdimalang.org", role: "USER" }), false);
    assert.equal(isKasMember({ email: "pcmalang@kmhdi.info", role: "USER" }), false);
    assert.equal(isKasMember({ email: null, role: "USER" }), false);
  });
});

describe("kas — periode & tanggal", () => {
  it("memvalidasi format periode YYYY-MM", () => {
    assert.equal(isValidPeriod("2026-01"), true);
    assert.equal(isValidPeriod("2026-12"), true);
    assert.equal(isValidPeriod("2026-13"), false);
    assert.equal(isValidPeriod("2026-00"), false);
    assert.equal(isValidPeriod("2026-1"), false);
    assert.equal(isValidPeriod(202601), false);
  });

  it("memvalidasi tanggal YYYY-MM-DD", () => {
    assert.equal(isValidDate("2026-02-28"), true);
    assert.equal(isValidDate("2026-02-30x"), false);
    assert.equal(isValidDate("26-02-28"), false);
  });

  it("menghasilkan 12 periode per tahun dan rentang lintas tahun", () => {
    assert.deepEqual(periodsOfYear(2026).slice(0, 2), ["2026-01", "2026-02"]);
    assert.equal(periodsOfYear(2026).length, 12);
    assert.deepEqual(periodRange("2025-11", "2026-02"), ["2025-11", "2025-12", "2026-01", "2026-02"]);
    assert.deepEqual(periodRange("2026-03", "2026-01"), []);
  });

  it("memakai zona waktu WIB untuk bulan berjalan", () => {
    // 31 Jan 2026 pukul 20.00 UTC = 1 Feb 2026 pukul 03.00 WIB.
    const now = new Date("2026-01-31T20:00:00Z");
    assert.equal(todayInJakarta(now), "2026-02-01");
    assert.equal(currentPeriod(now), "2026-02");
  });

  it("menampilkan nama bulan Indonesia", () => {
    assert.equal(formatPeriod("2026-08"), "Agustus 2026");
  });
});

describe("kas — status iuran & tunggakan", () => {
  const setting = { monthlyFee: 10000, startPeriod: "2026-03" };

  it("menentukan status per bulan", () => {
    assert.equal(monthStatus("2026-02", false, setting, "2026-06"), "TIDAK_BERLAKU");
    assert.equal(monthStatus("2026-04", false, setting, "2026-06"), "BELUM");
    assert.equal(monthStatus("2026-06", false, setting, "2026-06"), "BELUM");
    assert.equal(monthStatus("2026-07", false, setting, "2026-06"), "MENDATANG");
    assert.equal(monthStatus("2026-07", true, setting, "2026-06"), "LUNAS");
    assert.equal(monthStatus("2026-04", false, { monthlyFee: 0, startPeriod: null }, "2026-06"), "TIDAK_BERLAKU");
  });

  it("menghitung tunggakan sejak iuran berlaku sampai bulan berjalan", () => {
    assert.deepEqual(arrearsPeriods(["2026-03", "2026-05"], setting, "2026-06"), ["2026-04", "2026-06"]);
    assert.deepEqual(arrearsPeriods([], { monthlyFee: 10000, startPeriod: null }, "2026-06"), []);
  });

  it("menghitung tunggakan tahun lalu walau sedang melihat tahun ini", () => {
    const sejakTahunLalu = { monthlyFee: 10000, startPeriod: "2025-01" };
    const payments = [{ id: "a", period: "2025-01", amount: 10000, paidAt: "2025-01-05" }];
    const s = memberYearStatus(payments, 2026, sejakTahunLalu, "2026-10");
    // 2025: 11 bulan belum dibayar (Feb–Des), 2026: Jan–Okt = 10 bulan.
    assert.equal(s.arrearsCount, 21);
    assert.equal(s.arrearsAmount, 210000);
    assert.equal(memberYearStatus(payments, 2025, sejakTahunLalu, "2026-10").months[1].status, "BELUM");
  });

  it("merangkum satu tahun memakai nominal yang benar-benar dibayar", () => {
    const payments = [
      { id: "a", period: "2026-03", amount: 10000, paidAt: "2026-03-05" },
      { id: "b", period: "2026-04", amount: 15000, paidAt: "2026-04-05" },
      { id: "c", period: "2025-12", amount: 5000, paidAt: "2025-12-05" },
    ];
    const s = memberYearStatus(payments, 2026, setting, "2026-06");
    assert.equal(s.yearPaid, 25000);
    assert.equal(s.totalPaid, 30000);
    assert.equal(s.arrearsCount, 2); // Mei & Juni
    assert.equal(s.arrearsAmount, 20000);
    assert.equal(s.months[2].status, "LUNAS");
    assert.equal(s.months[0].status, "TIDAK_BERLAKU");
    assert.equal(s.months[11].status, "MENDATANG");
  });
});

describe("kas — input", () => {
  it("membaca nominal rupiah dari berbagai format", () => {
    assert.equal(parseRupiahInput("10.000"), 10000);
    assert.equal(parseRupiahInput("Rp 25.500"), 25500);
    assert.equal(parseRupiahInput(5000), 5000);
    assert.equal(parseRupiahInput("0"), null);
    assert.equal(parseRupiahInput("abc"), null);
    assert.equal(parseRupiahInput(undefined), null);
  });

  it("membatasi parameter ?tahun= ke rentang wajar", () => {
    assert.equal(parseYearParam("2025", 2026), 2025);
    assert.equal(parseYearParam("99999", 2026), 2026);
    assert.equal(parseYearParam("abc", 2026), 2026);
    assert.equal(parseYearParam(undefined, 2026), 2026);
  });
});

describe("storage — mengenali file Supabase lama dan R2 baru", () => {
  const R2 = "https://media.kmhdimalang.org";
  const supa = "https://abc.supabase.co/storage/v1/object/public/news-covers/a1.webp";

  it("mengenali URL Supabase lama", () => {
    assert.deepEqual(resolveStoredUrl("news-covers", supa, R2), { provider: "supabase", path: "a1.webp" });
  });

  it("mengenali URL R2 publik dengan key berawalan nama bucket", () => {
    assert.deepEqual(resolveStoredUrl("news-covers", `${R2}/news-covers/b2.webp`, R2), { provider: "r2-public", key: "news-covers/b2.webp" });
  });

  it("mengenali PDF di R2 privat", () => {
    assert.deepEqual(resolveStoredUrl("ebook-files", "r2-private://ebook-files/c3.pdf", R2), { provider: "r2-private", key: "ebook-files/c3.pdf" });
  });

  it("menolak URL bucket lain, host lain, atau tanpa nama file", () => {
    assert.equal(resolveStoredUrl("gallery-photos", supa, R2), null);
    assert.equal(resolveStoredUrl("news-covers", `${R2}/gallery-photos/x.webp`, R2), null);
    assert.equal(resolveStoredUrl("news-covers", "https://evil.com/news-covers/x.webp", R2), null);
    assert.equal(resolveStoredUrl("news-covers", `${R2}/news-covers/`, R2), null);
    assert.equal(resolveStoredUrl("news-covers", `${R2}/news-covers/x.webp`, ""), null);
  });

  it("menemukan gambar artikel dari Supabase maupun R2 di dalam HTML", () => {
    const html = `<p><img src="https://abc.supabase.co/storage/v1/object/public/article-images/old.png"><img src="${R2}/article-images/new.png"><img src="https://imgur.com/x.png"></p>`;
    assert.deepEqual(extractBucketUrlsFromHtml("article-images", html, R2), [
      "https://abc.supabase.co/storage/v1/object/public/article-images/old.png",
      `${R2}/article-images/new.png`,
    ]);
  });
});

describe("kas — bukti pembayaran & konfirmasi bendahara", () => {
  const setting = { monthlyFee: 10000, startPeriod: "2026-01" };

  it("membaca status baris iuran (data lama tanpa status dianggap lunas)", () => {
    assert.equal(paymentStatus(null), null);
    assert.equal(paymentStatus({}), "LUNAS");
    assert.equal(paymentStatus({ status: "MENUNGGU" }), "MENUNGGU");
    assert.equal(isSettled("LUNAS"), true);
    assert.equal(isSettled("MENUNGGU"), true);
    assert.equal(isSettled("DITOLAK"), false);
    assert.equal(isSettled(null), false);
  });

  it("menampilkan status per bulan sesuai status buktinya", () => {
    assert.equal(monthStatus("2026-02", "MENUNGGU", setting, "2026-06"), "MENUNGGU");
    assert.equal(monthStatus("2026-02", "LUNAS", setting, "2026-06"), "LUNAS");
    // Bukti ditolak: kembali jadi belum bayar (atau mendatang kalau bulannya belum tiba).
    assert.equal(monthStatus("2026-02", "DITOLAK", setting, "2026-06"), "BELUM");
    assert.equal(monthStatus("2026-09", "DITOLAK", setting, "2026-06"), "MENDATANG");
  });

  it("hanya menghitung yang sudah dikonfirmasi sebagai uang masuk", () => {
    const payments = [
      { id: "a", period: "2026-01", amount: 10000, paidAt: "2026-01-05", status: "LUNAS" as const },
      { id: "b", period: "2026-02", amount: 10000, paidAt: "2026-02-05", status: "MENUNGGU" as const },
      { id: "c", period: "2026-03", amount: 10000, paidAt: "2026-03-05", status: "DITOLAK" as const },
    ];
    const s = memberYearStatus(payments, 2026, setting, "2026-04");
    assert.equal(s.yearPaid, 10000);
    assert.equal(s.totalPaid, 10000);
    assert.equal(s.pendingCount, 1);
    // Tunggakan: Maret (ditolak) & April (belum ada) — Februari menunggu konfirmasi, bukan tunggakan.
    assert.equal(s.arrearsCount, 2);
    assert.equal(s.months[1].status, "MENUNGGU");
    assert.equal(s.months[2].status, "BELUM");
  });
});

describe("kas — periode kepengurusan 2 tahun", () => {
  const setting = { monthlyFee: 10000, startPeriod: "2025-06" };

  it("menghitung bulan lintas tahun", () => {
    assert.equal(addMonths("2025-06", 24), "2027-06");
    assert.equal(addMonths("2025-11", 3), "2026-02");
    assert.equal(addMonths("2026-01", -1), "2025-12");
  });

  it("periode Juni 2025 berlaku sampai Juni 2027", () => {
    assert.equal(periodEnd(setting), "2027-06");
    assert.equal(periodEnd({ monthlyFee: 0, startPeriod: null }), null);
  });

  it("bulan setelah akhir periode tidak berlaku", () => {
    assert.equal(monthStatus("2027-06", false, setting, "2026-10"), "MENDATANG");
    assert.equal(monthStatus("2027-07", false, setting, "2026-10"), "TIDAK_BERLAKU");
  });

  it("tunggakan tidak dihitung melewati akhir periode", () => {
    // Bulan berjalan sudah lewat periode: tunggakan berhenti di Juni 2027 (25 bulan).
    assert.equal(arrearsPeriods([], setting, "2028-01").length, 25);
    assert.equal(arrearsPeriods([], setting, "2025-08").length, 3);
  });
});

describe("kas — akhir periode diatur bendahara", () => {
  it("memakai akhir periode yang diatur, atau default 2 tahun kalau kosong", () => {
    assert.equal(periodEnd({ monthlyFee: 10000, startPeriod: "2025-06", endPeriod: "2027-05" }), "2027-05");
    assert.equal(periodEnd({ monthlyFee: 10000, startPeriod: "2025-06", endPeriod: null }), "2027-06");
    // Akhir sebelum awal dianggap tidak valid → default.
    assert.equal(periodEnd({ monthlyFee: 10000, startPeriod: "2025-06", endPeriod: "2024-01" }), "2027-06");
  });

  it("bulan setelah akhir periode yang diatur tidak berlaku", () => {
    const setting = { monthlyFee: 10000, startPeriod: "2025-06", endPeriod: "2026-12" };
    assert.equal(monthStatus("2026-12", false, setting, "2026-10"), "MENDATANG");
    assert.equal(monthStatus("2027-01", false, setting, "2026-10"), "TIDAK_BERLAKU");
  });

  it("membaca baris pengaturan dari database dengan aman (kolom baru boleh belum ada)", () => {
    const a = toKasSetting({ monthlyFee: 10000, startPeriod: "2025-07" });
    assert.deepEqual([a.monthlyFee, a.startPeriod, a.endPeriod], [10000, "2025-07", null]);
    assert.equal(toKasSetting({ monthlyFee: 10000, startPeriod: "2025-07", endPeriod: "2027-06" }).endPeriod, "2027-06");
    const empty = toKasSetting(null);
    assert.deepEqual([empty.monthlyFee, empty.startPeriod, empty.endPeriod], [0, null, null]);
  });
});

describe("kas — anggota masuk/keluar di tengah periode", () => {
  const setting = { monthlyFee: 10000, startPeriod: "2025-06", endPeriod: "2027-06" };

  it("tanpa periode khusus, anggota ikut periode umum", () => {
    assert.deepEqual(memberSetting(setting, null), { monthlyFee: 10000, startPeriod: "2025-06", endPeriod: "2027-06" });
  });

  it("anggota yang masuk Maret 2026 baru ditagih sejak Maret 2026", () => {
    const own = memberSetting(setting, { startPeriod: "2026-03", endPeriod: null });
    assert.equal(monthStatus("2026-02", false, own, "2026-10"), "TIDAK_BERLAKU");
    assert.equal(monthStatus("2026-03", false, own, "2026-10"), "BELUM");
    // Tunggakan Mar–Okt 2026 = 8 bulan, bukan sejak Juni 2025.
    assert.equal(arrearsPeriods([], own, "2026-10").length, 8);
  });

  it("anggota yang berhenti Desember 2025 tidak ditagih sesudahnya", () => {
    const own = memberSetting(setting, { startPeriod: null, endPeriod: "2025-12" });
    assert.equal(monthStatus("2026-01", false, own, "2026-10"), "TIDAK_BERLAKU");
    assert.equal(arrearsPeriods([], own, "2026-10").length, 7); // Jun–Des 2025
  });

  it("periode khusus tidak bisa melebar keluar periode umum", () => {
    const own = memberSetting(setting, { startPeriod: "2024-01", endPeriod: "2030-01" });
    assert.equal(own.startPeriod, "2025-06");
    assert.equal(own.endPeriod, "2027-06");
  });

  it("berhenti sebelum periode dimulai = tidak ada bulan yang ditagih", () => {
    const own = memberSetting(setting, { startPeriod: null, endPeriod: "2025-01" });
    assert.equal(own.startPeriod, null);
    assert.equal(arrearsPeriods([], own, "2026-10").length, 0);
  });
});

describe("domain — halaman sistem (apps.kmhdimalang.org)", () => {
  it("mengenali halaman sistem", () => {
    for (const p of ["/admin", "/admin/news/abc", "/kas", "/kas/kelola", "/kas/bukti/123", "/login", "/profile", "/informasi-akun"]) {
      assert.equal(isAppPath(p), true, p);
    }
  });

  it("halaman publik & API tetap di domain utama / bisa dari dua domain", () => {
    for (const p of ["/", "/berita", "/e-book", "/e-book/file/buku-x", "/galeri", "/mitra", "/profil", "/program", "/api/auth/session", "/kasus-artikel", "/administrasi-kegiatan", "/loginx"]) {
      assert.equal(isAppPath(p), false, p);
    }
  });
});

describe("kas — metode pembayaran (rekening & QRIS)", () => {
  it("membaca daftar rekening (bisa lebih dari satu), membuang yang tanpa nomor", () => {
    const setting = toKasSetting({
      bankAccounts: [
        { bank: "SeaBank", number: "901643108142", holder: "Ni Luh Putu Kayla Padma Dewi" },
        { bank: "BRI", number: "1234 5678 90", holder: "Bendahara" },
        { bank: "Kosong", number: "", holder: "x" },
      ],
      qrisUrl: "https://media.kmhdimalang.org/kas-qris/a.png",
    });
    assert.equal(setting.banks?.length, 2);
    assert.equal(setting.banks?.[1].bank, "BRI");
    assert.equal(setting.qrisUrl, "https://media.kmhdimalang.org/kas-qris/a.png");
  });

  it("daftar rekening kosong = tidak ada rekening", () => {
    assert.deepEqual(toKasSetting({ bankAccounts: [], qrisUrl: null }).banks, []);
  });

  it("belum migrasi 031: memakai rekening tunggal migrasi 030, atau rekening bawaan", () => {
    assert.deepEqual(toKasSetting({ bankName: "BRI", bankAccountNumber: "123456", bankAccountHolder: "A" }).banks, [{ bank: "BRI", number: "123456", holder: "A" }]);
    assert.equal(toKasSetting({ monthlyFee: 10000 }).banks?.[0].bank, "SeaBank");
  });

  it("membaca logo bank yang diunggah bendahara (opsional)", () => {
    const setting = toKasSetting({
      bankAccounts: [
        { bank: "SeaBank", number: "901643108142", holder: "A", logoUrl: "https://media.kmhdimalang.org/kas-logos/x.png" },
        { bank: "BRI", number: "123456", holder: "B" },
      ],
    });
    assert.equal(setting.banks?.[0].logoUrl, "https://media.kmhdimalang.org/kas-logos/x.png");
    assert.equal(setting.banks?.[1].logoUrl, null);
  });
});
