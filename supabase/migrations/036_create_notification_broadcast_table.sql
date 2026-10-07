-- Migration 036: Tabel "NotificationBroadcast" — catatan pengiriman untuk kanal yang mengirim SATU
-- pesan ke banyak orang sekaligus (saat ini: grup WhatsApp lewat Fonnte).
--
-- Kenapa tabel terpisah dari "NotificationDelivery" (migrasi 035): tabel itu mencatat pengiriman
-- PER ANGGOTA ("userId" NOT NULL, mereferensikan "User"). Pesan grup tidak punya penerima per
-- orang — hanya satu pesan per kejadian — jadi catatannya per (agenda, kanal, kunci kejadian).
--
-- Fungsinya sama: UNIQUE di bawah menjamin dua proses yang berjalan bersamaan (mis. cron yang
-- terpanggil dua kali) tidak bisa sama-sama "mengklaim" kejadian yang sama, jadi grup tidak
-- pernah menerima pesan yang sama dua kali.
--
-- Butuh migrasi 034 ("Agenda") sudah dijalankan. Tidak ada ALTER TYPE, aman dijalankan bersama
-- query lain. RLS dinyalakan TANPA policy: semua akses lewat service-role (supabaseAdmin).

CREATE TABLE IF NOT EXISTS "NotificationBroadcast" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "agendaId" UUID NOT NULL REFERENCES "Agenda"("id") ON DELETE CASCADE,
  -- WHATSAPP (nanti bisa kanal siaran lain tanpa ubah tabel)
  "channel" TEXT NOT NULL,
  -- Kunci idempotensi kejadian, sama seperti "NotificationDelivery"."reason":
  -- "CREATED", "UPDATED:<updatedAt>", "REMINDER_H1:<tanggal mulai>".
  "reason" TEXT NOT NULL,
  -- PENDING = sedang dikirim, SENT = berhasil, FAILED = gagal (boleh dicoba ulang)
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "error" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "sentAt" TIMESTAMPTZ,
  CONSTRAINT "NotificationBroadcast_unique" UNIQUE ("agendaId", "channel", "reason"),
  CONSTRAINT "NotificationBroadcast_status_check" CHECK ("status" IN ('PENDING', 'SENT', 'FAILED'))
);

ALTER TABLE "NotificationBroadcast" ENABLE ROW LEVEL SECURITY;
