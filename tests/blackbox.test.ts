import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it, before } from "node:test";

// Uji kotak-hitam: hanya lewat HTTP, tanpa mengimpor kode aplikasi. Butuh server yang sudah
// jalan (`npm run build && npm run start`); alamatnya lewat BASE_URL, default localhost:3000.
const BASE = process.env.BASE_URL || "http://localhost:3000";

// Jangan pernah ikut redirect: statusnya sendiri yang sedang diuji.
function get(path: string, init?: RequestInit) {
  return fetch(`${BASE}${path}`, { redirect: "manual", ...init });
}

before(async () => {
  const res = await get("/api/test").catch(() => null);
  assert.ok(res, `Server tidak merespons di ${BASE}. Jalankan "npm run build && npm run start" dulu.`);
});

describe("halaman publik dapat diakses tanpa login", () => {
  const paths = ["/", "/berita", "/e-book", "/galeri", "/mitra", "/profil", "/program", "/login"];

  for (const path of paths) {
    it(`GET ${path} → 200`, async () => {
      const res = await get(path);
      assert.equal(res.status, 200);
      assert.match(res.headers.get("content-type") || "", /text\/html/);
    });
  }
});

describe("berkas metadata situs", () => {
  it("GET /robots.txt menyebut sitemap", async () => {
    const res = await get("/robots.txt");
    assert.equal(res.status, 200);
    assert.match(await res.text(), /Sitemap:/i);
  });

  it("GET /sitemap.xml mengembalikan XML", async () => {
    const res = await get("/sitemap.xml");
    assert.equal(res.status, 200);
    assert.match(await res.text(), /<urlset/);
  });

  it("GET /manifest.webmanifest mengembalikan JSON", async () => {
    const res = await get("/manifest.webmanifest");
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.name);
  });
});

describe("paginasi daftar berita", () => {
  // Sebelumnya /berita mengambil SELURUH artikel terbit dalam satu query tiap request.
  for (const path of ["/berita?page=2", "/berita?page=999", "/berita?page=abc", "/berita?page=-3", "/berita?page=1&sort=oldest"]) {
    it(`GET ${path} → 200`, async () => {
      const res = await get(path);
      assert.equal(res.status, 200);
    });
  }

  it("nomor halaman di luar jangkauan tetap memberi jalan kembali", async () => {
    const res = await get("/berita?page=999");
    assert.match(await res.text(), /Kembali ke Halaman Pertama/);
  });

  it("halaman pertama tidak memuat penanda halaman di URL kanoniknya", async () => {
    const res = await get("/berita");
    assert.match(await res.text(), /rel="canonical" href="[^"]*\/berita"/);
  });
});

describe("slug artikel yang tidak ada", () => {
  it("mengembalikan 404, bukan 500", async () => {
    const res = await get("/slug-yang-pasti-tidak-ada-123456");
    assert.equal(res.status, 404);
  });
});

describe("halaman terproteksi mengalihkan tamu ke login", () => {
  for (const path of ["/admin", "/admin/users", "/admin/news", "/admin/ebooks", "/profile"]) {
    it(`GET ${path} → redirect ke /login`, async () => {
      const res = await get(path);
      assert.ok([302, 307].includes(res.status), `status ${res.status}`);
      assert.match(res.headers.get("location") || "", /\/login/);
    });
  }
});

describe("endpoint API", () => {
  it("GET /api/setup-buckets ditolak untuk tamu", async () => {
    const res = await get("/api/setup-buckets");
    assert.equal(res.status, 403);
    assert.deepEqual(await res.json(), { error: "Forbidden" });
  });

  it("GET berkas PDF e-book mengalihkan tamu ke login", async () => {
    const res = await get("/api/ebook/00000000-0000-0000-0000-000000000000/file/x.pdf");
    assert.ok([302, 307].includes(res.status), `status ${res.status}`);
    assert.match(res.headers.get("location") || "", /\/login/);
  });
});

describe("login menolak kredensial salah", () => {
  it("POST /api/auth/callback/credentials tidak menerbitkan cookie sesi", async () => {
    const csrfRes = await get("/api/auth/csrf");
    const { csrfToken } = await csrfRes.json();

    const res = await get("/api/auth/callback/credentials", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie: csrfRes.headers.getSetCookie().map((c) => c.split(";")[0]).join("; "),
      },
      body: new URLSearchParams({ csrfToken, email: "bukan-user@contoh.invalid", password: "password-salah" }),
    });

    const sessionCookie = res.headers.getSetCookie().find((c) => /authjs\.session-token|next-auth\.session-token/.test(c));
    assert.equal(sessionCookie, undefined, "kredensial salah tidak boleh menghasilkan cookie sesi");
  });
});

describe("Server Action menolak pemanggil tanpa sesi", () => {
  // Middleware cuma menjaga URL halaman, bukan action-nya. Action yang dideklarasikan di file
  // "use server" tersendiri (lib/actions.ts) terdaftar di SETIAP rute, termasuk halaman publik —
  // jadi satu-satunya yang menahannya adalah pemeriksaan sesi di dalam action itu sendiri.
  const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8"));
  const nodeActions = manifest.node as Record<string, { workers?: Record<string, unknown> }>;
  const workersOf = (id: string) => Object.keys(nodeActions[id].workers || {});

  const publicPageActionIds = Object.keys(nodeActions).filter((id) => workersOf(id).includes("app/(public)/page"));
  const adminOnlyActionIds = Object.keys(nodeActions).filter((id) => {
    const w = workersOf(id);
    return w.length > 0 && w.every((path) => path.startsWith("app/admin/"));
  });

  it("build memuat action yang bisa dipanggil dari beranda publik", () => {
    assert.ok(publicPageActionIds.length > 0);
  });

  for (const id of publicPageActionIds) {
    it(`unggahan berkas lewat action ${id.slice(0, 10)}… ditolak dari halaman publik`, async () => {
      const body = new FormData();
      body.set("bucket", "gallery-photos");
      body.set("file", new File(["x"], "uji.png", { type: "image/png" }));

      const res = await get("/", { method: "POST", headers: { "Next-Action": id }, body });
      const text = await res.text();

      assert.ok(res.status >= 400, `action ${id} membalas ${res.status} untuk tamu`);
      assert.doesNotMatch(text, /storage\/v1\/object\/public/, "tamu berhasil mengunggah berkas");
    });
  }

  it("build memuat action khusus panel admin", () => {
    assert.ok(adminOnlyActionIds.length > 0);
  });

  for (const id of adminOnlyActionIds.slice(0, 5)) {
    it(`action admin ${id.slice(0, 10)}… dialihkan ke login di rutenya sendiri`, async () => {
      const route = `/${workersOf(id)[0].replace(/^app\//, "").replace(/\/page$/, "")}`;
      const res = await get(route, { method: "POST", headers: { "Next-Action": id }, body: new FormData() });

      assert.ok([302, 307].includes(res.status), `status ${res.status} untuk ${route}`);
      assert.match(res.headers.get("location") || "", /\/login/);
    });
  }
});
