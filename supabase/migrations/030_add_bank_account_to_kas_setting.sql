-- Migration 030: Rekening tujuan pembayaran iuran diatur bendahara (Kelola Kas → Pengaturan).
--
-- Ditampilkan ke anggota di halaman Uang Kas (kartu "Bayar Iuran" & form "Upload Bukti
-- Pembayaran") lengkap dengan tombol salin nomor rekening. Kalau nomor rekening dikosongkan,
-- kartu rekening tidak ditampilkan.
ALTER TABLE "KasSetting" ADD COLUMN IF NOT EXISTS "bankName" TEXT;
ALTER TABLE "KasSetting" ADD COLUMN IF NOT EXISTS "bankAccountNumber" TEXT;
ALTER TABLE "KasSetting" ADD COLUMN IF NOT EXISTS "bankAccountHolder" TEXT;

-- Isi awal dengan rekening yang sebelumnya tertulis langsung di kode (hanya kalau belum diisi).
UPDATE "KasSetting"
SET "bankName" = 'SeaBank', "bankAccountNumber" = '901643108142', "bankAccountHolder" = 'Ni Luh Putu Kayla Padma Dewi'
WHERE "id" = 1 AND "bankAccountNumber" IS NULL AND "bankName" IS NULL;
