-- Migration 033: Tambah nilai baru 'VIEWER' (Akun Umum) ke enum "Role".
-- Akun Umum hanya bisa melihat halaman seperti user biasa: tidak ditagih iuran, tidak bisa membuka
-- Uang Kas, tidak muncul di daftar kas maupun Informasi Akun, dan tidak bisa mengubah nama/
-- password/profilnya sendiri (lihat lib/roles.ts). Role diberikan Admin lewat Manajemen User.
--
-- CATATAN: ALTER TYPE ... ADD VALUE tidak boleh dijalankan bersamaan dalam satu transaksi dengan
-- statement lain yang memakai nilai barunya — jalankan file ini SENDIRIAN (bukan digabung dengan
-- query lain di SQL Editor yang sama), lalu ubah role akun lewat panel Admin.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'VIEWER';
