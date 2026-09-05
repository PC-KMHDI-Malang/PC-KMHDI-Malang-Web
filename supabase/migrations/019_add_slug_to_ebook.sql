-- Migration 019: Tambah kolom "slug" ke tabel Ebook, supaya URL e-book bisa pakai judul
-- (mis. /e-book/pedoman-kt-1-2025) alih-alih UUID mentah (/buku/29328dd3-e597-...).
-- Keunikan slug dijaga di level aplikasi (lihat lib/slug.ts), sama seperti kolom "slug" di
-- tabel News — bukan lewat UNIQUE constraint di sini, supaya backfill baris lama di bawah
-- tidak bisa gagal kalau ada judul yang kebetulan sama persis.

ALTER TABLE "Ebook" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- Backfill baris yang sudah ada dari judulnya, dengan aturan slugify yang sama persis dengan
-- fungsi slugify() di lib/slug.ts (huruf kecil, spasi jadi "-", buang karakter selain huruf/angka/"-").
UPDATE "Ebook"
SET "slug" = lower(regexp_replace(regexp_replace(trim(title), '\s+', '-', 'g'), '[^a-zA-Z0-9_-]+', '', 'g'))
WHERE "slug" IS NULL OR "slug" = '';

CREATE INDEX IF NOT EXISTS "idx_ebook_slug" ON "Ebook"("slug");
