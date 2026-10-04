import { S3Client } from "@aws-sdk/client-s3";

// Cloudflare R2 memakai API yang sama dengan Amazon S3, jadi cukup S3Client dengan endpoint R2.
// Client dibuat malas (saat pertama dipakai), bukan di level modul: tanpa env R2 (mis. di
// laptop yang belum diisi, atau unit test) modul ini tetap aman di-import, dan lib/storage.ts
// otomatis jatuh kembali ke Supabase Storage lewat isR2Configured().

export const R2_PUBLIC_BUCKET = process.env.R2_PUBLIC_BUCKET ?? "";
export const R2_PRIVATE_BUCKET = process.env.R2_PRIVATE_BUCKET ?? "";

// Domain publik bucket gambar (custom domain di Cloudflare, mis. https://media.kmhdimalang.org).
// Pakai prefix NEXT_PUBLIC_ karena SafeImage (komponen client) juga perlu tahu host ini.
export const R2_PUBLIC_URL = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(/\/+$/, "");

export function isR2Configured(): boolean {
  return !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && R2_PUBLIC_BUCKET && R2_PRIVATE_BUCKET && R2_PUBLIC_URL);
}

let client: S3Client | null = null;

export function r2Client(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      // AWS SDK versi baru otomatis menambahkan checksum CRC32 ke setiap request. Untuk presigned
      // URL upload (lib/storage.ts → createR2UploadUrl) itu berarti checksum dari body KOSONG
      // ikut tertanam di URL, sehingga upload dari browser ditolak. Checksum cukup dihitung
      // saat memang diwajibkan (mis. DeleteObjects).
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return client;
}
