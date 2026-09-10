-- Migration 024: Buat tabel PopupAd (pop-up "iklan"/pengumuman yang tampil saat pertama buka web)

-- Tabel tunggal (single row), sama seperti StatisticSection — cukup satu konfigurasi aktif
-- untuk seluruh situs, bukan daftar yang bisa bertambah banyak.
CREATE TABLE IF NOT EXISTS "PopupAd" (
  "id" INTEGER PRIMARY KEY DEFAULT 1,
  "imageUrl" TEXT,
  "linkUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "popup_ad_single_row" CHECK ("id" = 1)
);

INSERT INTO "PopupAd" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "PopupAd" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read popup ad" ON "PopupAd" FOR SELECT USING (true);

-- Bucket khusus untuk gambar poster pop-up
insert into storage.buckets (id, name, public)
values ('popup-ads', 'popup-ads', true)
on conflict (id) do nothing;
