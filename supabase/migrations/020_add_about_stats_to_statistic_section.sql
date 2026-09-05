-- Migration 020: Tambah 4 kolom pasangan nilai+label ke StatisticSection untuk strip statistik
-- ringkas di section "Tentang" beranda (mis. "12+ Komisariat", "500+ Anggota") — sebelumnya cuma
-- ada di data/about.ts (statis, tidak bisa dikelola admin). Pola sama persis dengan migrasi 012
-- (heroCaption*) supaya konsisten: bukan lewat UNIQUE constraint, cukup nilai default yang
-- sekarang sudah tampil di beranda supaya backfill baris lama tidak berubah tampilannya.
ALTER TABLE "StatisticSection" ADD COLUMN IF NOT EXISTS "aboutStatValue1" TEXT NOT NULL DEFAULT '12+';
ALTER TABLE "StatisticSection" ADD COLUMN IF NOT EXISTS "aboutStatLabel1" TEXT NOT NULL DEFAULT 'Komisariat';
ALTER TABLE "StatisticSection" ADD COLUMN IF NOT EXISTS "aboutStatValue2" TEXT NOT NULL DEFAULT '500+';
ALTER TABLE "StatisticSection" ADD COLUMN IF NOT EXISTS "aboutStatLabel2" TEXT NOT NULL DEFAULT 'Anggota';
ALTER TABLE "StatisticSection" ADD COLUMN IF NOT EXISTS "aboutStatValue3" TEXT NOT NULL DEFAULT '35+';
ALTER TABLE "StatisticSection" ADD COLUMN IF NOT EXISTS "aboutStatLabel3" TEXT NOT NULL DEFAULT 'Program';
ALTER TABLE "StatisticSection" ADD COLUMN IF NOT EXISTS "aboutStatValue4" TEXT NOT NULL DEFAULT '1993';
ALTER TABLE "StatisticSection" ADD COLUMN IF NOT EXISTS "aboutStatLabel4" TEXT NOT NULL DEFAULT 'Tahun Berdiri';
