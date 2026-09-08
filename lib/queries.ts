import { cache } from "react";

import { supabaseAdmin } from "@/lib/supabase";

// supabase-js memakai fetch-nya sendiri dan tidak ikut deduplikasi request bawaan Next.js,
// jadi query yang persis sama di beberapa komponen benar-benar jalan berkali-kali ke database
// dalam satu render. React `cache()` menyatukannya jadi satu panggilan per request.

// Dipakai bertiga sekaligus di beranda: Hero (caption), About (strip statistik), dan
// Statistics (badge/judul/deskripsi) — semuanya membaca baris yang sama, id = 1.
export const getStatisticSection = cache(async () => {
  const { data } = await supabaseAdmin.from("StatisticSection").select("*").eq("id", 1).maybeSingle();
  return data;
});

// Kolom untuk tampilan daftar/kartu artikel: sengaja tanpa "content", karena kartu cuma
// butuh judul, cover, dan ringkasan — menarik isi HTML penuh tiap artikel di daftar
// membuat payload query membengkak berkali lipat tanpa satu pun dipakai.
export const NEWS_CARD_COLUMNS = "id, title, slug, excerpt, coverImage, authorName, views, likes, createdAt, publishedAt, Category(name), author:User!authorId(name)";

// Tanpa tipe hasil query yang dibuat dari skema, supabase-js menebak relasi bersarang sebagai
// array begitu daftar kolomnya ditulis eksplisit (dengan "*" kebetulan tertebak sebagai objek).
// Category/author di sini keduanya relasi many-to-one, jadi bentuknya dipastikan lewat .returns().
export type NewsCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string;
  authorName: string | null;
  views: number | null;
  likes: number | null;
  createdAt: string;
  publishedAt: string | null;
  Category: { name: string } | null;
  author: { name: string } | null;
};

// Halaman artikel membacanya dua kali per request: sekali di generateMetadata, sekali di
// komponen halaman. Kolomnya disebut eksplisit — "content" artikel bisa puluhan KB HTML.
export type NewsDetail = NewsCard & {
  content: string | null;
  categoryId: string | null;
  updatedAt: string | null;
};

export const getPublishedNewsBySlug = cache(async (slug: string): Promise<NewsDetail | null> => {
  const { data } = await supabaseAdmin
    .from("News")
    .select(`${NEWS_CARD_COLUMNS}, content, categoryId, updatedAt`)
    .eq("slug", slug)
    .eq("status", "PUBLISHED")
    .maybeSingle()
    .returns<NewsDetail>();
  return data;
});


