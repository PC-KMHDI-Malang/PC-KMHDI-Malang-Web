import { randomUUID } from "crypto";
import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { supabaseAdmin } from "@/lib/supabase";
import { isR2Configured, r2Client, R2_PRIVATE_BUCKET, R2_PUBLIC_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import { STORAGE_BUCKETS } from "@/lib/uploadLimits";

// Nama bucket & batas ukuran per bucket kini tinggal di lib/uploadLimits.ts (file murni yang
// juga bisa di-import komponen client), dan di-export ulang di sini supaya import lama
// (`from "@/lib/storage"`) tetap jalan apa adanya.
export { STORAGE_BUCKETS, BUCKET_FILE_SIZE_LIMITS } from "@/lib/uploadLimits";

// Kuota tampilan storage. Supabase tidak memberi kuota per-bucket — 1 GB ini adalah jatah asli
// akun (lihat Project Settings > Billing di Supabase Dashboard) yang dipakai BERSAMA oleh semua
// bucket sekaligus, jadi ditampilkan sebagai satu angka gabungan (lihat getTotalStorageUsage di
// bawah), bukan per bucket — kalau ditampilkan per bucket, tiap halaman admin akan terlihat
// seolah punya jatah 1 GB sendiri-sendiri, padahal semuanya berbagi jatah yang sama persis.
export const BUCKET_QUOTA_BYTES = 1024 * 1024 * 1024; // 1 GB

// Jatah gratis Cloudflare R2, dihitung dari isi kedua bucket R2 (publik + privat) sekaligus —
// lihat getR2StorageUsage di bawah.
export const R2_QUOTA_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB

// Selama masa peralihan ke Cloudflare R2, sebuah file bisa tersimpan dalam salah satu bentuk:
// - Supabase (file lama):  https://<proj>.supabase.co/storage/v1/object/public/<bucket>/<file>
// - R2 publik (gambar):    <NEXT_PUBLIC_R2_PUBLIC_URL>/<bucket>/<file>
// - R2 privat (PDF):       r2-private://<bucket>/<file> — sengaja bukan URL yang bisa dibuka;
//                          aksesnya selalu lewat getSignedFileUrl.
// Kolom di DB menyimpan bentuk-bentuk di atas apa adanya, dan semua fungsi di file ini mengenali
// ketiganya — jadi file lama tetap bisa ditampilkan/dihapus sebelum maupun sesudah dimigrasi
// oleh scripts/migrate-storage-to-r2.mjs.
export const R2_PRIVATE_SCHEME = "r2-private://";

// Bucket privat di Supabase; di R2 isinya masuk ke bucket R2 privat, sisanya ke bucket R2 publik.
// Jangan pernah dipindah ke bucket publik — PDF e-book cuma boleh dibuka lewat signed URL.
const PRIVATE_BUCKETS = new Set<string>([STORAGE_BUCKETS.ebookFiles]);

export type StoredFileRef = { provider: "supabase"; path: string } | { provider: "r2-public" | "r2-private"; key: string };

// Catatan untuk URL Supabase: bentuknya selalu "public-style" (dari getPublicUrl saat upload),
// terlepas dari bucket-nya publik atau privat — getPublicUrl cuma menyusun string URL tanpa
// memeriksa hak akses. Jadi bentuknya tetap bisa dipakai sebagai penanda path file di bucket.
export function resolveStoredUrl(bucket: string, url: string, r2PublicUrl: string = R2_PUBLIC_URL): StoredFileRef | null {
  const supabaseMarker = `/storage/v1/object/public/${bucket}/`;
  const supabaseIdx = url.indexOf(supabaseMarker);
  if (supabaseIdx !== -1) {
    const path = url.slice(supabaseIdx + supabaseMarker.length);
    return path ? { provider: "supabase", path } : null;
  }

  const privatePrefix = `${R2_PRIVATE_SCHEME}${bucket}/`;
  if (url.startsWith(privatePrefix) && url.length > privatePrefix.length) {
    return { provider: "r2-private", key: url.slice(R2_PRIVATE_SCHEME.length) };
  }

  if (r2PublicUrl) {
    const publicPrefix = `${r2PublicUrl}/${bucket}/`;
    if (url.startsWith(publicPrefix) && url.length > publicPrefix.length) {
      return { provider: "r2-public", key: url.slice(r2PublicUrl.length + 1) };
    }
  }

  return null;
}

// Ekstensi datang dari nama file kiriman pengguna, jadi tidak dipakai apa adanya: dibatasi
// huruf/angka dan panjangnya supaya tidak ada nama objek aneh (mis. ".html", "..%2f") di bucket publik.
export function safeObjectName(fileName: string): string {
  const rawExt = fileName.includes(".") ? fileName.split(".").pop() : "";
  const ext = /^[a-zA-Z0-9]{1,5}$/.test(rawExt || "") ? rawExt!.toLowerCase() : "bin";
  return `${randomUUID()}.${ext}`;
}

export async function uploadToBucket(bucket: string, file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const path = safeObjectName(file.name);

  // Begitu env R2 diisi, semua upload baru masuk R2. Tanpa env R2, perilakunya sama persis
  // seperti sebelumnya (Supabase) — jadi kode ini aman di-deploy sebelum Cloudflare disiapkan.
  if (isR2Configured()) {
    const isPrivate = PRIVATE_BUCKETS.has(bucket);
    const key = `${bucket}/${path}`;
    try {
      await r2Client().send(
        new PutObjectCommand({
          Bucket: isPrivate ? R2_PRIVATE_BUCKET : R2_PUBLIC_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: file.type || "image/jpeg",
          // Nama file selalu UUID baru, jadi isi di balik satu URL tidak pernah berubah.
          CacheControl: isPrivate ? "private, no-store" : "public, max-age=31536000, immutable",
        }),
      );
    } catch (err) {
      throw new Error(`Gagal upload ke storage ${bucket}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
    return isPrivate ? `${R2_PRIVATE_SCHEME}${key}` : `${R2_PUBLIC_URL}/${key}`;
  }

  const { error } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(`Gagal upload ke bucket ${bucket}: ${error.message}`);

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Link upload sementara (presigned PUT) supaya browser bisa mengirim file LANGSUNG ke R2, tanpa
// lewat server Vercel yang membatasi body request 4.5 MB. Nama objek dibuat di server (UUID),
// dan Content-Type + Content-Length ikut ditandatangani: browser hanya bisa mengunggah file
// dengan jenis & ukuran persis seperti yang sudah divalidasi di createUploadUrlAction
// (lib/actions.ts). Link kedaluwarsa dalam 10 menit.
export async function createR2UploadUrl(bucket: string, fileName: string, contentType: string, size: number) {
  const isPrivate = PRIVATE_BUCKETS.has(bucket);
  const key = `${bucket}/${safeObjectName(fileName)}`;
  const cacheControl = isPrivate ? "private, no-store" : "public, max-age=31536000, immutable";

  const uploadUrl = await getSignedUrl(
    r2Client(),
    new PutObjectCommand({
      Bucket: isPrivate ? R2_PRIVATE_BUCKET : R2_PUBLIC_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
      CacheControl: cacheControl,
    }),
    { expiresIn: 600, signableHeaders: new Set(["content-type", "content-length"]) },
  );

  return {
    uploadUrl,
    headers: { "Content-Type": contentType, "Cache-Control": cacheControl },
    fileUrl: isPrivate ? `${R2_PRIVATE_SCHEME}${key}` : `${R2_PUBLIC_URL}/${key}`,
  };
}

export async function deleteFromBucketByUrl(bucket: string, url: string | null | undefined) {
  if (!url) return;
  await deleteManyFromBucketByUrls(bucket, [url]);
}

export async function deleteManyFromBucketByUrls(bucket: string, urls: string[]) {
  const refs = urls.map((url) => resolveStoredUrl(bucket, url)).filter((r): r is StoredFileRef => !!r);

  const supabasePaths = refs.flatMap((r) => (r.provider === "supabase" ? [r.path] : []));
  if (supabasePaths.length > 0) await supabaseAdmin.storage.from(bucket).remove(supabasePaths);

  if (!isR2Configured()) return;
  for (const provider of ["r2-public", "r2-private"] as const) {
    const keys = refs.flatMap((r) => (r.provider === provider ? [r.key] : []));
    if (keys.length === 0) continue;
    const Bucket = provider === "r2-private" ? R2_PRIVATE_BUCKET : R2_PUBLIC_BUCKET;
    if (keys.length === 1) {
      await r2Client().send(new DeleteObjectCommand({ Bucket, Key: keys[0] }));
    } else {
      await r2Client().send(new DeleteObjectsCommand({ Bucket, Delete: { Objects: keys.map((Key) => ({ Key })) } }));
    }
  }
}

// Gambar yang disisip lewat RichTextEditor (lihat components/admin/RichTextEditor.tsx) berakhir
// sebagai <img src="..."> di tengah kolom "content" artikel, bukan di kolom URL terpisah seperti
// coverImage — jadi tidak ada satu kolom pun yang bisa dibaca untuk tahu file mana yang harus
// dihapus. Fungsi ini menyisir HTML tersebut untuk menemukan semua URL bucket tertentu di dalamnya
// (baik yang masih di Supabase maupun yang sudah di R2).
export function extractBucketUrlsFromHtml(bucket: string, html: string | null | undefined, r2PublicUrl: string = R2_PUBLIC_URL): string[] {
  if (!html) return [];
  const matches = html.match(/<img[^>]+src="([^"]+)"/g) || [];
  return matches.map((tag) => tag.match(/src="([^"]+)"/)?.[1] || "").filter((url) => !!url && resolveStoredUrl(bucket, url, r2PublicUrl) !== null);
}

// Untuk file di bucket privat (mis. "ebook-files"): buat URL akses sementara yang kedaluwarsa
// setelah beberapa waktu, dari URL yang tersimpan di DB. Dipakai supaya file PDF ebook hanya
// bisa diakses lewat halaman yang memang memverifikasi pengguna berhak membukanya — bukan
// lewat URL permanen yang bisa dibagikan/diakses siapa saja selamanya.
export async function getSignedFileUrl(bucket: string, storedUrl: string | null | undefined, expiresInSeconds = 3600): Promise<string | null> {
  if (!storedUrl) return null;
  const ref = resolveStoredUrl(bucket, storedUrl);
  if (!ref) return null;

  if (ref.provider !== "supabase") {
    if (!isR2Configured()) return null;
    try {
      const Bucket = ref.provider === "r2-private" ? R2_PRIVATE_BUCKET : R2_PUBLIC_BUCKET;
      return await getSignedUrl(r2Client(), new GetObjectCommand({ Bucket, Key: ref.key }), { expiresIn: expiresInSeconds });
    } catch {
      return null;
    }
  }

  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(ref.path, expiresInSeconds);
  if (error || !data) return null;

  return data.signedUrl;
}

export async function getBucketUsage(bucket: string): Promise<{ usedBytes: number; fileCount: number }> {
  // Berhalaman: list() Supabase maksimal 1.000 file per panggilan, dan bucket galeri/artikel
  // bisa melewati itu — tanpa ini angka pemakaian diam-diam terpotong.
  let usedBytes = 0;
  let fileCount = 0;
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabaseAdmin.storage.from(bucket).list(undefined, { limit: 1000, offset });
    if (error || !data) break;
    usedBytes += data.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);
    fileCount += data.filter((f) => f.id).length;
    if (data.length < 1000) break;
  }
  return { usedBytes, fileCount };
}

// Menjumlahkan pemakaian semua bucket, karena kuota storage Supabase itu satu jatah bersama —
// bukan per bucket. Dipakai di satu tempat saja (dashboard admin), bukan di tiap halaman/modal,
// supaya adminnya melihat satu angka yang benar-benar mencerminkan sisa kuota akun.
export async function getTotalStorageUsage(): Promise<{ usedBytes: number; fileCount: number }> {
  const results = await Promise.all(Object.values(STORAGE_BUCKETS).map((bucket) => getBucketUsage(bucket)));
  return results.reduce(
    (total, r) => ({ usedBytes: total.usedBytes + r.usedBytes, fileCount: total.fileCount + r.fileCount }),
    { usedBytes: 0, fileCount: 0 },
  );
}

// Total isi kedua bucket R2 (gambar publik + PDF privat). Null kalau R2 belum dikonfigurasi
// atau tidak bisa dihubungi.
export async function getR2StorageUsage(): Promise<{ usedBytes: number; fileCount: number } | null> {
  if (!isR2Configured()) return null;
  let usedBytes = 0;
  let fileCount = 0;
  try {
    for (const Bucket of [R2_PUBLIC_BUCKET, R2_PRIVATE_BUCKET]) {
      let ContinuationToken: string | undefined;
      do {
        const res = await r2Client().send(new ListObjectsV2Command({ Bucket, ContinuationToken }));
        for (const obj of res.Contents ?? []) {
          usedBytes += obj.Size ?? 0;
          fileCount += 1;
        }
        ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
      } while (ContinuationToken);
    }
  } catch {
    return null;
  }
  return { usedBytes, fileCount };
}

export async function listBucketFiles(bucket: string) {
  const { data, error } = await supabaseAdmin.storage.from(bucket).list(undefined, { limit: 100 });
  if (error || !data) return [];

  return data
    .filter((f) => f.id)
    .map((f) => {
      const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(f.name);
      return {
        name: f.name,
        url: publicUrlData.publicUrl,
        created_at: f.created_at,
      };
    })
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
