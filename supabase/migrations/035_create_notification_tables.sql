-- Migration 035: Tabel notifikasi agenda — "Notification" (lonceng di navbar) dan
-- "NotificationDelivery" (catatan pengiriman supaya tidak pernah terkirim dobel).
--
-- Butuh migrasi 034 (tabel "Agenda") sudah dijalankan lebih dulu: kedua tabel di bawah
-- mereferensikannya. Tidak ada ALTER TYPE, jadi aman dijalankan bersama query lain.
--
-- Seperti tabel lain di project ini, RLS dinyalakan TANPA policy: semua akses lewat service-role
-- (supabaseAdmin). Yang membatasi anggota hanya melihat notifikasinya sendiri adalah kode
-- (app/actions/notification.ts selalu memfilter "userId" dari sesi, bukan dari input klien).

-- Satu baris per anggota per notifikasi — isi lonceng di navbar.
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "agendaId" UUID REFERENCES "Agenda"("id") ON DELETE CASCADE,
  -- CREATED | UPDATED | REMINDER_H1
  "reason" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  -- Path relatif (mis. /agenda/rapat-pleno-ab12c). Domain ditambahkan saat ditampilkan, karena
  -- lonceng muncul di domain publik maupun domain sistem.
  "url" TEXT,
  "readAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Query lonceng: notifikasi milik satu user, belum dibaca dulu, terbaru dulu.
CREATE INDEX IF NOT EXISTS "Notification_user_unread_idx"
  ON "Notification" ("userId", "readAt", "createdAt" DESC);

ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- Buku catatan pengiriman. Sebelum mengirim lewat suatu kanal, dispatcher "mengklaim" satu baris
-- di sini; UNIQUE di bawah menjamin dua proses yang berjalan bersamaan (mis. cron yang terpanggil
-- dua kali) tidak bisa sama-sama mengklaim penerima yang sama, jadi tidak ada pengiriman dobel.
CREATE TABLE IF NOT EXISTS "NotificationDelivery" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "agendaId" UUID NOT NULL REFERENCES "Agenda"("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  -- INAPP | EMAIL (nanti bisa WHATSAPP, dst. tanpa ubah tabel)
  "channel" TEXT NOT NULL,
  -- Kunci idempotensi, BUKAN sekadar jenis notifikasi: "CREATED", "UPDATED:<updatedAt>",
  -- "REMINDER_H1:<tanggal mulai>". Dengan begitu agenda yang diubah dua kali tetap memberi dua
  -- notifikasi "diperbarui", dan agenda yang jadwalnya digeser mendapat pengingat H-1 yang baru.
  "reason" TEXT NOT NULL,
  -- PENDING = sedang dikirim, SENT = berhasil, FAILED = gagal (boleh dicoba ulang)
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "error" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "sentAt" TIMESTAMPTZ,
  CONSTRAINT "NotificationDelivery_unique" UNIQUE ("agendaId", "userId", "channel", "reason"),
  CONSTRAINT "NotificationDelivery_status_check" CHECK ("status" IN ('PENDING', 'SENT', 'FAILED'))
);

ALTER TABLE "NotificationDelivery" ENABLE ROW LEVEL SECURITY;
