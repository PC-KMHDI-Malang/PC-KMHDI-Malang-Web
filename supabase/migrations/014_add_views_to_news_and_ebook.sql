-- Migration 014: Tambah kolom "views" untuk menghitung berapa kali artikel & e-book sudah dilihat.
ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "views" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Ebook" ADD COLUMN IF NOT EXISTS "views" INTEGER NOT NULL DEFAULT 0;
