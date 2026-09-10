import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { BUCKET_FILE_SIZE_LIMITS } from "@/lib/storage";

// Bucket ini sengaja privat (lihat migrations/016_make_ebook_files_bucket_private.sql) —
// file PDF cuma boleh diakses lewat signed URL yang diverifikasi server (lib/storage.ts).
// Jangan pernah dipaksa public:true dari sini, apa pun yang terjadi ke bucket lain.
const PRIVATE_BUCKETS = new Set(["ebook-files"]);

// Batas ukuran per file dibaca dari BUCKET_FILE_SIZE_LIMITS (lib/storage.ts) — satu-satunya
// sumber, dipakai juga oleh gerbang validasi upload sebenarnya di lib/actions.ts. Dulu daftar
// ini punya angkanya sendiri secara terpisah, dan gampang lupa disamakan saat salah satu diubah.
const FILE_SIZE_LIMITS = BUCKET_FILE_SIZE_LIMITS;

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
