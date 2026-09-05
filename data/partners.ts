// Konten section "Mitra" (trust bar) di beranda. Daftar logo mitra sendiri sepenuhnya berasal
// dari tabel Supabase "Partner" (dikelola admin di /admin/mitra) — tidak ada data logo bawaan
// di sini karena logo mitra tidak bisa diisi otomatis.
export const partnersData = {
  trustedByLabel: "Mitra & Kolaborasi Kami",

  button: {
    label: "Lihat Semua Mitra",
    href: "/mitra",
  },

  // Dipakai di beranda selama admin belum menambahkan mitra sungguhan lewat /admin/mitra,
  // supaya section ini tidak pernah tampil kosong.
  fallbackLogo: {
    name: "PC KMHDI Malang",
    logoUrl: "/image/Logo.webp",
  },
};
