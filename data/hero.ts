export const heroData = {
  badge: "Website Resmi PC KMHDI Malang",

  title: {
    first: "Mencetak Generasi Hindu yang",
    animated: ["Religius", "Humanis", "Nasionalis", "Progresif"],
  },

  description: "Pengurus Cabang Kesatuan Mahasiswa Hindu Dharma Indonesia Malang hadir sebagai wadah kaderisasi, pengembangan kepemimpinan, serta pengabdian masyarakat bagi mahasiswa Hindu di Malang Raya.",

  image: "/image/Logo.webp",

  buttons: [
    {
      label: "Gabung KMHDI",
      href: "https://wa.me/6287774230949?text=Halo%20Admin%2C%20saya%20ingin%20bergabung%20dengan%20PC%20KMHDI%20Malang.",
      primary: true,
    },
    {
      label: "Tentang Kami",
      href: "/profil",
      primary: false,
    },
  ],

  // Caption angka di bawah lambang. Fallback saja — nilai aktual dari kolom
  // heroCaptionValue1/2 & heroCaptionLabel1/2 pada tabel "StatisticSection".
  captionYears: { value: "35+", label: "Tahun Pengabdian" },
  captionMembers: { value: "500+", label: "Kader Aktif" },
};
