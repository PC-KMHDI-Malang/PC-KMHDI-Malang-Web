import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const buckets = ["news-covers", "ebook-covers", "gallery-photos"];
  let results = [];

  for (const bucket of buckets) {
    const { data, error } = await supabaseAdmin.storage.getBucket(bucket);

    if (error && error.message.includes("not found")) {
      const { data: createData, error: createError } = await supabaseAdmin.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
      });

      if (createError) {
        results.push({ bucket, status: "error", error: createError.message });
      } else {
        results.push({ bucket, status: "created" });
      }
    } else if (data) {
      await supabaseAdmin.storage.updateBucket(bucket, { public: true });
      results.push({ bucket, status: "already_exists_and_updated" });
    } else {
      results.push({ bucket, status: "error", error: error.message });
    }
  }

  return NextResponse.json(results);
}
