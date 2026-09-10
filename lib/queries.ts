import { cache } from "react";
import { unstable_cache } from "next/cache";

import { supabaseAdmin } from "@/lib/supabase";
import { containsPattern } from "@/lib/search";

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

const BERITA_NEWS_PER_PAGE = 8;
const BERITA_FEATURED_COUNT = 3;

export interface BeritaListParams {
  query: string;
  sortFilter: string;
  categoryFilter: string;
  currentPage: number;
}

export interface BeritaListData {
  categories: string[];
  showSlider: boolean;
  featuredWithContent: (NewsCard & { content: string })[];
  displayGridNews: NewsCard[];
  totalPages: number;
  fallbackUsed: boolean;
}

async function fetchBeritaListData({ query, sortFilter, categoryFilter, currentPage }: BeritaListParams): Promise<BeritaListData> {
  // Ambil kategori & (kalau ada filter kategori) id kategori itu secara paralel, bukan berurutan,
  // supaya round-trip ke Supabase tidak numpuk sebelum query berita utama bisa jalan.
  const [{ data: allCategories }, matchingCatResult] = await Promise.all([
    supabaseAdmin.from("Category").select("id, name").order("name"),
    categoryFilter ? supabaseAdmin.from("Category").select("id").eq("name", categoryFilter).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const categories = (allCategories || []).map((c) => c.name);
  const matchingCat = matchingCatResult.data;

  // Slider hanya di halaman pertama dan saat tidak sedang mencari; artikel yang sudah tampil di
  // slider dilewati oleh grid, jadi offset-nya ikut diperhitungkan di semua halaman berikutnya.
  const showSlider = !query && currentPage === 1;
  const sliderOffset = query ? 0 : BERITA_FEATURED_COUNT;

  const buildQuery = () => {
    let q = supabaseAdmin.from("News").select(NEWS_CARD_COLUMNS, { count: "exact" }).eq("status", "PUBLISHED");
    if (query) q = q.ilike("title", `%${query}%`);
    if (matchingCat) q = q.eq("categoryId", matchingCat.id);
    return q.order("createdAt", { ascending: sortFilter === "oldest" });
  };

  const gridFrom = sliderOffset + (currentPage - 1) * BERITA_NEWS_PER_PAGE;
  const [featuredResult, gridResult] = await Promise.all([
    showSlider ? buildQuery().range(0, BERITA_FEATURED_COUNT - 1).returns<NewsCard[]>() : Promise.resolve({ data: [] as NewsCard[] }),
    buildQuery().range(gridFrom, gridFrom + BERITA_NEWS_PER_PAGE - 1).returns<NewsCard[]>(),
  ]);

  const featuredItems = featuredResult.data || [];
  const totalMatching = "count" in gridResult ? (gridResult.count ?? 0) : 0;
  const totalPages = Math.max(1, Math.ceil(Math.max(0, totalMatching - sliderOffset) / BERITA_NEWS_PER_PAGE));

  // Hanya kartu slider yang menampilkan cuplikan dari isi artikel, jadi kolom "content" (HTML
  // penuh, bisa puluhan KB per artikel) diambil terpisah cuma untuk yang tampil di situ — bukan
  // ikut terbawa di query daftar.
  const featuredContent = new Map<string, string>();
  if (featuredItems.length > 0) {
    const { data: contents } = await supabaseAdmin
      .from("News")
      .select("id, content")
      .in(
        "id",
        featuredItems.map((i) => i.id),
      );
    for (const row of contents || []) featuredContent.set(row.id, row.content || "");
  }
  const featuredWithContent = featuredItems.map((i) => ({ ...i, content: featuredContent.get(i.id) || "" }));

  let displayGridNews = gridResult.data || [];
  let fallbackUsed = false;

  // Kategori yang isinya cuma sedikit (semuanya terpakai di slider) akan menyisakan bagian
  // "Berita Lainnya" kosong — diisi artikel terbaru dari kategori mana pun. Hanya di halaman
  // pertama: di halaman berikutnya, daftar kosong memang berarti sudah habis.
  if (displayGridNews.length === 0 && !query && currentPage === 1) {
    let fallbackQuery = supabaseAdmin.from("News").select(NEWS_CARD_COLUMNS).eq("status", "PUBLISHED");
    if (featuredItems.length > 0) {
      fallbackQuery = fallbackQuery.not("id", "in", `(${featuredItems.map((i) => i.id).join(",")})`);
    }

    const { data: fallbackNews } = await fallbackQuery.order("createdAt", { ascending: false }).limit(6).returns<NewsCard[]>();
    if (fallbackNews && fallbackNews.length > 0) {
      displayGridNews = fallbackNews;
      fallbackUsed = true;
    }
  }

  return { categories, showSlider, featuredWithContent, displayGridNews, totalPages, fallbackUsed };
}

// Query daftar /berita di-cache per kombinasi filter (kosong/kategori/urutan/halaman) — beban
// terberat halaman ini (kategori, slider, grid, fallback: total 3-5 query Supabase sekaligus)
// tidak perlu diulang di setiap kunjungan dengan kombinasi filter yang sama. Halaman itu sendiri
// tetap render tiap request (searchParams membuatnya dinamis), tapi query di dalamnya kena cache.
// Tidak di-invalidate langsung saat admin menambah/edit/hapus berita — revalidateTag di versi
// Next.js ini butuh argumen kedua yang belum jelas semantiknya, jadi sengaja tidak dipakai.
// Artikel baru/yang diubah muncul di daftar publik dalam waktu paling lama 5 menit (revalidate
// di bawah), sedikit lebih lambat dari revalidatePath("/") yang sudah langsung untuk beranda.
export const getBeritaListData = unstable_cache(fetchBeritaListData, ["berita-list"], {
  revalidate: 300,
  tags: ["news-list"],
});

export interface EbookListParams {
  query: string;
  sortFilter: string;
  genreFilter: string[];
}

export interface EbookListItem {
  id: string;
  title: string;
  genre: string;
  coverImage: string;
  createdAt: string;
  slug: string;
  description: string | null;
}

export interface EbookListData {
  genres: string[];
  ebooks: EbookListItem[];
}

async function fetchEbookListData({ query, sortFilter, genreFilter }: EbookListParams): Promise<EbookListData> {
  const { data: allEbooks } = await supabaseAdmin.from("Ebook").select("genre");
  const genres = Array.from(new Set((allEbooks || []).map((e) => e.genre))).sort();

  let dbQuery = supabaseAdmin.from("Ebook").select("id, title, genre, coverImage, createdAt, slug, description");

  if (query) {
    dbQuery = dbQuery.or(`title.ilike.${containsPattern(query)},description.ilike.${containsPattern(query)}`);
  }

  if (genreFilter.length > 0) {
    dbQuery = dbQuery.in("genre", genreFilter);
  }

  if (sortFilter === "oldest") {
    dbQuery = dbQuery.order("createdAt", { ascending: true });
  } else if (sortFilter === "az") {
    dbQuery = dbQuery.order("title", { ascending: true });
  } else if (sortFilter === "za") {
    dbQuery = dbQuery.order("title", { ascending: false });
  } else {
    dbQuery = dbQuery.order("createdAt", { ascending: false });
  }

  const { data: ebooks } = await dbQuery;

  return { genres, ebooks: ebooks || [] };
}

// Sama seperti getBeritaListData di atas: query daftar /e-book di-cache per kombinasi filter,
// halamannya sendiri tetap render tiap request karena searchParams. genreFilter diurutkan dulu
// oleh pemanggil (lihat app/(public)/e-book/(list)/page.tsx) supaya "genre=A&genre=B" dan
// "genre=B&genre=A" berbagi entri cache yang sama alih-alih dianggap dua kombinasi berbeda.
export const getEbookListData = unstable_cache(fetchEbookListData, ["ebook-list"], {
  revalidate: 300,
  tags: ["ebook-list"],
});

