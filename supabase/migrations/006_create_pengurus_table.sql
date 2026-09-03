-- Migration 006: Buat Tabel Pengurus Organisasi PC KMHDI Malang
CREATE TABLE IF NOT EXISTS "Pengurus" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "department" TEXT NOT NULL, -- 'bph', 'organisasi', 'kaderisasi', 'litbang', 'sosmas', 'ddi'
  "level" TEXT NOT NULL DEFAULT 'staf', -- 'bph_inti', 'bph_wakil', 'kabiro', 'staf'
  "campus" TEXT NOT NULL,
  "major" TEXT NOT NULL,
  "imageUrl" TEXT,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "period" TEXT NOT NULL DEFAULT '2024 - 2026',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pencarian dan pengurutan
CREATE INDEX IF NOT EXISTS "idx_pengurus_department" ON "Pengurus"("department");
CREATE INDEX IF NOT EXISTS "idx_pengurus_order" ON "Pengurus"("orderIndex");
CREATE INDEX IF NOT EXISTS "idx_pengurus_level" ON "Pengurus"("level");

