import {
  GraduationCap,
  Users,
  HeartHandshake,
  Briefcase,
  Landmark,
  BookOpen,
} from "lucide-react";

export const programsData = {
  badge: "Program Kerja",

  title: "Program Unggulan PC KMHDI Malang",

  description:
    "Berbagai program yang dirancang untuk mengembangkan kapasitas kader, memperkuat nilai Dharma, serta memberikan kontribusi nyata kepada masyarakat.",

  programs: [
    {
      id: 1,
      title: "Kaderisasi",
      description:
        "Membentuk kader Hindu yang berintegritas, kritis, dan memiliki jiwa kepemimpinan.",
      icon: GraduationCap,
    },
    {
      id: 2,
      title: "Pengembangan SDM",
      description:
        "Pelatihan, seminar, workshop, dan diskusi untuk meningkatkan kompetensi anggota.",
      icon: Users,
    },
    {
      id: 3,
      title: "Pengabdian Masyarakat",
      description:
        "Program sosial, lingkungan, dan pelayanan sebagai bentuk implementasi Dharma.",
      icon: HeartHandshake,
    },
    {
      id: 4,
      title: "Kewirausahaan",
      description:
        "Mendorong kreativitas dan kemandirian ekonomi mahasiswa melalui berbagai kegiatan usaha.",
      icon: Briefcase,
    },
    {
      id: 5,
      title: "Advokasi",
      description:
        "Menjadi ruang aspirasi dan pendampingan bagi mahasiswa Hindu di Malang Raya.",
      icon: Landmark,
    },
    {
      id: 6,
      title: "Kajian & Literasi",
      description:
        "Diskusi ilmiah, bedah buku, serta kajian isu strategis yang relevan bagi mahasiswa.",
      icon: BookOpen,
    },
  ],
};