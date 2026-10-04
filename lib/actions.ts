"use server";

import { uploadToBucket, createR2UploadUrl } from "./storage";
import { requireAdminPanel } from "./guard";
import { isR2Configured } from "./r2";
import { ALLOWED_IMAGE_TYPES, BUCKET_FILE_SIZE_LIMITS, SERVER_UPLOAD_MAX_BYTES, STORAGE_BUCKETS } from "./uploadLimits";

// Hanya bucket yang memang dipakai panel admin. Tanpa daftar ini, `bucket` datang mentah dari
// FormData: request di luar UI bisa menyebut bucket apa pun yang ada di storage.
const ALLOWED_BUCKETS = new Set<string>(Object.values(STORAGE_BUCKETS));

// Gerbang validasi yang sebenarnya untuk kedua jalur upload (langsung ke R2 maupun lewat server).
// BUCKET_FILE_SIZE_LIMITS (lib/uploadLimits.ts) adalah satu-satunya sumber batas ukuran —
// validasi di ImagePicker/FilePicker cuma menampilkan pesan lebih awal di browser.
function validateUpload(bucket: unknown, contentType: string, size: number): asserts bucket is string {
  if (!Number.isFinite(size) || size <= 0) throw new Error("File tidak valid");
  if (typeof bucket !== "string" || !ALLOWED_BUCKETS.has(bucket)) throw new Error("Bucket tidak dikenal");

  const maxBytes = BUCKET_FILE_SIZE_LIMITS[bucket] ?? 1 * 1024 * 1024;
  const maxMB = Math.round(maxBytes / (1024 * 1024));

  if (bucket === STORAGE_BUCKETS.ebookFiles) {
    if (contentType !== "application/pdf") throw new Error("File harus berformat PDF");
    if (size > maxBytes) throw new Error(`Ukuran PDF maksimal ${maxMB} MB`);
  } else {
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) throw new Error("File harus berupa gambar (JPG, PNG, WebP, atau GIF)");
    if (size > maxBytes) throw new Error(`Ukuran gambar maksimal ${maxMB} MB`);
  }
}

// Jalur cadangan: file dikirim ke server lalu diteruskan ke storage. Dipakai kalau R2 belum
// dikonfigurasi, atau upload langsung ke R2 diblokir (lihat lib/uploadClient.ts). Body request
// ke Vercel dibatasi 4.5 MB, jadi jalur ini hanya untuk file kecil.
export async function uploadFileAction(formData: FormData) {
  // Action ini menulis ke storage pakai kunci server — tanpa pemeriksaan sesi di sini,
  // siapa pun yang tahu action ID-nya bisa mengisi bucket sampai kuota habis.
  await requireAdminPanel();

  const file = formData.get("file");
  const bucket = formData.get("bucket");

  if (!(file instanceof File) || file.size === 0) throw new Error("File tidak valid");
  validateUpload(bucket, file.type, file.size);
  if (file.size > SERVER_UPLOAD_MAX_BYTES) throw new Error("File terlalu besar untuk diunggah lewat server.");

  return await uploadToBucket(bucket, file);
}

export type UploadTarget = { mode: "direct"; uploadUrl: string; headers: Record<string, string>; fileUrl: string } | { mode: "server" };

// Jalur utama: server memvalidasi jenis & ukuran file, lalu memberi link upload sementara ke R2.
// File-nya sendiri dikirim browser langsung ke R2 — tidak lewat Vercel, jadi tidak terkena batas
// 4.5 MB. Sama seperti uploadFileAction, hanya akun panel admin yang boleh meminta link ini.
export async function createUploadUrlAction(input: { bucket: string; fileName: string; contentType: string; size: number }): Promise<UploadTarget> {
  await requireAdminPanel();
  validateUpload(input.bucket, input.contentType, input.size);

  if (!isR2Configured()) return { mode: "server" };

  const target = await createR2UploadUrl(input.bucket, String(input.fileName || ""), input.contentType, input.size);
  return { mode: "direct", ...target };
}
