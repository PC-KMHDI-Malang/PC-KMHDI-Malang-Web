"use server";

import { STORAGE_BUCKETS, BUCKET_FILE_SIZE_LIMITS, uploadToBucket } from "./storage";
import { requireAdminPanel } from "./guard";

// Hanya bucket yang memang dipakai panel admin. Tanpa daftar ini, `bucket` datang mentah dari
// FormData: request di luar UI bisa menyebut bucket apa pun yang ada di project Supabase.
const ALLOWED_BUCKETS = new Set<string>(Object.values(STORAGE_BUCKETS));

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
  // BUCKET_FILE_SIZE_LIMITS (lib/storage.ts) adalah satu-satunya sumber batas ukuran — validasi
  // di ImagePicker/FilePicker cuma menampilkan pesan lebih awal di browser, ini gerbang yang
  // sebenarnya menegakkannya.
  const maxBytes = BUCKET_FILE_SIZE_LIMITS[bucket] ?? 1 * 1024 * 1024;
  const maxMB = Math.round(maxBytes / (1024 * 1024));

  if (isPdfBucket) {
    if (file.type !== "application/pdf") throw new Error("File harus berformat PDF");
    if (file.size > maxBytes) throw new Error(`Ukuran PDF maksimal ${maxMB} MB`);
  } else {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error("File harus berupa gambar (JPG, PNG, WebP, atau GIF)");
    if (file.size > maxBytes) throw new Error(`Ukuran gambar maksimal ${maxMB} MB`);
  }

  return await uploadToBucket(bucket, file);
}
