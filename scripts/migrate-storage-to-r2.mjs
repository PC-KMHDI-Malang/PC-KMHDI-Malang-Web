// Migrasi file yang SUDAH ADA dari Supabase Storage ke Cloudflare R2.
//
// Jalankan dari root project (env dibaca dari .env):
//   npm run storage:migrate -- copy               1. salin semua file Supabase -> R2 (aman diulang)
//   npm run storage:migrate -- rewrite --dry-run  2. lihat URL di database yang akan diganti
//   npm run storage:migrate -- rewrite            3. ganti URL Supabase -> R2 di database (+ backup)
//   npm run storage:migrate -- verify             4. pastikan semua URL R2 ada & tak ada URL Supabase tersisa
//   npm run storage:migrate -- cleanup-supabase --yes   5. (terakhir, opsional) hapus file lama di Supabase
//   npm run storage:migrate -- restore scripts/rewrite-backup-XXXX.json   kembalikan URL lama dari backup
//
// Tidak ada langkah yang menghapus apa pun kecuali cleanup-supabase, dan itu menolak jalan selama
// masih ada URL Supabase di database. Format URL hasil migrasi sama persis dengan yang dibuat
// lib/storage.ts untuk upload baru, jadi setelah migrasi semua file diperlakukan sama.

import { writeFileSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { S3Client, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

// Harus sama dengan STORAGE_BUCKETS di lib/storage.ts.
const BUCKETS = ["news-covers", "ebook-covers", "gallery-photos", "ebook-files", "article-images", "partner-logos", "organization-photos", "popup-ads"];
const PRIVATE_BUCKETS = new Set(["ebook-files"]);
const R2_PRIVATE_SCHEME = "r2-private://";

// Tabel yang isinya bisa memuat URL file. Semua kolom teks di tabel ini dipindai (bukan cuma
// kolom yang sudah diketahui seperti coverImage/logoUrl), jadi kolom gambar yang terlewat pun
// ikut terdeteksi. Tabel yang tidak ada di database dilewati dengan peringatan.
const TABLES = ["News", "Ebook", "Gallery", "Partner", "Pengurus", "PopupAd", "Statistic", "StatisticSection", "Category"];

const SUPABASE_URL_RE = /https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/([a-z0-9-]+)\/([^"'\s?#<>)]+)/gi;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`✖ Env ${name} belum diisi. Lihat .env.example.`);
    process.exit(1);
  }
  return value;
}

const supabase = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"));
const R2_PUBLIC_BUCKET = requireEnv("R2_PUBLIC_BUCKET");
const R2_PRIVATE_BUCKET = requireEnv("R2_PRIVATE_BUCKET");
const R2_PUBLIC_URL = requireEnv("NEXT_PUBLIC_R2_PUBLIC_URL").replace(/\/+$/, "");
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: requireEnv("R2_ACCESS_KEY_ID"), secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY") },
});

const r2BucketFor = (bucket) => (PRIVATE_BUCKETS.has(bucket) ? R2_PRIVATE_BUCKET : R2_PUBLIC_BUCKET);
const r2UrlFor = (bucket, path) => (PRIVATE_BUCKETS.has(bucket) ? `${R2_PRIVATE_SCHEME}${bucket}/${path}` : `${R2_PUBLIC_URL}/${bucket}/${path}`);
const timestamp = () => new Date().toISOString().replace(/[:.]/g, "-");

async function pool(items, size, fn) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (i < items.length) await fn(items[i++]);
    }),
  );
}

// Semua file di satu bucket Supabase, berhalaman & termasuk subfolder (item tanpa id = folder).
async function listSupabaseFiles(bucket, prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`Gagal membaca bucket ${bucket}: ${error.message}`);
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id) files.push({ path, size: item.metadata?.size ?? null, mimetype: item.metadata?.mimetype ?? null });
      else files.push(...(await listSupabaseFiles(bucket, path)));
    }
    if (data.length < 1000) return files;
  }
}

const headCache = new Map();
async function r2Head(bucket, path) {
  const cacheKey = `${bucket}/${path}`;
  if (!headCache.has(cacheKey)) {
    headCache.set(
      cacheKey,
      r2
        .send(new HeadObjectCommand({ Bucket: r2BucketFor(bucket), Key: `${bucket}/${path}` }))
        .then((res) => ({ size: res.ContentLength ?? null }))
        .catch((err) => {
          if (err?.$metadata?.httpStatusCode === 404 || err?.name === "NotFound") return null;
          throw err;
        }),
    );
  }
  return headCache.get(cacheKey);
}

// ---------------------------------------------------------------------------------------------
// 1. copy
// ---------------------------------------------------------------------------------------------
async function copy() {
  const report = { startedAt: new Date().toISOString(), buckets: {} };
  for (const bucket of BUCKETS) {
    let files;
    try {
      files = await listSupabaseFiles(bucket);
    } catch (err) {
      console.warn(`⚠ ${bucket}: ${err.message} — dilewati.`);
      continue;
    }
    const stats = { total: files.length, copied: 0, skipped: 0, bytes: 0, failed: [] };
    report.buckets[bucket] = stats;
    console.log(`\n▶ ${bucket}: ${files.length} file`);

    await pool(files, 5, async (file) => {
      try {
        const existing = await r2Head(bucket, file.path);
        if (existing && (file.size === null || existing.size === file.size)) {
          stats.skipped++;
          return;
        }
        const { data: blob, error } = await supabase.storage.from(bucket).download(file.path);
        if (error || !blob) throw new Error(error?.message ?? "download kosong");
        const body = Buffer.from(await blob.arrayBuffer());
        await r2.send(
          new PutObjectCommand({
            Bucket: r2BucketFor(bucket),
            Key: `${bucket}/${file.path}`,
            Body: body,
            ContentType: file.mimetype || blob.type || "application/octet-stream",
            CacheControl: PRIVATE_BUCKETS.has(bucket) ? "private, no-store" : "public, max-age=31536000, immutable",
          }),
        );
        headCache.set(`${bucket}/${file.path}`, Promise.resolve({ size: body.length }));
        stats.copied++;
        stats.bytes += body.length;
        process.stdout.write(".");
      } catch (err) {
        stats.failed.push({ path: file.path, error: String(err?.message ?? err) });
        process.stdout.write("x");
      }
    });
    console.log(`\n  disalin ${stats.copied}, sudah ada ${stats.skipped}, gagal ${stats.failed.length}`);
  }

  const file = `scripts/migration-report-${timestamp()}.json`;
  writeFileSync(file, JSON.stringify(report, null, 2));
  const failed = Object.values(report.buckets).reduce((n, b) => n + b.failed.length, 0);
  console.log(`\nLaporan: ${file}`);
  console.log(failed ? `⚠ ${failed} file gagal — jalankan "copy" lagi (yang sudah tersalin akan dilewati).` : "✔ Semua file tersalin. Lanjut: rewrite --dry-run");
}

// ---------------------------------------------------------------------------------------------
// Pemindaian database
// ---------------------------------------------------------------------------------------------
async function fetchRows(table) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select("*").range(from, from + 999);
    if (error) {
      console.warn(`⚠ Tabel ${table} dilewati: ${error.message}`);
      return rows;
    }
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

// Untuk tiap kolom teks yang memuat URL Supabase: nilai baru (URL diganti ke R2) — tapi hanya
// untuk file yang terbukti sudah ada di R2. Yang belum ada dibiarkan & dilaporkan sebagai "missing".
async function planRewrite() {
  const changes = [];
  const missing = [];
  for (const table of TABLES) {
    for (const row of await fetchRows(table)) {
      for (const [column, value] of Object.entries(row)) {
        if (typeof value !== "string" || !value.includes("/storage/v1/object/public/")) continue;

        let next = value;
        for (const match of value.matchAll(SUPABASE_URL_RE)) {
          const [url, bucket, rawPath] = match;
          if (!BUCKETS.includes(bucket)) continue;
          const path = decodeURIComponent(rawPath);
          if (await r2Head(bucket, path)) next = next.split(url).join(r2UrlFor(bucket, path));
          else missing.push({ table, id: row.id, column, url });
        }
        if (next !== value) {
          if (row.id === undefined) {
            console.warn(`⚠ ${table}.${column}: baris tanpa kolom "id", dilewati.`);
            continue;
          }
          changes.push({ table, id: row.id, column, old: value, new: next });
        }
      }
    }
  }
  return { changes, missing };
}

function summarize(changes) {
  const counts = {};
  for (const c of changes) counts[`${c.table}.${c.column}`] = (counts[`${c.table}.${c.column}`] ?? 0) + 1;
  return counts;
}

// ---------------------------------------------------------------------------------------------
// 2/3. rewrite
// ---------------------------------------------------------------------------------------------
async function rewrite(dryRun) {
  const { changes, missing } = await planRewrite();
  console.log(dryRun ? "\n[DRY RUN] Kolom yang akan diganti:" : "\nKolom yang diganti:");
  console.table(summarize(changes));
  if (missing.length) {
    console.warn(`⚠ ${missing.length} URL menunjuk file yang belum ada di R2 (dibiarkan tetap Supabase). Contoh:`);
    console.warn(missing.slice(0, 5));
  }
  if (dryRun || changes.length === 0) {
    if (changes.length === 0) console.log("Tidak ada URL Supabase yang perlu diganti.");
    return;
  }

  const backupFile = `scripts/rewrite-backup-${timestamp()}.json`;
  writeFileSync(backupFile, JSON.stringify(changes.map(({ table, id, column, old }) => ({ table, id, column, old })), null, 2));
  console.log(`Backup nilai lama: ${backupFile}`);

  let failed = 0;
  for (const c of changes) {
    const { error } = await supabase.from(c.table).update({ [c.column]: c.new }).eq("id", c.id);
    if (error) {
      failed++;
      console.error(`✖ ${c.table}#${c.id}.${c.column}: ${error.message}`);
    }
  }
  console.log(failed ? `⚠ ${failed} baris gagal diperbarui — jalankan "rewrite" lagi.` : `✔ ${changes.length} nilai diperbarui. Lanjut: verify`);
}

// ---------------------------------------------------------------------------------------------
// 4. verify
// ---------------------------------------------------------------------------------------------
async function verify() {
  let supabaseLeft = 0;
  let r2Ok = 0;
  const broken = [];
  const r2PublicRe = new RegExp(`${R2_PUBLIC_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/([a-z0-9-]+)/([^"'\\s?#<>)]+)`, "g");
  const r2PrivateRe = /r2-private:\/\/([a-z0-9-]+)\/([^"'\s?#<>)]+)/g;

  for (const table of TABLES) {
    for (const row of await fetchRows(table)) {
      for (const [column, value] of Object.entries(row)) {
        if (typeof value !== "string") continue;
        supabaseLeft += [...value.matchAll(SUPABASE_URL_RE)].filter((m) => BUCKETS.includes(m[1])).length;
        for (const [url, bucket, path] of [...value.matchAll(r2PublicRe), ...value.matchAll(r2PrivateRe)]) {
          if (await r2Head(bucket, decodeURIComponent(path))) r2Ok++;
          else broken.push({ table, id: row.id, column, url });
        }
      }
    }
  }

  console.log(`\nURL R2 valid       : ${r2Ok}`);
  console.log(`URL R2 rusak       : ${broken.length}`);
  console.log(`URL Supabase sisa  : ${supabaseLeft}`);
  if (broken.length) console.warn(broken.slice(0, 10));
  const ok = broken.length === 0 && supabaseLeft === 0;
  console.log(ok ? "✔ Semua file sudah dilayani dari R2." : "⚠ Belum tuntas — lihat angka di atas.");
  return { ok, supabaseLeft, broken };
}

// ---------------------------------------------------------------------------------------------
// 5. cleanup-supabase
// ---------------------------------------------------------------------------------------------
async function cleanupSupabase(confirmed) {
  const { supabaseLeft, broken } = await verify();
  if (supabaseLeft > 0 || broken.length > 0) {
    console.error("\n✖ Dibatalkan: masih ada URL Supabase / URL R2 rusak di database. Selesaikan copy + rewrite dulu.");
    process.exit(1);
  }
  if (!confirmed) {
    console.error('\n✖ Tambahkan --yes untuk benar-benar menghapus file di Supabase Storage. Pastikan situs sudah dicek.');
    process.exit(1);
  }

  for (const bucket of BUCKETS) {
    let files;
    try {
      files = await listSupabaseFiles(bucket);
    } catch {
      continue;
    }
    // Hanya file yang salinannya terbukti ada di R2 (ukuran sama) yang dihapus.
    const safe = [];
    for (const f of files) {
      const head = await r2Head(bucket, f.path);
      if (head && (f.size === null || head.size === f.size)) safe.push(f.path);
    }
    for (let i = 0; i < safe.length; i += 100) {
      const { error } = await supabase.storage.from(bucket).remove(safe.slice(i, i + 100));
      if (error) console.error(`✖ ${bucket}: ${error.message}`);
    }
    console.log(`${bucket}: ${safe.length}/${files.length} file dihapus dari Supabase`);
  }
}

// ---------------------------------------------------------------------------------------------
// restore
// ---------------------------------------------------------------------------------------------
async function restore(file) {
  if (!file) {
    console.error("✖ Sebutkan file backup, mis. scripts/rewrite-backup-XXXX.json");
    process.exit(1);
  }
  const entries = JSON.parse(readFileSync(file, "utf8"));
  let failed = 0;
  for (const e of entries) {
    const { error } = await supabase.from(e.table).update({ [e.column]: e.old }).eq("id", e.id);
    if (error) {
      failed++;
      console.error(`✖ ${e.table}#${e.id}.${e.column}: ${error.message}`);
    }
  }
  console.log(failed ? `⚠ ${failed} gagal dikembalikan.` : `✔ ${entries.length} nilai dikembalikan ke URL lama.`);
}

const [step, ...args] = process.argv.slice(2);
const steps = {
  copy: () => copy(),
  rewrite: () => rewrite(args.includes("--dry-run")),
  verify: () => verify(),
  "cleanup-supabase": () => cleanupSupabase(args.includes("--yes")),
  restore: () => restore(args[0]),
};

if (!steps[step]) {
  console.log("Langkah: copy | rewrite [--dry-run] | verify | cleanup-supabase --yes | restore <file-backup>");
  process.exit(1);
}

steps[step]().catch((err) => {
  console.error("✖", err?.message ?? err);
  process.exit(1);
});
