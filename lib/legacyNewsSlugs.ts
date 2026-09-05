// Artikel berita yang publish sebelum generateUniqueNewsSlug() ada (lihat lib/slug.ts) dulu
// dapat slug "judul-<timestamp>" (mis. "...-1787467928254") — akhiran timestamp-nya dibersihkan
// langsung di database supaya URL-nya rapi, tapi slug lama itu bisa saja sudah pernah dibagikan
// (tombol "Bagikan ke WA" di halaman artikel). Peta di bawah ini yang menjaga link lama itu tetap
// jalan lewat redirect permanen di app/(public)/[slug]/page.tsx, bukan berujung 404.
export const legacyNewsSlugs: Record<string, string> = {
  "alasan-mengapa-negara-religius-biasanya-terbelakang-apa-salah-agama-1787496756835": "alasan-mengapa-negara-religius-biasanya-terbelakang-apa-salah-agama",
  "liputan-khusus-kisah-sukses-mantan-ketua-pc-kmhdi-malang-yang-sukses-dirikan-kerajaan-bisnis-mulai-dari-minus-1788581052423": "liputan-khusus-kisah-sukses-mantan-ketua-pc-kmhdi-malang-yang-sukses-dirikan-kerajaan-bisnis-mulai-dari-minus",
  "feodalisme-hindu-menghancurkan-merongrong-dari-dalam-1788580517402": "feodalisme-hindu-menghancurkan-merongrong-dari-dalam",
  "toni-aji-wijaya-alumni-kmhdi-malang-yang-kini-menjadi-bupati-kabupaten-malang-berikut-rekam-jejaknya-1787570244162": "toni-aji-wijaya-alumni-kmhdi-malang-yang-kini-menjadi-bupati-kabupaten-malang-berikut-rekam-jejaknya",
  "setelah-kalimantan-prabowo-akan-bakar-papua-1787467928254": "setelah-kalimantan-prabowo-akan-bakar-papua",
  "silpa-kota-malang-sisa-300-milyar-berikut-program-kerja-yang-belum-terlaksana-1787497581740": "silpa-kota-malang-sisa-300-milyar-berikut-program-kerja-yang-belum-terlaksana",
  "menhut-mending-turun-atau-diturunkan-1787496552910": "menhut-mending-turun-atau-diturunkan",
  "mantap-1787467928254": "setelah-kalimantan-prabowo-akan-bakar-papua",
};
