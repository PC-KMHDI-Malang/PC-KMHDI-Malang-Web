-- Migration 038: Kolom "sendNotification" di "Agenda" — sekretaris memilih per agenda apakah
-- anggota diberi notifikasi atau tidak. Tidak semua catatan kalender perlu diumumkan.
--
-- FALSE = agenda hanya tampil di kalender; TIDAK ada lonceng, TIDAK ada email, dan TIDAK ada
-- pengingat H-1. TRUE = diumumkan saat terbit/berubah dan diingatkan H-1 (lihat lib/notify).
-- Default FALSE: mengumumkan ke seluruh anggota harus pilihan sadar, bukan efek samping lupa
-- mematikan sesuatu.
--
-- Jalankan SEBELUM men-deploy kode yang memakainya. Aman dijalankan bersama query lain.

ALTER TABLE "Agenda" ADD COLUMN IF NOT EXISTS "sendNotification" BOOLEAN NOT NULL DEFAULT false;

-- Agenda yang SUDAH pernah diumumkan (punya catatan pengiriman) dianggap memakai notifikasi, supaya
-- pengingat H-1-nya tidak diam-diam berhenti setelah migrasi ini.
UPDATE "Agenda"
SET "sendNotification" = true
WHERE "id" IN (SELECT DISTINCT "agendaId" FROM "NotificationDelivery");
