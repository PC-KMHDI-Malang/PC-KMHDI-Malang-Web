-- Migration 016: Jadikan bucket "ebook-files" privat.
-- Sebelumnya bucket ini publik, artinya siapa pun yang tahu URL file PDF bisa membukanya
-- langsung tanpa login sama sekali — tombol "Baca Online"/"Download PDF" di halaman e-book
-- hanya gerbang tampilan, bukan proteksi sungguhan. Dengan bucket privat, file PDF hanya bisa
-- diakses lewat signed URL sementara yang dibuat server (lib/storage.ts: getSignedFileUrl)
-- untuk pengguna yang benar-benar berhak.
update storage.buckets set public = false where id = 'ebook-files';
