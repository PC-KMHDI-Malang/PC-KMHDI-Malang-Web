-- Migration 012: Tambah kolom caption Hero (badge angka di bawah lambang) ke tabel StatisticSection
-- agar "Tahun Pengabdian" & "Kader Aktif" di Hero juga bisa dikelola admin di /admin/statistics.
ALTER TABLE "StatisticSection" ADD COLUMN IF NOT EXISTS "heroCaptionValue1" TEXT NOT NULL DEFAULT '35+';
ALTER TABLE "StatisticSection" ADD COLUMN IF NOT EXISTS "heroCaptionLabel1" TEXT NOT NULL DEFAULT 'Tahun Pengabdian';
ALTER TABLE "StatisticSection" ADD COLUMN IF NOT EXISTS "heroCaptionValue2" TEXT NOT NULL DEFAULT '500+';
ALTER TABLE "StatisticSection" ADD COLUMN IF NOT EXISTS "heroCaptionLabel2" TEXT NOT NULL DEFAULT 'Kader Aktif';
