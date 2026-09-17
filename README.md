<div align="center">

<img src="public/image/Logo.webp" alt="Logo PC KMHDI Malang" width="120" />

# PC KMHDI Malang — Website Resmi

Website resmi **Pimpinan Cabang Kesatuan Mahasiswa Hindu Dharma Indonesia (KMHDI) Malang** —
pusat informasi, publikasi, perpustakaan digital, dan dokumentasi kegiatan mahasiswa Hindu se-Malang Raya.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)

**[Lihat Website →](https://www.kmhdimalang.org)**

</div>

---

## Daftar Isi

- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Struktur Proyek](#struktur-proyek)
- [Daftar Halaman](#daftar-halaman)

---

## Fitur

### Untuk Pengunjung

| Fitur                   | Keterangan                                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Beranda**             | Hero interaktif, statistik organisasi, program kerja, sorotan berita, e-Book, dan galeri terbaru                 |
| **Profil Organisasi**   | Visi, misi, 4 pilar jati diri, dan bagan struktur kepengurusan yang datanya diambil langsung dari database       |
| **Publikasi / Berita**  | Artikel dengan kategori, pencarian, pengurutan, slider berita utama, artikel terkait, dan tombol suka            |
| **Perpustakaan e-Book** | Koleksi digital dengan filter genre & pencarian, baca PDF langsung di web                                        |
| **Galeri**              | Dokumentasi kegiatan dengan tampilan lightbox dan navigasi antar foto                                            |
| **Kaka Assistant**      | Chatbot berbasis knowledge base manual — menjawab pertanyaan seputar KMHDI tanpa memerlukan layanan AI eksternal |
| **Mode Gelap/Terang**   | Mengikuti pilihan pengguna, tanpa kedip saat halaman dimuat                                                      |

### Untuk Pengurus (Admin)

Panel admin terlindungi autentikasi dengan tiga peran:

| Peran         | Akses                                                |
| ------------- | ---------------------------------------------------- |
| `ADMIN`       | Seluruh panel admin                                  |
| `KONTRIBUTOR` | Hanya Beranda admin, Artikel, dan e-Book             |
| `USER`        | Tidak masuk panel admin — hanya halaman profil kader |

- **Manajemen Artikel** — tulis, edit, publikasikan, atau simpan sebagai draf
- **Manajemen e-Book** — unggah sampul dan berkas PDF, atur genre, penerbit, tahun terbit
- **Manajemen Galeri** — unggah dan kelola dokumentasi kegiatan
- **Manajemen Pengurus** — susun struktur organisasi beserta foto dan urutan jabatan
- **Manajemen Mitra & Statistik** — logo mitra kolaborasi dan angka-angka di beranda
- **Manajemen User** — kelola akun kader dan peran aksesnya
- Sesi otomatis berakhir setelah 120 menit tidak aktif

### SEO & Berbagi Tautan

- `sitemap.xml` otomatis mencakup seluruh artikel dan e-Book, disegarkan tiap jam
- `robots.txt` dengan aturan yang memblokir halaman admin dan akun
- Structured data JSON-LD: `Organization`, `WebSite`, `NewsArticle`, `Book`, `BreadcrumbList`
- Banner Open Graph 1200×630 yang dihasilkan otomatis untuk preview saat tautan dibagikan
- Canonical URL di setiap halaman publik

---

## Teknologi

| Kategori           | Teknologi                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| Framework          | [Next.js 16](https://nextjs.org) (App Router, Turbopack, Server Actions)                          |
| Bahasa             | [TypeScript 5](https://www.typescriptlang.org)                                                    |
| UI                 | [React 19](https://react.dev), [Tailwind CSS 4](https://tailwindcss.com)                          |
| Animasi            | [Framer Motion](https://www.framer.com/motion/), [Embla Carousel](https://www.embla-carousel.com) |
| Ikon               | [Lucide](https://lucide.dev), [React Icons](https://react-icons.github.io/react-icons/)           |
| Database & Storage | [Supabase](https://supabase.com) (PostgreSQL + Storage)                                           |
| Autentikasi        | [NextAuth.js v5](https://authjs.dev) (Credentials + bcrypt)                                       |
| Tema               | [next-themes](https://github.com/pacocoursey/next-themes)                                         |
| Hosting            | [Vercel](https://vercel.com)                                                                      |

---

## Struktur Proyek

```
├── app/
│   ├── (public)/            # Halaman publik (beranda, berita, buku, galeri, profil)
│   ├── admin/               # Panel admin — dilindungi middleware, noindex
│   ├── actions/             # Server Actions (auth, like, profil)
│   ├── api/                 # Route handler (NextAuth, setup bucket)
│   ├── login/               # Halaman masuk
│   ├── layout.tsx           # Root layout, metadata global, JSON-LD
│   ├── sitemap.ts           # Sitemap dinamis
│   ├── robots.ts            # Aturan crawler
│   ├── manifest.ts          # Manifest PWA
│   └── opengraph-image.tsx  # Banner preview media sosial
│
├── components/
│   ├── admin/               # Komponen panel admin
│   ├── auth/                # Penanganan sesi
│   ├── ebooks/ gallery/ news/ organization/ profile/
│   ├── layout/              # Navbar, Footer, ScrollToTop
│   ├── sections/home/       # Bagian-bagian halaman beranda
│   ├── seo/                 # Komponen JSON-LD
│   └── ui/                  # Komponen pakai-ulang (SafeImage, ChatBot, dll.)
│
├── data/                    # Konten statis & knowledge base chatbot
├── lib/
│   ├── auth.ts              # Konfigurasi NextAuth
│   ├── roles.ts             # Peran mana boleh membuka halaman admin mana
│   ├── guard.ts             # Penjaga sesi untuk Server Actions
│   ├── loginRateLimit.ts    # Pembatas percobaan login
│   ├── search.ts            # Escaping teks pencarian untuk filter PostgREST
│   ├── supabase.ts          # Klien Supabase
│   ├── storage.ts           # Utilitas unggah/hapus berkas
│   └── site.ts              # Konfigurasi metadata situs
│
├── tests/                   # Tes unit & tes blackbox HTTP
├── supabase/                # schema.sql & migrasi
├── public/image/            # Logo dan aset gambar
└── middleware.ts            # Proteksi rute /admin dan /profile
```

---

## Daftar Halaman

### Publik

| Rute             | Halaman                                                     |
| ---------------- | ----------------------------------------------------------- |
| `/`              | Beranda                                                     |
| `/profil`        | Profil & struktur kepengurusan                              |
| `/program`       | Program kerja                                               |
| `/berita`        | Daftar publikasi & berita                                   |
| `/[slug]`        | Detail artikel — langsung di akar, bukan di bawah `/berita` |
| `/e-book`        | Perpustakaan e-Book                                         |
| `/e-book/[slug]` | Detail e-Book                                               |
| `/galeri`        | Galeri dokumentasi                                          |
| `/mitra`         | Mitra kolaborasi                                            |

### Terproteksi

Middleware mengalihkan tamu ke `/login` untuk `/profile` dan `/admin`.

| Rute                           | Akses                     |
| ------------------------------ | ------------------------- |
| `/login`                       | Publik                    |
| `/profile`                     | Pengguna yang sudah masuk |
| `/admin`                       | `ADMIN` dan `KONTRIBUTOR` |
| `/admin/news`, `/admin/ebooks` | `ADMIN` dan `KONTRIBUTOR` |
| `/admin` lainnya               | `ADMIN` saja              |

`/informasi-akun` (direktori email kader) bekerja berbeda: URL-nya terbuka, tapi datanya baru
diambil setelah sesi terverifikasi — tamu hanya menerima gerbang login, tanpa satu pun email
kader ikut terkirim di HTML-nya.

---

<div align="center">

**PC KMHDI Malang**

Asrama Mahasiswa Bali Gunung Agung<br>
Jl. Kartini No. 30, Klojen, Kota Malang, Jawa Timur

[![Instagram](https://img.shields.io/badge/Instagram-@pc.kmhdimalang-E4405F?logo=instagram&logoColor=white)](https://www.instagram.com/pc.kmhdimalang)

<sub>Religius · Humanis · Nasionalis · Progresif</sub>

</div>
