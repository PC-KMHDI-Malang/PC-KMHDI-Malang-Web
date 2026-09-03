-- Migration 007: Menambahkan kolom instagram ke tabel Pengurus
ALTER TABLE "Pengurus" ADD COLUMN IF NOT EXISTS "instagram" TEXT;
