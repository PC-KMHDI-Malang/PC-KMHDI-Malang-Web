-- Migration 028: Akhir periode iuran bisa diatur bendahara (Kelola Kas → Pengaturan).
--
-- Sebelumnya akhir periode selalu dihitung 2 tahun (24 bulan) sejak startPeriod. Sekarang bisa
-- diisi sendiri; kalau kosong (NULL), aplikasi tetap memakai default 2 tahun tersebut
-- (lihat periodEnd di lib/kas.ts). Bulan setelah endPeriod tidak ditagih & tidak dihitung tunggakan.
ALTER TABLE "KasSetting" ADD COLUMN IF NOT EXISTS "endPeriod" TEXT;
ALTER TABLE "KasSetting" DROP CONSTRAINT IF EXISTS "KasSetting_endPeriod_format";
ALTER TABLE "KasSetting" ADD CONSTRAINT "KasSetting_endPeriod_format" CHECK ("endPeriod" IS NULL OR "endPeriod" ~ '^\d{4}-(0[1-9]|1[0-2])$');
