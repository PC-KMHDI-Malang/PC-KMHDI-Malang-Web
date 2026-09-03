-- 0. Hapus skema lama untuk reset (Karena masih dalam tahap development awal)
DROP TABLE IF EXISTS "News", "Event", "Gallery", "Category", "User", "Ebook" CASCADE;
DROP TYPE IF EXISTS "Role", "NewsStatus" CASCADE;

-- 1. Buat tipe data ENUM
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');
CREATE TYPE "NewsStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- 2. Buat tabel User
CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Buat tabel Category
CREATE TABLE "Category" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Buat tabel News
CREATE TABLE "News" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "excerpt" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "coverImage" TEXT NOT NULL,
  "status" "NewsStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP WITH TIME ZONE,
  "authorId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "authorName" TEXT,
  "categoryId" UUID NOT NULL REFERENCES "Category"("id") ON DELETE CASCADE,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Buat tabel Event
CREATE TABLE "Event" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "coverImage" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Buat tabel Gallery
CREATE TABLE "Gallery" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "coverImage" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Buat tabel Ebook
CREATE TABLE "Ebook" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "genre" TEXT NOT NULL DEFAULT 'Lainnya',
  "coverImage" TEXT NOT NULL,
  "driveLink" TEXT NOT NULL,
  "publishYear" INTEGER,
  "publisher" TEXT NOT NULL DEFAULT 'PP KMHDI',
  "likes" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Insert Akun Admin Pertama
-- Password default adalah: admin123
INSERT INTO "User" ("name", "email", "password", "role") 
VALUES (
  'Admin KMHDI', 
  'pc.malang@kmhdi.org', 
  '$2b$10$1skPJ9ClANVk3RLosobcne1s7xJLAEzCt5GXGyapTIzamqbxmeVd6', 
  'ADMIN'
);

---------------------------------------------------------------------
-- 9. Row Level Security (RLS) Setup
---------------------------------------------------------------------
-- Mengaktifkan RLS pada semua tabel
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "News" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Gallery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ebook" ENABLE ROW LEVEL SECURITY;

-- Tabel User DILARANG BACA/TULIS OLEH PUBLIK (Tidak ada policy untuk Anon).

-- Izinkan publik (Anon Key) membaca tabel konten
CREATE POLICY "Public can read categories" ON "Category" FOR SELECT USING (true);
CREATE POLICY "Public can read news" ON "News" FOR SELECT USING (true);
CREATE POLICY "Public can read events" ON "Event" FOR SELECT USING (true);
CREATE POLICY "Public can read gallery" ON "Gallery" FOR SELECT USING (true);
CREATE POLICY "Public can read ebooks" ON "Ebook" FOR SELECT USING (true);
