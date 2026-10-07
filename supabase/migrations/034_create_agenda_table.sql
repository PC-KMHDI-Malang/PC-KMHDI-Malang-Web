-- Migration 034: Tabel "Agenda" untuk kalender organisasi (halaman /agenda dan /agenda/kelola).
-- Agenda KHUSUS ANGGOTA: halaman /agenda wajib login dan tidak dibuka ke publik.
--
-- Tabel "Event" lama di schema.sql SENGAJA tidak dipakai ulang: kolom description/location/
-- endDate-nya NOT NULL (agenda bisa sepanjang hari atau belum punya lokasi), dan policy
-- "Public can read events" membuka SEMUA baris ke anon — bertentangan dengan status DRAFT dan
-- sifat agenda yang khusus anggota. Tabel "Event" dibiarkan apa adanya.
--
-- Akses sepenuhnya lewat service-role (supabaseAdmin), sama seperti tabel "User": RLS dinyalakan
-- TANPA policy, jadi anon/authenticated tidak bisa membaca apa pun langsung dari Supabase. Siapa
-- yang boleh membuka halamannya ditentukan di kode (lib/auth.ts authorized() + pengecekan sesi).
--
-- Tidak ada ALTER TYPE di file ini, jadi aman dijalankan bersama query lain (tidak seperti 033).

CREATE TABLE IF NOT EXISTS "Agenda" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  -- RAPAT | KEGIATAN | DEADLINE | LAINNYA
  "kind" TEXT NOT NULL DEFAULT 'KEGIATAN',
  "startAt" TIMESTAMPTZ NOT NULL,
  "endAt" TIMESTAMPTZ,
  "allDay" BOOLEAN NOT NULL DEFAULT false,
  -- Lokasi (mis. "Sekretariat PC KMHDI Malang").
  "location" TEXT,
  -- Tautan rapat daring, nomor ruang, dsb.
  "locationDetail" TEXT,
  -- Catatan untuk peserta.
  "internalNote" TEXT,
  -- DRAFT tidak muncul di mana pun selain halaman sekretaris. PUBLISHED memicu notifikasi.
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  -- Siapa yang diberi notifikasi: SEMUA anggota, atau hanya anggota bidang di "audienceBidang".
  "audience" TEXT NOT NULL DEFAULT 'SEMUA',
  "audienceBidang" TEXT[],
  "coverImage" TEXT,
  "createdBy" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Batas nilai di level database, supaya data tetap sehat walau ada yang menulis di luar aplikasi.
  CONSTRAINT "Agenda_kind_check" CHECK ("kind" IN ('RAPAT', 'KEGIATAN', 'DEADLINE', 'LAINNYA')),
  CONSTRAINT "Agenda_status_check" CHECK ("status" IN ('DRAFT', 'PUBLISHED')),
  CONSTRAINT "Agenda_audience_check" CHECK ("audience" IN ('SEMUA', 'BIDANG')),
  CONSTRAINT "Agenda_end_after_start_check" CHECK ("endAt" IS NULL OR "endAt" >= "startAt")
);

-- Halaman kalender mengambil agenda per rentang bulan, dan hanya yang PUBLISHED.
CREATE INDEX IF NOT EXISTS "Agenda_startAt_idx" ON "Agenda" ("startAt");
CREATE INDEX IF NOT EXISTS "Agenda_status_startAt_idx" ON "Agenda" ("status", "startAt");

ALTER TABLE "Agenda" ENABLE ROW LEVEL SECURITY;
