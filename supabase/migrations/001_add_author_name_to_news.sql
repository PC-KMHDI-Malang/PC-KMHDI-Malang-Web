-- Menambahkan kolom authorName ke tabel News agar admin bisa mengetik nama penulis
-- secara manual (menimpa nama akun User) tanpa perlu membuat akun baru.
ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "authorName" TEXT;
