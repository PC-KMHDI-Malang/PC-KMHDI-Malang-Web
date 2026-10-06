-- Migration 031: Bendahara bisa menyimpan LEBIH DARI SATU rekening tujuan pembayaran iuran.
--
-- Disimpan sebagai daftar JSON di KasSetting."bankAccounts":
--   [{ "bank": "SeaBank", "number": "901643108142", "holder": "Ni Luh Putu Kayla Padma Dewi" }, ...]
-- Urutan daftar = urutan tampil ke anggota. Daftar kosong = kartu rekening tidak ditampilkan.
--
-- Kolom rekening tunggal dari migrasi 030 (bankName, bankAccountNumber, bankAccountHolder) tidak
-- dihapus, tapi sudah tidak dipakai lagi — isinya dipindahkan ke daftar baru di bawah.
ALTER TABLE "KasSetting" ADD COLUMN IF NOT EXISTS "bankAccounts" JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE "KasSetting"
SET "bankAccounts" = jsonb_build_array(
  jsonb_build_object('bank', COALESCE("bankName", 'Bank'), 'number', "bankAccountNumber", 'holder', COALESCE("bankAccountHolder", ''))
)
WHERE "id" = 1 AND "bankAccounts" = '[]'::jsonb AND "bankAccountNumber" IS NOT NULL;
