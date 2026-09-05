-- Migration 013: Bucket khusus untuk gambar yang disisipkan di tengah isi artikel (rich text editor)
-- Terpisah dari "news-covers" (khusus gambar sampul) agar mudah dipantau pemakaiannya.
insert into storage.buckets (id, name, public)
values ('article-images', 'article-images', true)
on conflict (id) do nothing;
