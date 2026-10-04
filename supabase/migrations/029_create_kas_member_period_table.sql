-- Migration 029: Periode iuran per anggota (anggota yang masuk / keluar di tengah periode).
--
-- Satu baris per anggota yang periodenya berbeda dari periode umum di KasSetting:
--   startPeriod : bulan pertama anggota ini ditagih iuran (kosong = ikut awal periode umum)
--   endPeriod   : bulan terakhir anggota ini ditagih iuran (kosong = ikut akhir periode umum)
-- Bulan di luar rentang ini tidak ditagih & tidak dihitung tunggakan untuk anggota tersebut.
-- Anggota tanpa baris di sini mengikuti periode umum sepenuhnya. Diatur bendahara dari matriks
-- Iuran Anggota (klik nama anggota).
CREATE TABLE IF NOT EXISTS "KasMemberPeriod" (
  "userId" UUID PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
  "startPeriod" TEXT CHECK ("startPeriod" IS NULL OR "startPeriod" ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  "endPeriod" TEXT CHECK ("endPeriod" IS NULL OR "endPeriod" ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "KasMemberPeriod_range" CHECK ("startPeriod" IS NULL OR "endPeriod" IS NULL OR "startPeriod" <= "endPeriod")
);

-- Sama seperti tabel kas lain: tanpa policy, hanya bisa diakses lewat service role di server.
ALTER TABLE "KasMemberPeriod" ENABLE ROW LEVEL SECURITY;
