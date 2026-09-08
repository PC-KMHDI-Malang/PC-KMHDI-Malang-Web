import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Tombol suka dulu memanggil action ini tanpa sesi sama sekali, sehingga siapa pun bisa
// menaikkan angkanya berkali-kali dari luar UI (terbukti: 4 → 9 hanya dengan lima request).
// Tes ini menjaga agar pintu itu tidak terbuka lagi tanpa ketahuan.
describe("aksi suka menolak pemanggil tanpa sesi", () => {
  const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8"));
  const nodeActions = manifest.node as Record<string, { workers?: Record<string, unknown> }>;

  // toggleLikeAction dipakai persis oleh dua halaman detail: artikel dan e-book.
  const likeActionIds = Object.keys(nodeActions).filter((id) => {
    const workers = Object.keys(nodeActions[id].workers || {});
    return workers.length === 2 && workers.every((path) => path.endsWith("[slug]/page"));
  });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  let articleId = "";
  let likesBefore = 0;

  before(async () => {
    const { data } = await supabase.from("News").select("id, likes").eq("status", "PUBLISHED").limit(1).single();
    articleId = data!.id;
    likesBefore = data!.likes ?? 0;
  });

  it("build memuat action suka", () => {
    assert.equal(likeActionIds.length, 1, `harusnya tepat satu action suka, dapat ${likeActionIds.length}`);
  });

  it("angka suka tidak bergerak walau action dipanggil berulang kali tanpa login", async () => {
    for (let i = 0; i < 5; i++) {
      await fetch(`${BASE_URL}/`, {
        method: "POST",
        headers: { "Next-Action": likeActionIds[0], "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify(["news", articleId, true]),
      });
    }

    const { data } = await supabase.from("News").select("likes").eq("id", articleId).single();
    assert.equal(data!.likes, likesBefore, "tamu berhasil menaikkan angka suka");
  });
});
