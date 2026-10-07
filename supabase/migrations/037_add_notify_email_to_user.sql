-- Migration 037: Kolom "notifyEmail" di "User" — email ASLI anggota untuk menerima notifikasi agenda.
--
-- "User"."email" adalah nama login dan banyak yang berisi alamat bukan kotak masuk sungguhan.
-- Kanal email (Resend) HANYA mengirim ke kolom ini, tidak pernah ke "User"."email", supaya tidak
-- ada email yang memantul. Anggota yang kolomnya kosong tidak dikirimi email (lonceng di navbar
-- tetap jalan).
--
-- Diisi dua cara: admin lewat Kelola User (/admin/users), dan anggota sendiri lewat /profile.
-- NULL = belum diisi. Format divalidasi di kode (lib/notifyEmail.ts), bukan di database.
--
-- Aman dijalankan bersama query lain. Jalankan SEBELUM men-deploy kode yang memakainya.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notifyEmail" TEXT;
