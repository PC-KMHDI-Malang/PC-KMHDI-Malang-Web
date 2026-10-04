-- Migration 025: Fitur uang kas — iuran bulanan anggota + buku kas organisasi.
--
-- Yang boleh menulis ke ketiga tabel ini cuma akun bendahara (bendahara@kmhdimalang.org), dan
-- itu dijaga di server lewat requireTreasurer() (lib/guard.ts) — bukan lewat RLS. Anggota biasa
-- cuma bisa MELIHAT baris KasIuran miliknya sendiri di halaman /kas.

-- Pengaturan kas (single row, sama seperti PopupAd): nominal iuran per bulan dan bulan pertama
-- iuran mulai berlaku. Bulan sebelum startPeriod tidak dihitung sebagai tunggakan.
CREATE TABLE IF NOT EXISTS "KasSetting" (
  "id" INTEGER PRIMARY KEY DEFAULT 1,
  "monthlyFee" INTEGER NOT NULL DEFAULT 0 CHECK ("monthlyFee" >= 0),
  "startPeriod" TEXT CHECK ("startPeriod" ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "kas_setting_single_row" CHECK ("id" = 1)
);

INSERT INTO "KasSetting" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING;

-- Satu baris = satu bulan iuran yang sudah lunas untuk satu anggota. Nominal disimpan per baris,
-- jadi kalau tarif iuran diubah, riwayat pembayaran lama tetap tercatat sesuai nominal aslinya.
CREATE TABLE IF NOT EXISTS "KasIuran" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "period" TEXT NOT NULL CHECK ("period" ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  "amount" INTEGER NOT NULL CHECK ("amount" > 0),
  "paidAt" DATE NOT NULL DEFAULT CURRENT_DATE,
  "note" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mustahil mencatat satu bulan yang sama dua kali untuk anggota yang sama — dijamin database,
-- bukan cuma oleh kode aplikasi.
CREATE UNIQUE INDEX IF NOT EXISTS "KasIuran_user_period_key" ON "KasIuran" ("userId", "period");
CREATE INDEX IF NOT EXISTS "KasIuran_period_idx" ON "KasIuran" ("period");

-- Buku kas: pemasukan di luar iuran (donasi, sponsor, dll.) dan pengeluaran organisasi.
CREATE TABLE IF NOT EXISTS "KasTransaksi" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" TEXT NOT NULL CHECK ("type" IN ('MASUK', 'KELUAR')),
  "amount" INTEGER NOT NULL CHECK ("amount" > 0),
  "date" DATE NOT NULL DEFAULT CURRENT_DATE,
  "description" TEXT NOT NULL,
  "category" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "KasTransaksi_date_idx" ON "KasTransaksi" ("date" DESC);

-- Tanpa policy apa pun: hanya bisa disentuh lewat service role di server, sama seperti "User"
-- dan "Like". Kunci anon yang terekspos di browser tidak bisa membaca maupun menulis data kas.
ALTER TABLE "KasSetting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KasIuran" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KasTransaksi" ENABLE ROW LEVEL SECURITY;
