import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

export const STORAGE_BUCKETS = {
  news: "news-covers",
  ebook: "ebook-covers",
  gallery: "gallery-photos",
  ebookFiles: "ebook-files",
} as const;

// Kuota tampilan per bucket. Supabase tidak menyediakan kuota per-bucket secara native,
// jadi angka ini hanya dipakai untuk menampilkan progress "terpakai/tersisa" di dashboard.
export const BUCKET_QUOTA_BYTES = 500 * 1024 * 1024; // 500 MB

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

export async function deleteFromBucketByUrl(bucket: string, url: string | null | undefined) {
  if (!url) return;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = url.slice(idx + marker.length);
  if (!path) return;
  await supabaseAdmin.storage.from(bucket).remove([path]);
}

export async function getBucketUsage(bucket: string): Promise<{ usedBytes: number; fileCount: number }> {
  const { data, error } = await supabaseAdmin.storage.from(bucket).list(undefined, { limit: 1000 });
  if (error || !data) return { usedBytes: 0, fileCount: 0 };
  const usedBytes = data.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);
  return { usedBytes, fileCount: data.length };
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
