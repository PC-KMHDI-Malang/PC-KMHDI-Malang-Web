-- Migration 022: Catatan "siapa menyukai apa".
--
-- Sebelumnya tombol suka cuma menaikkan/menurunkan kolom "likes", dan satu-satunya penanda
-- "saya sudah menyukai ini" ada di localStorage browser. Artinya angkanya tidak bisa dipercaya:
-- toggleLikeAction adalah endpoint HTTP publik, jadi request dari luar UI bisa menaikkan angka
-- berkali-kali tanpa login sama sekali, dan pengunjung biasa pun bisa menyukai berulang kali
-- cukup dengan membersihkan localStorage.
--
-- Dengan tabel ini, satu akun hanya bisa menyukai satu artikel/e-book satu kali (dijamin oleh
-- indeks unik di bawah, bukan oleh kode aplikasi), dan kolom "likes" cuma ikut berubah kalau
-- baris di sini memang benar-benar bertambah/berkurang.
CREATE TABLE IF NOT EXISTS "Like" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "targetType" TEXT NOT NULL CHECK ("targetType" IN ('news', 'ebook')),
  "targetId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kunci sebenarnya dari fitur ini: mustahil ada dua baris suka untuk kombinasi yang sama.
CREATE UNIQUE INDEX IF NOT EXISTS "Like_user_target_key" ON "Like" ("userId", "targetType", "targetId");

-- Dipakai saat halaman detail menanyakan "apakah pengguna ini sudah menyukainya".
CREATE INDEX IF NOT EXISTS "Like_target_idx" ON "Like" ("targetType", "targetId");

-- Tanpa policy apa pun: tabel ini hanya boleh disentuh lewat service role di server, sama
-- seperti tabel "User". Kunci anon yang terekspos di browser tidak bisa membaca maupun menulis.
ALTER TABLE "Like" ENABLE ROW LEVEL SECURITY;
