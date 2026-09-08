-- Migration 023: Pembatas percobaan login.
--
-- Sebelumnya form login tidak punya rem sama sekali: percobaan password salah bisa dikirim
-- terus-menerus tanpa batas (terukur ~3 percobaan/detik dari satu koneksi, dan bisa dilipatkan
-- dengan koneksi paralel). Satu-satunya penghambat cuma biaya hitung bcrypt.
--
-- Tabelnya di database, bukan di memori proses, karena aplikasi ini berjalan serverless: tiap
-- request bisa dilayani instance yang berbeda, jadi hitungan di memori tidak akan nyambung.
CREATE TABLE IF NOT EXISTS "LoginAttempt" (
  -- Diisi dua macam kunci: "email:<alamat>" untuk serangan yang membidik satu akun, dan
  -- "ip:<alamat>" untuk yang menyapu banyak akun sekaligus dari satu sumber.
  "identifier" TEXT PRIMARY KEY,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "firstFailedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "lockedUntil" TIMESTAMPTZ
);

-- Untuk pembersihan berkala baris lama.
CREATE INDEX IF NOT EXISTS "LoginAttempt_firstFailedAt_idx" ON "LoginAttempt" ("firstFailedAt");

-- Tanpa policy: hanya service role di server yang boleh menyentuhnya. Kalau kunci anon bisa
-- menghapus barisnya, pembatas ini bisa direset sendiri oleh penyerang.
ALTER TABLE "LoginAttempt" ENABLE ROW LEVEL SECURITY;
