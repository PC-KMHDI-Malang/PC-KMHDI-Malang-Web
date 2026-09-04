-- Migration 011: Buat Tabel Statistic & StatisticSection agar bagian "Pencapaian" di beranda bisa dikelola admin

-- Tabel kartu-kartu angka statistik (mis. "500+ Anggota Aktif")
CREATE TABLE IF NOT EXISTS "Statistic" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "value" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "icon" TEXT NOT NULL DEFAULT 'Users',
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_statistic_order" ON "Statistic"("orderIndex");

-- Tabel tunggal (single row) untuk badge, judul, & deskripsi section statistik
CREATE TABLE IF NOT EXISTS "StatisticSection" (
  "id" INTEGER PRIMARY KEY DEFAULT 1,
  "badge" TEXT NOT NULL DEFAULT 'Pencapaian',
  "title" TEXT NOT NULL DEFAULT 'Bertumbuh Bersama Mahasiswa Hindu Malang Raya',
  "description" TEXT NOT NULL DEFAULT 'Selama bertahun-tahun PC KMHDI Malang terus berkembang melalui kaderisasi, kolaborasi, serta berbagai program yang memberikan dampak nyata bagi mahasiswa maupun masyarakat.',
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "statistic_section_single_row" CHECK ("id" = 1)
);

INSERT INTO "StatisticSection" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING;

-- RLS: publik hanya boleh membaca, penulisan hanya lewat service role (admin)
ALTER TABLE "Statistic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StatisticSection" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read statistics" ON "Statistic" FOR SELECT USING (true);
CREATE POLICY "Public can read statistic section" ON "StatisticSection" FOR SELECT USING (true);
