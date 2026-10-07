import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { whatsappChannel } from "@/lib/notify/channels/whatsapp";
import { buildWhatsAppMessage } from "@/lib/notify/whatsappMessage";
import type { Agenda } from "@/lib/agenda";
import type { NotifyPayload } from "@/lib/notify/types";

const agenda = {
  id: "a1",
  title: "Rapat Pleno",
  slug: "rapat-pleno-abcde",
  kind: "RAPAT",
  startAt: "2026-10-10T12:00:00.000Z",
  endAt: null,
  allDay: false,
  location: "Sekretariat",
  locationDetail: "https://meet.example/RAHASIA-RUANG",
  internalNote: "CATATAN-INTERNAL",
  status: "PUBLISHED",
  audience: "SEMUA",
} as Agenda;

const payload: NotifyPayload = { agenda, reason: "CREATED", title: "Agenda baru: Rapat Pleno", body: "Rapat · Sab, 10 Oktober 2026 · 19.00 WIB · Sekretariat", path: "/agenda/rapat-pleno-abcde" };

describe("whatsapp — teks pesan grup", () => {
  it("memuat judul tebal, ringkasan, audiens, dan tautan", () => {
    const text = buildWhatsAppMessage({ title: "Agenda baru: Rapat", body: "Rapat · 19.00 WIB", audience: "Semua anggota", url: "https://apps.kmhdimalang.org/agenda/x" });
    const lines = text.split("\n");
    assert.equal(lines[0], "*Agenda baru: Rapat*");
    assert.equal(lines[1], "Rapat · 19.00 WIB");
    assert.equal(lines[2], "Untuk: Semua anggota");
    assert.equal(lines.at(-1), "https://apps.kmhdimalang.org/agenda/x");
  });

  it("tanda * dari judul dibuang supaya format tebal tidak rusak", () => {
    const text = buildWhatsAppMessage({ title: "Rapat *penting* **", body: "b", audience: "a", url: "u" });
    assert.equal(text.split("\n")[0], "*Rapat penting*");
  });
});

describe("whatsapp — kanal Fonnte", () => {
  const original = { fetch: globalThis.fetch, token: process.env.FONNTE_TOKEN, group: process.env.FONNTE_GROUP_ID };
  let calls: { url: string; init: RequestInit }[] = [];

  function stubFetch(reply: () => Response | Promise<Response>) {
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      return reply();
    }) as typeof fetch;
  }

  beforeEach(() => {
    calls = [];
    process.env.FONNTE_TOKEN = "tok-123";
    process.env.FONNTE_GROUP_ID = "120363000000@g.us";
  });

  afterEach(() => {
    globalThis.fetch = original.fetch;
    if (original.token === undefined) delete process.env.FONNTE_TOKEN;
    else process.env.FONNTE_TOKEN = original.token;
    if (original.group === undefined) delete process.env.FONNTE_GROUP_ID;
    else process.env.FONNTE_GROUP_ID = original.group;
  });

  it("aktif hanya kalau token DAN id grup terisi", () => {
    assert.equal(whatsappChannel.isEnabled(), true);
    delete process.env.FONNTE_GROUP_ID;
    assert.equal(whatsappChannel.isEnabled(), false);
    process.env.FONNTE_GROUP_ID = "120363000000@g.us";
    delete process.env.FONNTE_TOKEN;
    assert.equal(whatsappChannel.isEnabled(), false);
  });

  it("mengirim ke endpoint Fonnte dengan token polos (tanpa Bearer) dan target grup", async () => {
    stubFetch(() => Response.json({ status: true, detail: "success! message in queue" }));
    const result = await whatsappChannel.send(payload, "Semua anggota");

    assert.deepEqual(result, { ok: true });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://api.fonnte.com/send");
    assert.equal(calls[0].init.method, "POST");
    assert.deepEqual(calls[0].init.headers, { Authorization: "tok-123" });

    const form = calls[0].init.body as FormData;
    assert.equal(form.get("target"), "120363000000@g.us");
    assert.match(String(form.get("message")), /^\*Agenda baru: Rapat Pleno\*/);
    assert.match(String(form.get("message")), /\/agenda\/rapat-pleno-abcde$/);
  });

  it("tidak membocorkan tautan rapat maupun catatan internal ke grup", async () => {
    stubFetch(() => Response.json({ status: true }));
    await whatsappChannel.send(payload, "Semua anggota");
    const message = String((calls[0].init.body as FormData).get("message"));
    assert.equal(message.includes("RAHASIA-RUANG"), false);
    assert.equal(message.includes("CATATAN-INTERNAL"), false);
  });

  it("memakai tujuan lain kalau diberikan (mode uji), bukan grup", async () => {
    stubFetch(() => Response.json({ status: true }));
    await whatsappChannel.send(payload, "Semua anggota", "081234567890");
    assert.equal((calls[0].init.body as FormData).get("target"), "081234567890");
  });

  it("meneruskan alasan penolakan dari Fonnte", async () => {
    stubFetch(() => Response.json({ status: false, reason: "token invalid" }));
    assert.deepEqual(await whatsappChannel.send(payload, "Semua anggota"), { ok: false, error: "token invalid" });
  });

  it("status:false tanpa alasan tetap dianggap gagal", async () => {
    stubFetch(() => Response.json({ status: false }));
    const result = await whatsappChannel.send(payload, "Semua anggota");
    assert.equal(result.ok, false);
  });

  it("HTTP error atau balasan bukan JSON dianggap gagal, bukan sukses", async () => {
    stubFetch(() => new Response("<html>Bad gateway</html>", { status: 502 }));
    const result = await whatsappChannel.send(payload, "Semua anggota");
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /502/);
  });

  it("kegagalan jaringan menghasilkan error, tidak melempar", async () => {
    stubFetch(() => {
      throw new Error("ECONNRESET");
    });
    assert.deepEqual(await whatsappChannel.send(payload, "Semua anggota"), { ok: false, error: "ECONNRESET" });
  });

  it("tanpa konfigurasi tidak memanggil jaringan sama sekali", async () => {
    delete process.env.FONNTE_TOKEN;
    stubFetch(() => Response.json({ status: true }));
    const result = await whatsappChannel.send(payload, "Semua anggota");
    assert.equal(result.ok, false);
    assert.equal(calls.length, 0);
  });
});
