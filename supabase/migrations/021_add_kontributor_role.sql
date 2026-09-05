-- Migration 021: Tambah nilai baru 'KONTRIBUTOR' ke enum "Role" (sebelumnya cuma ADMIN, USER).
-- Role ini bisa masuk panel admin tapi dibatasi cuma ke halaman Beranda, Artikel, dan e-Book
-- (lihat lib/roles.ts) — tidak bisa ke Statistik, Pengurus, Mitra, Galeri, Manajemen User, atau
-- ganti password/username sendiri.
--
-- CATATAN: ALTER TYPE ... ADD VALUE tidak boleh dijalankan bersamaan dalam satu transaksi dengan
-- statement lain yang memakai nilai barunya — jalankan file ini SENDIRIAN (bukan digabung dengan
-- query lain di SQL Editor yang sama).
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'KONTRIBUTOR';
