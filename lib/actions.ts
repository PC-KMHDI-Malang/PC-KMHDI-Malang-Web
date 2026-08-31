"use server";

import { uploadToBucket } from "./storage";

export async function uploadFileAction(formData: FormData) {
  const file = formData.get("file") as File;
  const bucket = formData.get("bucket") as string;
  if (!file || !bucket) throw new Error("File or bucket missing");

  return await uploadToBucket(bucket, file);
}
