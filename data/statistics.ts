import {
  Users,
  GraduationCap,
  CalendarDays,
  Handshake,
} from "lucide-react";

export const statisticsData = {
  badge: "Pencapaian",

  title: "Bertumbuh Bersama Mahasiswa Hindu Malang Raya",

  description:
    "Selama bertahun-tahun PC KMHDI Malang terus berkembang melalui kaderisasi, kolaborasi, serta berbagai program yang memberikan dampak nyata bagi mahasiswa maupun masyarakat.",

  items: [
    {
      id: 1,
      value: "500+",
      label: "Anggota Aktif",
      icon: Users,
    },
    {
      id: 2,
      value: "12",
      label: "Komisariat",
      icon: GraduationCap,
    },
    {
      id: 3,
      value: "35+",
      label: "Program Tahunan",
      icon: CalendarDays,
    },
    {
      id: 4,
      value: "20+",
      label: "Mitra Kolaborasi",
      icon: Handshake,
    },
  ],
};