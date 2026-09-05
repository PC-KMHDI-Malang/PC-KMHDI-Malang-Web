import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

export const STORAGE_BUCKETS = {
  news: "news-covers",
  ebook: "ebook-covers",
  gallery: "gallery-photos",
  ebookFiles: "ebook-files",
  articleImages: "article-images",
  partnerLogos: "partner-logos",
  organizationPhotos: "organization-photos",
} as const;

// Kuota tampilan storage. Supabase tidak memberi kuota per-bucket — 1 GB ini adalah jatah asli
// akun (lihat Project Settings > Billing di Supabase Dashboard) yang dipakai BERSAMA oleh semua
// bucket sekaligus, jadi ditampilkan sebagai satu angka gabungan (lihat getTotalStorageUsage di
// bawah), bukan per bucket — kalau ditampilkan per bucket, tiap halaman admin akan terlihat
// seolah punya jatah 1 GB sendiri-sendiri, padahal semuanya berbagi jatah yang sama persis.
export const BUCKET_QUOTA_BYTES = 1024 * 1024 * 1024; // 1 GB

export async function uploadToBucket(bucket: string, file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${randomUUID()}.${ext}`;

  const { error } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(`Gagal upload ke bucket ${bucket}: ${error.message}`);

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// URL yang tersimpan di DB selalu berbentuk "public-style" (dari getPublicUrl saat upload),
// terlepas dari bucket-nya publik atau privat — getPublicUrl cuma menyusun string URL tanpa
// memeriksa hak akses. Jadi bentuknya tetap bisa dipakai sebagai penanda path file di bucket.
function getPathFromStoredUrl(bucket: string, url: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const path = url.slice(idx + marker.length);
  return path || null;
}

export async function deleteFromBucketByUrl(bucket: string, url: string | null | undefined) {
  if (!url) return;
  const path = getPathFromStoredUrl(bucket, url);
  if (!path) return;
  await supabaseAdmin.storage.from(bucket).remove([path]);
}

export async function deleteManyFromBucketByUrls(bucket: string, urls: string[]) {
  const paths = urls.map((url) => getPathFromStoredUrl(bucket, url)).filter((p): p is string => !!p);
  if (paths.length === 0) return;
  await supabaseAdmin.storage.from(bucket).remove(paths);
}

// Gambar yang disisip lewat RichTextEditor (lihat components/admin/RichTextEditor.tsx) berakhir
// sebagai <img src="..."> di tengah kolom "content" artikel, bukan di kolom URL terpisah seperti
// coverImage — jadi tidak ada satu kolom pun yang bisa dibaca untuk tahu file mana yang harus
// dihapus. Fungsi ini menyisir HTML tersebut untuk menemukan semua URL bucket tertentu di dalamnya.
export function extractBucketUrlsFromHtml(bucket: string, html: string | null | undefined): string[] {
  if (!html) return [];
  const marker = `/storage/v1/object/public/${bucket}/`;
  const matches = html.match(/<img[^>]+src="([^"]+)"/g) || [];
  return matches.map((tag) => tag.match(/src="([^"]+)"/)?.[1] || "").filter((url) => url.includes(marker));
}

// Untuk file di bucket privat (mis. "ebook-files"): buat URL akses sementara yang kedaluwarsa
// setelah beberapa waktu, dari URL public-style yang tersimpan di DB. Dipakai supaya file PDF
// ebook hanya bisa diakses lewat halaman yang memang memverifikasi pengguna berhak membukanya —
// bukan lewat URL permanen yang bisa dibagikan/diakses siapa saja selamanya.
export async function getSignedFileUrl(bucket: string, storedUrl: string | null | undefined, expiresInSeconds = 3600): Promise<string | null> {
  if (!storedUrl) return null;
  const path = getPathFromStoredUrl(bucket, storedUrl);
  if (!path) return null;

  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error || !data) return null;

  return data.signedUrl;
}

export async function getBucketUsage(bucket: string): Promise<{ usedBytes: number; fileCount: number }> {
  const { data, error } = await supabaseAdmin.storage.from(bucket).list(undefined, { limit: 1000 });
  if (error || !data) return { usedBytes: 0, fileCount: 0 };
  const usedBytes = data.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);
  return { usedBytes, fileCount: data.length };
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
