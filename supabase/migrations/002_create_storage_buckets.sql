-- Membuat bucket Supabase Storage terpisah untuk cover artikel, cover ebook, dan foto galeri.
-- Semua bucket bersifat public agar file bisa diakses langsung lewat public URL.
insert into storage.buckets (id, name, public)
values
  ('news-covers', 'news-covers', true),
  ('ebook-covers', 'ebook-covers', true),
  ('gallery-photos', 'gallery-photos', true)
on conflict (id) do nothing;
