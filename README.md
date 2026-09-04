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

**[Lihat Website →](https://pc-kmhdi-malang-web.vercel.app)**

</div>

---

## Daftar Isi

- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Memulai](#memulai)
- [Environment Variables](#environment-variables)
- [Menyiapkan Database & Storage](#menyiapkan-database--storage)
- [Struktur Proyek](#struktur-proyek)
- [Daftar Halaman](#daftar-halaman)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

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

Panel admin terlindungi autentikasi dengan pembagian peran (`ADMIN` / `USER`):

- **Manajemen Artikel** — tulis, edit, publikasikan, atau simpan sebagai draf
- **Manajemen e-Book** — unggah sampul dan berkas PDF, atur genre, penerbit, tahun terbit
- **Manajemen Galeri** — unggah dan kelola dokumentasi kegiatan
- **Manajemen Pengurus** — susun struktur organisasi beserta foto dan urutan jabatan
- **Manajemen User** — kelola akun kader dan peran aksesnya
- Sesi otomatis berakhir setelah 120 menit tidak aktif

### SEO & Berbagi Tautan

- `sitemap.xml` otomatis mencakup seluruh artikel dan e-Book, disegarkan tiap jam
- `robots.txt` dengan aturan yang memblokir halaman admin dan akun
- Structured data JSON-LD: `Organization`, `WebSite`, `NewsArticle`, `BreadcrumbList`
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

## Memulai

### Prasyarat

- **Node.js 20 atau lebih baru** (disyaratkan oleh Next.js 16)
- Akun [Supabase](https://supabase.com) (paket gratis sudah cukup)
- npm (sudah termasuk dalam Node.js)

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
│   ├── supabase.ts          # Klien Supabase
│   ├── storage.ts           # Utilitas unggah/hapus berkas
│   └── site.ts              # Konfigurasi metadata situs
│
├── supabase/                # schema.sql & migrasi
├── public/image/            # Logo dan aset gambar
└── middleware.ts            # Proteksi rute /admin dan /profile
```

---

## Daftar Halaman

### Publik

| Rute             | Halaman                        |
| ---------------- | ------------------------------ |
| `/`              | Beranda                        |
| `/profil`        | Profil & struktur kepengurusan |
| `/berita`        | Daftar publikasi & berita      |
| `/berita/[slug]` | Detail artikel                 |
| `/buku`          | Perpustakaan e-Book            |
| `/buku/[id]`     | Detail e-Book                  |
| `/galeri`        | Galeri dokumentasi             |

### Terproteksi

| Rute                    | Akses                     |
| ----------------------- | ------------------------- |
| `/login`                | Publik                    |
| `/profile`              | Pengguna yang sudah masuk |
| `/admin` dan turunannya | `ADMIN` saja              |

---

## Deployment

Website ini di-deploy di **Vercel**.

1. Impor repositori ke Vercel
2. Isi seluruh environment variables pada **Settings → Environment Variables**
3. Deploy — Vercel mendeteksi Next.js secara otomatis, tanpa konfigurasi tambahan

> [!IMPORTANT]
> Saat berpindah ke domain baru, cukup ubah nilai `NEXT_PUBLIC_SITE_URL` di environment
> variables Vercel. Canonical URL, sitemap, robots.txt, dan preview tautan akan ikut
> menyesuaikan tanpa perlu mengubah kode.

### Setelah domain aktif

1. Daftarkan situs di [Google Search Console](https://search.google.com/search-console)
2. Kirimkan `https://domain-anda/sitemap.xml`

---

## Troubleshooting

<details>
<summary><b>Gambar dari Supabase gagal dimuat, log menyebut <code>resolved to private ip</code></b></summary>

<br>

Terjadi pada jaringan yang memakai **NAT64/DNS64** (umum di jaringan kampus dan asrama).
Alamat IPv6 sintetis yang dihasilkan jaringan tersebut keliru dianggap sebagai IP privat
oleh proteksi SSRF bawaan Next.js Image Optimizer, sehingga seluruh gambar eksternal ditolak.

Sudah ditangani di `next.config.ts` dengan memaksa resolusi DNS memakai IPv4.
Jika masih muncul, pastikan berkas tersebut tidak termodifikasi dan jalankan ulang dev server.

</details>

<details>
<summary><b>Gambar sampul artikel tidak tampil</b></summary>

<br>

Gambar dari host di luar daftar `remotePatterns` pada `next.config.ts` (misalnya URL yang
disalin dari hasil pencarian Google) tidak dapat dioptimalkan Next.js.
Komponen `SafeImage` menanganinya secara otomatis dengan melewati proses optimasi.

Agar gambar tampil optimal, **unggah berkasnya langsung** lewat panel admin
daripada menempelkan URL dari situs lain.

</details>

<details>
<summary><b>Error Turbopack: <code>Failed to restore task data (corrupted database)</code></b></summary>

<br>

Cache Turbopack rusak, biasanya karena proses dihentikan paksa. Bersihkan lalu jalankan ulang:

```bash
rm -rf .next
npm run dev
```

</details>

<details>
<summary><b>Peringatan konsol: <code>Encountered a script tag while rendering React component</code></b></summary>

<br>

Berasal dari pustaka `next-themes` yang menyuntikkan skrip anti-kedip tema, dan dianggap
bermasalah oleh peringatan baru React 19 meski skripnya berfungsi normal.
Tidak memengaruhi jalannya aplikasi, dan sudah disaring pada `app/providers.tsx`.

</details>

---

<div align="center">

**PC KMHDI Malang**

Asrama Mahasiswa Bali Gunung Agung<br>
Jl. Kartini No. 30, Klojen, Kota Malang, Jawa Timur

[![Instagram](https://img.shields.io/badge/Instagram-@pc.kmhdimalang-E4405F?logo=instagram&logoColor=white)](https://www.instagram.com/pc.kmhdimalang)

<sub>Religius · Humanis · Nasionalis · Progresif</sub>

</div>
