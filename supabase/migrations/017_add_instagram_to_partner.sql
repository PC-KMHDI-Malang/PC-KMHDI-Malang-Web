-- Migration 017: Tambah kolom Instagram ke tabel Partner (mitra).
-- Kalau diisi, logo mitra di beranda/halaman /mitra akan mengarah ke Instagram ini saat diklik,
-- diprioritaskan di atas Situs Web.
ALTER TABLE "Partner" ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT;
