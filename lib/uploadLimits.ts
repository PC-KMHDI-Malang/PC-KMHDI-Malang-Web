// Batas ukuran upload — satu-satunya sumber angka, dipakai oleh validasi di browser (ImagePicker,
// FilePicker, RichTextEditor, modal pengurus) DAN gerbang validasi sebenarnya di server
// (lib/actions.ts). Sengaja file murni tanpa import server (supabase/aws-sdk) supaya aman
// di-import komponen client.
//
// Upload berjalan langsung dari browser ke Cloudflare R2 lewat presigned URL (lihat
// lib/uploadClient.ts), jadi tidak lagi terikat batas body request Vercel 4.5 MB — itu
// sebabnya PDF bisa sampai 10 MB.
export const MAX_IMAGE_MB = 3;
export const MAX_PDF_MB = 10;

// Batas jalur cadangan (upload lewat Server Action, dipakai kalau R2 belum dikonfigurasi atau
// upload langsung diblokir CORS, mis. di domain preview). Body request ke Vercel dibatasi
// 4.5 MB secara keras, jadi file di atas angka ini tidak bisa lewat jalur cadangan.
export const SERVER_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

export const STORAGE_BUCKETS = {
  news: "news-covers",
  ebook: "ebook-covers",
  gallery: "gallery-photos",
  ebookFiles: "ebook-files",
  articleImages: "article-images",
  partnerLogos: "partner-logos",
  organizationPhotos: "organization-photos",
  popupAds: "popup-ads",
} as const;

const MB = 1024 * 1024;

export const BUCKET_FILE_SIZE_LIMITS: Record<string, number> = {
  [STORAGE_BUCKETS.news]: MAX_IMAGE_MB * MB,
  [STORAGE_BUCKETS.ebook]: MAX_IMAGE_MB * MB,
  [STORAGE_BUCKETS.gallery]: MAX_IMAGE_MB * MB,
  [STORAGE_BUCKETS.partnerLogos]: MAX_IMAGE_MB * MB,
  [STORAGE_BUCKETS.articleImages]: MAX_IMAGE_MB * MB,
  [STORAGE_BUCKETS.organizationPhotos]: MAX_IMAGE_MB * MB,
  [STORAGE_BUCKETS.popupAds]: MAX_IMAGE_MB * MB,
  [STORAGE_BUCKETS.ebookFiles]: MAX_PDF_MB * MB,
};

export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// Bukti pembayaran iuran kas yang diunggah anggota (lihat app/actions/kas.ts). Sengaja TIDAK
// dimasukkan ke STORAGE_BUCKETS: daftar itu dipakai upload panel admin, sedangkan bukti kas
// diunggah anggota biasa lewat action-nya sendiri. Disimpan di bucket R2 privat — hanya pemilik
// iuran dan bendahara yang bisa membukanya (app/(public)/kas/bukti/[id]/route.ts).
export const KAS_PROOF_BUCKET = "kas-proofs";
export const MAX_PROOF_MB = MAX_IMAGE_MB;
export const KAS_PROOF_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
