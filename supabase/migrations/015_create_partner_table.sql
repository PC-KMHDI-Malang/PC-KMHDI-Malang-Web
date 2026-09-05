-- Migration 015: Buat tabel Partner (mitra/kolaborasi) & bucket logo mitra

CREATE TABLE IF NOT EXISTS "Partner" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "logoUrl" TEXT NOT NULL,
  "websiteUrl" TEXT,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_partner_order" ON "Partner"("orderIndex");

ALTER TABLE "Partner" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read partners" ON "Partner" FOR SELECT USING (true);

-- Bucket khusus untuk logo mitra
insert into storage.buckets (id, name, public)
values ('partner-logos', 'partner-logos', true)
on conflict (id) do nothing;
