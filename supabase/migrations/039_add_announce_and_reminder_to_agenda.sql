-- Migration 039: Pengumuman, pembaruan, dan pengingat agenda dipisah dan dikendalikan sekretaris.
--
-- Sebelumnya (migrasi 038) satu kolom "sendNotification" mengatur semua notifikasi, dan menerbitkan
-- agenda langsung mengumumkannya. Sekarang:
--   * Menerbitkan agenda hanya menampilkannya di kalender — tanpa notifikasi apa pun.
--   * Sekretaris menekan "Kirim notifikasi" untuk mengumumkan. "announcedAt" mencatat KAPAN agenda
--     diumumkan (NULL = belum diumumkan).
--   * "notifiedSnapshot" menyimpan keadaan agenda (judul, jadwal, lokasi, tautan) yang TERAKHIR
--     diberitahukan ke anggota. Agenda dianggap "ada perubahan" kalau keadaannya sekarang beda dari
--     snapshot itu, dan sekretaris menekan "Kirim pembaruan" untuk mengabarkannya. Karena yang
--     dibandingkan selalu keadaan terakhir yang diketahui anggota, beberapa kali edit berturut-turut
--     menghasilkan SATU pembaruan dengan selisih bersihnya, dan edit yang dibatalkan sendiri
--     (diubah lalu dikembalikan) tidak dianggap perubahan.
--   * "remindH1" mengatur pengingat sehari sebelum acara, berdiri sendiri: agenda yang tidak
--     diumumkan pun tetap bisa diingatkan. Default TRUE.
--
-- Kolom "sendNotification" SENGAJA tidak dihapus di sini: kode lama yang masih berjalan di
-- produksi selama deploy tetap bisa memakainya. Kode baru tidak membacanya lagi; bisa dihapus
-- belakangan dengan: ALTER TABLE "Agenda" DROP COLUMN "sendNotification";
--
-- Aman dijalankan ulang: isi awal (backfill) hanya berjalan saat kolomnya baru dibuat, jadi
-- pilihan yang sudah diubah sekretaris tidak tertimpa. Butuh migrasi 034, 035, dan 038.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'Agenda' AND column_name = 'remindH1'
  ) THEN
    ALTER TABLE "Agenda" ADD COLUMN "remindH1" BOOLEAN NOT NULL DEFAULT true;
    -- Agenda lama: pengingat mengikuti pengaturan notifikasi lamanya.
    UPDATE "Agenda" SET "remindH1" = "sendNotification";
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'Agenda' AND column_name = 'announcedAt'
  ) THEN
    ALTER TABLE "Agenda" ADD COLUMN "announcedAt" TIMESTAMPTZ;
    -- Agenda yang sudah pernah diumumkan (punya catatan pengiriman) ditandai diumumkan sejak
    -- pengiriman pertamanya, supaya tidak muncul lagi sebagai "belum diumumkan".
    UPDATE "Agenda" a
    SET "announcedAt" = d."first"
    FROM (
      SELECT "agendaId", MIN("createdAt") AS "first"
      FROM "NotificationDelivery"
      GROUP BY "agendaId"
    ) d
    WHERE d."agendaId" = a."id";
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'Agenda' AND column_name = 'notifiedSnapshot'
  ) THEN
    ALTER TABLE "Agenda" ADD COLUMN "notifiedSnapshot" JSONB;
    -- Agenda yang sudah diumumkan: anggap keadaannya SEKARANG yang terakhir diberitahukan, sehingga
    -- tidak ada yang langsung muncul sebagai "ada perubahan" begitu migrasi ini dijalankan.
    UPDATE "Agenda"
    SET "notifiedSnapshot" = jsonb_build_object(
      'title', "title",
      'startAt', "startAt",
      'endAt', "endAt",
      'allDay', "allDay",
      'location', "location",
      'locationDetail', "locationDetail"
    )
    WHERE "announcedAt" IS NOT NULL;
  END IF;
END $$;
