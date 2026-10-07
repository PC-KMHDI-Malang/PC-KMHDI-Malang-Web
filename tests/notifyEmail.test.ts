import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { emailChannel } from "@/lib/notify/channels/email";
import { isReservedEmailDomain, parseNotifyEmail } from "@/lib/notifyEmail";
import type { Agenda, NotifiableUser } from "@/lib/agenda";
import type { NotifyPayload } from "@/lib/notify/types";

describe("notifyEmail — validasi email notifikasi", () => {
  it("kosong berarti menghapus (ok, null)", () => {
    for (const input of ["", "   ", null, undefined]) {
      assert.deepEqual(parseNotifyEmail(input), { ok: true, value: null }, String(input));
    }
  });

  it("menormalkan ke huruf kecil dan membuang spasi", () => {
    assert.deepEqual(parseNotifyEmail("  Budi.Santoso@Gmail.COM "), { ok: true, value: "budi.santoso@gmail.com" });
  });

  it("menerima bentuk email umum", () => {
    for (const email of ["a@b.co", "nama+tag@mail.ub.ac.id", "x_y-z@sub.domain.org"]) {
      assert.equal(parseNotifyEmail(email).ok, true, email);
    }
  });

  it("menolak yang jelas bukan email", () => {
    for (const email of ["budi", "budi@", "@gmail.com", "budi@gmail", "bu di@gmail.com", "a@b@c.com", "budi@gmail.c", "<x>@gmail.com", "a,b@gmail.com"]) {
      assert.equal(parseNotifyEmail(email).ok, false, email);
    }
  });

  it("menolak bukan string dan yang kepanjangan", () => {
    assert.equal(parseNotifyEmail(123).ok, false);
    assert.equal(parseNotifyEmail({}).ok, false);
    assert.equal(parseNotifyEmail(`${"a".repeat(250)}@gmail.com`).ok, false);
  });

  it("menolak domain contoh yang pasti memantul", () => {
    for (const email of ["dummy@example.com", "x@example.org", "x@mail.test", "x@foo.invalid", "x@app.localhost"]) {
      const result = parseNotifyEmail(email);
      assert.equal(result.ok, false, email);
    }
    assert.equal(isReservedEmailDomain("EXAMPLE.com"), true);
    assert.equal(isReservedEmailDomain("gmail.com"), false);
    // "test" sebagai bagian nama domain biasa bukan domain terlarang; hanya akhiran .test.
    assert.equal(isReservedEmailDomain("mytest.com"), false);
  });
});

describe("notifyEmail — kanal email hanya memakai email asli", () => {
  const original = {
    fetch: globalThis.fetch,
    key: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM,
  };
  let requests: { url: string; body: unknown }[] = [];

  const agenda = { id: "a1", slug: "rapat-abcde" } as Agenda;
  const payload: NotifyPayload = { agenda, reason: "CREATED", title: "Agenda baru: Rapat", body: "Rapat · 19.00 WIB", path: "/agenda/rapat-abcde" };

  const withReal: NotifiableUser = { id: "u1", name: "Budi Santoso", email: "budi.login@kmhdimalang.org", notifyEmail: "budi.asli@gmail.com", role: "USER" };
  const withoutReal: NotifiableUser = { id: "u2", name: "Ayu", email: "ayu.login@kmhdimalang.org", notifyEmail: null, role: "USER" };

  beforeEach(() => {
    requests = [];
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.RESEND_FROM = "PC KMHDI Malang <agenda@info.kmhdimalang.org>";
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      const text = typeof init?.body === "string" ? init.body : "";
      requests.push({ url: String(url), body: text ? JSON.parse(text) : null });
      return Response.json({ data: [{ id: "e1" }, { id: "e2" }], errors: [] });
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = original.fetch;
    if (original.key === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = original.key;
    if (original.from === undefined) delete process.env.RESEND_FROM;
    else process.env.RESEND_FROM = original.from;
  });

  it("canReach: hanya yang sudah mengisi email notifikasi", () => {
    assert.equal(emailChannel.canReach?.(withReal), true);
    assert.equal(emailChannel.canReach?.(withoutReal), false);
    assert.equal(emailChannel.canReach?.({ ...withoutReal, notifyEmail: "" }), false);
    // email login saja TIDAK cukup.
    assert.equal(emailChannel.canReach?.({ ...withoutReal, email: "ada@gmail.com" }), false);
  });

  it("mengirim ke notifyEmail, bukan ke email login", async () => {
    const result = await emailChannel.send(payload, [withReal]);

    assert.deepEqual(result.sent, ["u1"]);
    assert.equal(requests.length, 1);
    const sentTo = JSON.stringify(requests[0].body);
    assert.equal(sentTo.includes("budi.asli@gmail.com"), true);
    assert.equal(sentTo.includes("budi.login@kmhdimalang.org"), false);
  });

  it("anggota tanpa email notifikasi tidak pernah dikirimi, walau email loginnya ada", async () => {
    await emailChannel.send(payload, [withReal, withoutReal]);

    assert.equal(requests.length, 1);
    const sentTo = JSON.stringify(requests[0].body);
    assert.equal(sentTo.includes("ayu.login@kmhdimalang.org"), false);
    assert.equal((requests[0].body as unknown[]).length, 1);
  });

  it("tidak memanggil Resend sama sekali kalau tidak ada yang punya email notifikasi", async () => {
    const result = await emailChannel.send(payload, [withoutReal]);
    assert.equal(requests.length, 0);
    assert.deepEqual(result, { sent: [], failed: [] });
  });
});
