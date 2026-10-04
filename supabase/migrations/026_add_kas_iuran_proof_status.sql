-- Migration 026: Anggota bisa mengunggah bukti pembayaran iuran, lalu bendahara mengonfirmasi.
--
-- Status satu baris KasIuran (satu bulan, satu anggota):
--   LUNAS     : sudah dibayar & dikonfirmasi (atau dicatat langsung oleh bendahara)
--   MENUNGGU  : anggota sudah mengunggah bukti, menunggu konfirmasi bendahara
--   DITOLAK   : bukti ditolak bendahara (alasan di rejectReason) — bulan itu kembali dianggap
--               belum dibayar dan anggota boleh mengunggah ulang (baris ini dipakai ulang)
-- Baris yang sudah ada sebelum migrasi ini semuanya dicatat bendahara, jadi otomatis LUNAS.
-- Saldo & total kas hanya menghitung baris LUNAS.

ALTER TABLE "KasIuran" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'LUNAS';
ALTER TABLE "KasIuran" DROP CONSTRAINT IF EXISTS "KasIuran_status_check";
ALTER TABLE "KasIuran" ADD CONSTRAINT "KasIuran_status_check" CHECK ("status" IN ('LUNAS', 'MENUNGGU', 'DITOLAK'));

-- Bukti tersimpan di bucket R2 privat (format r2-private://kas-proofs/<file>), hanya bisa dibuka
-- pemilik iuran dan bendahara lewat /kas/bukti/<id>.
ALTER TABLE "KasIuran" ADD COLUMN IF NOT EXISTS "proofUrl" TEXT;
ALTER TABLE "KasIuran" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMPTZ;
ALTER TABLE "KasIuran" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMPTZ;
ALTER TABLE "KasIuran" ADD COLUMN IF NOT EXISTS "rejectReason" TEXT;

-- Dipakai tab "Konfirmasi" bendahara untuk mengambil semua bukti yang menunggu.
CREATE INDEX IF NOT EXISTS "KasIuran_status_idx" ON "KasIuran" ("status");
