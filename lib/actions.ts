"use server";

import { STORAGE_BUCKETS, uploadToBucket } from "./storage";
import { requireAdminPanel } from "./guard";

// Hanya bucket yang memang dipakai panel admin. Tanpa daftar ini, `bucket` datang mentah dari
// FormData: request di luar UI bisa menyebut bucket apa pun yang ada di project Supabase.
const ALLOWED_BUCKETS = new Set<string>(Object.values(STORAGE_BUCKETS));

// Ukuran & tipe disamakan dengan konfigurasi bucket di app/api/setup-buckets/route.ts.
const MAX_IMAGE_BYTES = 1 * 1024 * 1024;
const MAX_PDF_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function uploadFileAction(formData: FormData) {
  // Action ini menulis ke storage pakai service role key — tanpa pemeriksaan sesi di sini,
  // siapa pun yang tahu action ID-nya bisa mengisi bucket sampai kuota habis.
  await requireAdminPanel();

  const file = formData.get("file");
  const bucket = formData.get("bucket");

  if (!(file instanceof File) || file.size === 0) throw new Error("File tidak valid");
  if (typeof bucket !== "string" || !ALLOWED_BUCKETS.has(bucket)) throw new Error("Bucket tidak dikenal");

  const isPdfBucket = bucket === STORAGE_BUCKETS.ebookFiles;

  if (isPdfBucket) {
    if (file.type !== "application/pdf") throw new Error("File harus berformat PDF");
    if (file.size > MAX_PDF_BYTES) throw new Error("Ukuran PDF maksimal 5 MB");
  } else {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error("File harus berupa gambar (JPG, PNG, WebP, atau GIF)");
    if (file.size > MAX_IMAGE_BYTES) throw new Error("Ukuran gambar maksimal 1 MB");
  }

  return await uploadToBucket(bucket, file);
}
