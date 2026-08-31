import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function setupBuckets() {
  const buckets = ["news-covers", "ebook-covers", "gallery-photos"];

  for (const bucket of buckets) {
    console.log(`Checking bucket: ${bucket}...`);
    const { data, error } = await supabase.storage.getBucket(bucket);

    if (error && error.message.includes("not found")) {
      console.log(`Creating bucket: ${bucket}...`);
      const { data: createData, error: createError } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
      });

      if (createError) {
        console.error(`Failed to create ${bucket}:`, createError);
      } else {
        console.log(`Successfully created ${bucket}!`);
      }
    } else if (data) {
      console.log(`Bucket ${bucket} already exists.`);

      // Ensure it's public
      await supabase.storage.updateBucket(bucket, {
        public: true,
      });
      console.log(`Bucket ${bucket} is set to public.`);
    } else {
      console.error(`Error checking ${bucket}:`, error);
    }
  }
}

setupBuckets();
