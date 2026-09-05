import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// Bucket ini sengaja privat (lihat migrations/016_make_ebook_files_bucket_private.sql) —
// file PDF cuma boleh diakses lewat signed URL yang diverifikasi server (lib/storage.ts).
// Jangan pernah dipaksa public:true dari sini, apa pun yang terjadi ke bucket lain.
const PRIVATE_BUCKETS = new Set(["ebook-files"]);

// Batas ukuran per file, disamakan persis dengan konfigurasi asli tiap bucket di Supabase
// Dashboard — kalau angka di sini beda dari dashboard, validasi ukuran file di sisi client
// (ImagePicker/FilePicker/RichTextEditor/PengurusModal) juga harus disesuaikan biar tidak ada
// upload yang lolos validasi client tapi ditolak Supabase.
const FILE_SIZE_LIMITS: Record<string, number> = {
  "news-covers": 1 * 1024 * 1024,
  "ebook-covers": 1 * 1024 * 1024,
  "gallery-photos": 1 * 1024 * 1024,
  "partner-logos": 1 * 1024 * 1024,
  "article-images": 1 * 1024 * 1024,
  "organization-photos": 1 * 1024 * 1024,
  "ebook-files": 5 * 1024 * 1024,
};

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buckets = Object.keys(FILE_SIZE_LIMITS);
  const results = [];

  for (const bucket of buckets) {
    const isPrivate = PRIVATE_BUCKETS.has(bucket);
    const fileSizeLimit = FILE_SIZE_LIMITS[bucket];
    const { data, error } = await supabaseAdmin.storage.getBucket(bucket);

    if (error && error.message.includes("not found")) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(bucket, {
        public: !isPrivate,
        fileSizeLimit,
      });

      if (createError) {
        results.push({ bucket, status: "error", error: createError.message });
      } else {
        results.push({ bucket, status: "created", public: !isPrivate, fileSizeLimit });
      }
    } else if (data) {
      if (isPrivate) {
        await supabaseAdmin.storage.updateBucket(bucket, { public: false, fileSizeLimit });
        results.push({ bucket, status: "already_exists_untouched", public: false, fileSizeLimit });
      } else {
        await supabaseAdmin.storage.updateBucket(bucket, { public: true, fileSizeLimit });
        results.push({ bucket, status: "already_exists_and_updated", public: true, fileSizeLimit });
      }
    } else {
      results.push({ bucket, status: "error", error: error?.message });
    }
  }

  return NextResponse.json(results);
}
