-- Migration 027: Log transaksi uang kas untuk bendahara.
--
-- Setiap kejadian pada iuran dicatat sebagai satu baris dan TIDAK pernah diubah lagi, jadi
-- riwayatnya tetap utuh walau baris KasIuran-nya kemudian diedit, ditolak lalu diunggah ulang,
-- atau dibatalkan. Ditulis oleh Server Action di app/actions/kas.ts.
--   DICATAT      : bendahara mencatat pembayaran langsung (mis. tunai)
--   DIKIRIM      : anggota mengunggah bukti pembayaran (menunggu konfirmasi)
--   DIKONFIRMASI : bendahara mengonfirmasi bukti → sudah bayar
--   DITOLAK      : bendahara menolak bukti (alasan di kolom note)
--   DIUBAH       : bendahara mengedit nominal/tanggal/status catatan iuran
--   DIBATALKAN   : bendahara membatalkan catatan iuran (kembali belum bayar)
CREATE TABLE IF NOT EXISTS "KasLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "action" TEXT NOT NULL CHECK ("action" IN ('DICATAT', 'DIKIRIM', 'DIKONFIRMASI', 'DITOLAK', 'DIUBAH', 'DIBATALKAN')),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "periods" TEXT[] NOT NULL,
  "amount" INTEGER NOT NULL DEFAULT 0,
  "note" TEXT
);

CREATE INDEX IF NOT EXISTS "KasLog_createdAt_idx" ON "KasLog" ("createdAt" DESC);

-- Sama seperti tabel kas lain: tanpa policy, hanya bisa diakses lewat service role di server.
ALTER TABLE "KasLog" ENABLE ROW LEVEL SECURITY;

-- Isi awal dari data iuran yang sudah ada (hanya sekali — dilewati kalau log sudah berisi),
-- supaya log tidak kosong untuk pembayaran yang tercatat sebelum fitur ini ada.
INSERT INTO "KasLog" ("createdAt", "action", "userId", "periods", "amount", "note")
SELECT
  COALESCE("reviewedAt", "submittedAt", "createdAt"),
  CASE
    WHEN "status" = 'MENUNGGU' THEN 'DIKIRIM'
    WHEN "status" = 'DITOLAK' THEN 'DITOLAK'
    WHEN "submittedAt" IS NOT NULL THEN 'DIKONFIRMASI'
    ELSE 'DICATAT'
  END,
  "userId",
  ARRAY["period"],
  "amount",
  CASE WHEN "status" = 'DITOLAK' THEN "rejectReason" ELSE "note" END
FROM "KasIuran"
WHERE NOT EXISTS (SELECT 1 FROM "KasLog");
