export interface Member {
  id: string;
  name: string;
  role: string;
  department: "bph" | "organisasi" | "kaderisasi" | "litbang" | "sosmas" | "ddi" | "kewirausahaan";
  level: "bph_inti" | "bph_wakil" | "kabid" | "kabiro" | "staf" | "direktur";
  campus: string;
  major: string;
  imageUrl?: string | null;
  orderIndex: number;
  period: string;
  instagram?: string;
  gender?: "m" | "f";
}

export interface DepartmentInfo {
  id: "bph" | "organisasi" | "kaderisasi" | "litbang" | "sosmas" | "ddi" | "kewirausahaan";
  name: string;
  shortName: string;
  leadRole: string;
  description: string;
  category?: "bidang" | "non_bidang";
}

export const organizationInfo = {
  cabinetName: "Struktur Pengurus Pimpinan Cabang KMHDI Malang",
  period: "2025 - 2027",
  theme: "Bersama Membangun Kader Unggul, Berintegritas, dan Berdaya Saing",
  branchName: "PC KMHDI Malang",
  establishedYear: 1994,
  memberCount: "350+ Kader Aktif",
};

export const departmentsInfo: DepartmentInfo[] = [
  {
    id: "bph",
    name: "Badan Pengurus Harian",
    shortName: "BPH",
    leadRole: "Ketua Cabang",
    category: "bidang",
    description: "Unsur pimpinan tertinggi yang memegang koordinasi, kebijakan strategis, dan tata kelola organisasi PC KMHDI Malang.",
  },
  {
    id: "organisasi",
    name: "Bidang Organisasi",
    shortName: "Organisasi",
    leadRole: "Ketua Bidang Organisasi",
    category: "bidang",
    description: "Bertanggung jawab atas penataan kelembagaan, ketertiban administrasi cabang, dan hubungan antar-lembaga kemahasiswaan.",
  },
  {
    id: "kaderisasi",
    name: "Bidang Kaderisasi",
    shortName: "Kaderisasi",
    leadRole: "Ketua Bidang Kaderisasi",
    category: "bidang",
    description: "Mengawal rekrutmen Masa Bimbingan (MABIM), Latihan Kepemimpinan Kader (LKK), serta pemetaan potensi kader secara berkesinambungan.",
  },
  {
    id: "litbang",
    name: "Bidang Penelitian & Pengembangan",
    shortName: "Litbang",
    leadRole: "Ketua Bidang Litbang",
    category: "bidang",
    description: "Mengembangkan riset, kajian isu strategis keumatan dan kebangsaan, serta penerbitan modul literatur ilmiah organisasi.",
  },
  {
    id: "sosmas",
    name: "Bidang Sosial Kemasyarakatan",
    shortName: "Sosmas",
    leadRole: "Ketua Bidang Sosmas",
    category: "bidang",
    description: "Menjalankan program aksi kemanusiaan, bakti sosial, advokasi umat, pembinaan pasraman, serta kepedulian lingkungan hidup di Malang Raya.",
  },
  {
    id: "ddi",
    name: "Bidang Data dan Informasi",
    shortName: "DDI",
    leadRole: "Ketua Bidang DDI",
    category: "bidang",
    description: "Mengelola database anggota, pengarsipan digital, publikasi media resmi, branding visual, serta pemeliharaan sistem informasi website.",
  },
  {
    id: "kewirausahaan",
    name: "Lembaga Kewirausahaan",
    shortName: "Kewirausahaan",
    leadRole: "Direktur Lembaga",
    category: "non_bidang",
    description: "Lembaga otonom non-bidang yang berfokus pada pengembangan ekonomi kreatif, inkubasi bisnis mahasiswa Hindu, dan kemandirian finansial organisasi.",
  },
];

export const organizationRoleGroups = [
  {
    group: "Badan Pengurus Harian (BPH)",
    roles: ["Ketua Cabang", "Sekretaris Cabang", "Bendahara Cabang", "Wakil Sekretaris Cabang", "Wakil Bendahara Cabang"],
  },
  {
    group: "Bidang Organisasi",
    roles: ["Ketua Bidang Organisasi", "Kepala Bidang Organisasi", "Staf Bidang Organisasi"],
  },
  {
    group: "Bidang Kaderisasi",
    roles: ["Ketua Bidang Kaderisasi", "Kepala Bidang Kaderisasi", "Staf Bidang Kaderisasi"],
  },
  {
    group: "Bidang Penelitian & Pengembangan (Litbang)",
    roles: ["Ketua Bidang Litbang", "Kepala Bidang Litbang", "Staf Bidang Litbang"],
  },
  {
    group: "Bidang Sosial Kemasyarakatan (Sosmas)",
    roles: ["Ketua Bidang Sosmas", "Kepala Bidang Sosmas", "Staf Bidang Sosmas"],
  },
  {
    group: "Bidang Data dan Informasi (DDI)",
    roles: ["Ketua Bidang DDI", "Kepala Bidang DDI", "Staf Bidang DDI"],
  },
  {
    group: "Lembaga Kewirausahaan (Non-Bidang)",
    roles: ["Direktur Lembaga", "Sekretaris Lembaga", "Bendahara Lembaga", "Staf Lembaga"],
  },
];

export const allMembers: Member[] = [
  // --- BPH INTI ---
  {
    id: "bph-ketua",
    name: "I Putu Gede Artha Nugraha",
    role: "Ketua Cabang",
    department: "bph",
    level: "bph_inti",
    major: "Ilmu Hukum",
    campus: "Universitas Brawijaya",
    orderIndex: 1,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "m",
  },
  {
    id: "bph-sekretaris",
    name: "Ni Kadek Ayu Dwi Lestari",
    role: "Sekretaris Cabang",
    department: "bph",
    level: "bph_inti",
    major: "Pendidikan Bahasa Inggris",
    campus: "Universitas Negeri Malang",
    orderIndex: 2,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "f",
  },
  {
    id: "bph-bendahara",
    name: "Ni Komang Tri Widyastuti",
    role: "Bendahara Cabang",
    department: "bph",
    level: "bph_inti",
    major: "Akuntansi",
    campus: "Universitas Brawijaya",
    orderIndex: 3,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "f",
  },

  // --- WAKIL BPH ---
  {
    id: "bph-wasekcab",
    name: "I Made Bagus Wicaksana",
    role: "Wakil Sekretaris Cabang",
    department: "bph",
    level: "bph_wakil",
    major: "Teknik Mesin",
    campus: "Politeknik Negeri Malang",
    orderIndex: 4,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "m",
  },
  {
    id: "bph-wabencab",
    name: "Ni Putu Ratih Permata",
    role: "Wakil Bendahara Cabang",
    department: "bph",
    level: "bph_wakil",
    major: "Pendidikan Sosiologi",
    campus: "Universitas Negeri Malang",
    orderIndex: 5,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "f",
  },

  // --- BIDANG ORGANISASI ---
  {
    id: "org-1",
    name: "I Wayan Aditya Pratama",
    role: "Ketua Bidang Organisasi",
    department: "organisasi",
    level: "kabid",
    major: "Administrasi Publik",
    campus: "Universitas Brawijaya",
    orderIndex: 10,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "m",
  },
  {
    id: "org-2",
    name: "I Gede Surya Dharma",
    role: "Staf Bidang Organisasi",
    department: "organisasi",
    level: "staf",
    major: "Ilmu Pemerintahan",
    campus: "Universitas Muhammadiyah Malang",
    orderIndex: 11,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "m",
  },
  {
    id: "org-3",
    name: "I Kadek Dwi Mahendra",
    role: "Staf Bidang Organisasi",
    department: "organisasi",
    level: "staf",
    major: "Teknik Sipil",
    campus: "Universitas Brawijaya",
    orderIndex: 12,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "m",
  },

  // --- BIDANG KADERISASI ---
  {
    id: "kad-1",
    name: "Ni Luh Putu Sintya Dewi",
    role: "Ketua Bidang Kaderisasi",
    department: "kaderisasi",
    level: "kabid",
    major: "Psikologi",
    campus: "Universitas Negeri Malang",
    orderIndex: 20,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "f",
  },
  {
    id: "kad-2",
    name: "I Putu Kevin Arisandi",
    role: "Staf Bidang Kaderisasi",
    department: "kaderisasi",
    level: "staf",
    major: "Manajemen",
    campus: "Universitas Brawijaya",
    orderIndex: 21,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "m",
  },
  {
    id: "kad-3",
    name: "I Made Bayu Swadana",
    role: "Staf Bidang Kaderisasi",
    department: "kaderisasi",
    level: "staf",
    major: "Ilmu Hukum",
    campus: "Universitas Brawijaya",
    orderIndex: 22,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "m",
  },

  // --- BIDANG LITBANG ---
  {
    id: "lit-1",
    name: "Ni Made Anindya Putri",
    role: "Ketua Bidang Litbang",
    department: "litbang",
    level: "kabid",
    major: "Sosiologi",
    campus: "Universitas Brawijaya",
    orderIndex: 30,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "f",
  },
  {
    id: "lit-2",
    name: "I Ketut Ari Sudewa",
    role: "Staf Bidang Litbang",
    department: "litbang",
    level: "staf",
    major: "Teknik Elektro",
    campus: "Institut Teknologi Nasional Malang",
    orderIndex: 31,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "m",
  },
  {
    id: "lit-3",
    name: "Ni Putu Ratna Dewi",
    role: "Staf Bidang Litbang",
    department: "litbang",
    level: "staf",
    major: "Pendidikan Sejarah",
    campus: "Universitas Negeri Malang",
    orderIndex: 32,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "f",
  },

  // --- BIDANG SOSIAL KEMASYARAKATAN (SOSMAS) ---
  {
    id: "sos-1",
    name: "I Nyoman Arya Mahardika",
    role: "Ketua Bidang Sosmas",
    department: "sosmas",
    level: "kabid",
    major: "Teknik Telekomunikasi",
    campus: "Politeknik Negeri Malang",
    orderIndex: 40,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "m",
  },
  {
    id: "sos-2",
    name: "Ni Kadek Sri Wahyuni",
    role: "Staf Bidang Sosmas",
    department: "sosmas",
    level: "staf",
    major: "Kesehatan Masyarakat",
    campus: "Universitas Brawijaya",
    orderIndex: 41,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "f",
  },
  {
    id: "sos-3",
    name: "I Komang Bayu Krisna",
    role: "Staf Bidang Sosmas",
    department: "sosmas",
    level: "staf",
    major: "Teknik Industri",
    campus: "Universitas Merdeka Malang",
    orderIndex: 42,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "m",
  },

  // --- BIDANG DATA DAN INFORMASI (DDI) ---
  {
    id: "ddi-1",
    name: "I Putu Dimas Raditya",
    role: "Ketua Bidang DDI",
    department: "ddi",
    level: "kabid",
    major: "Ilmu Komunikasi",
    campus: "Universitas Brawijaya",
    orderIndex: 50,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "m",
  },
  {
    id: "ddi-2",
    name: "Ni Made Cindy Swari",
    role: "Staf Bidang DDI",
    department: "ddi",
    level: "staf",
    major: "Desain Komunikasi Visual",
    campus: "Universitas Negeri Malang",
    orderIndex: 51,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "f",
  },
  {
    id: "ddi-3",
    name: "I Wayan Teguh Santosa",
    role: "Staf Bidang DDI",
    department: "ddi",
    level: "staf",
    major: "Teknik Informatika",
    campus: "Politeknik Negeri Malang",
    orderIndex: 52,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "m",
  },

  // --- LEMBAGA NON-BIDANG: LEMBAGA KEWIRAUSAHAAN ---
  {
    id: "kwu-direktur",
    name: "I Gede Bagus Satria Wibawa",
    role: "Direktur Lembaga",
    department: "kewirausahaan",
    level: "direktur",
    major: "Ekonomi Pembangunan",
    campus: "Universitas Brawijaya",
    orderIndex: 60,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "m",
  },
  {
    id: "kwu-sekretaris",
    name: "Ni Luh Putu Ayu Wandira",
    role: "Sekretaris Lembaga",
    department: "kewirausahaan",
    level: "staf",
    major: "Manajemen Pemasaran",
    campus: "Universitas Negeri Malang",
    orderIndex: 61,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "f",
  },
  {
    id: "kwu-bendahara",
    name: "I Kadek Dwi Candra",
    role: "Bendahara Lembaga",
    department: "kewirausahaan",
    level: "staf",
    major: "Akuntansi",
    campus: "Universitas Brawijaya",
    orderIndex: 62,
    period: "2025 - 2027",
    instagram: "pc.kmhdimalang",
    gender: "m",
  },
];

export const organizationPillars = [
  {
    title: "Religius",
    desc: "Berlandaskan nilai-nilai luhur ajaran Weda dan memelihara keharmonisan spiritual dalam berpikir, berucap, dan bertindak demi tegaknya Dharma.",
  },
  {
    title: "Humanis",
    desc: "Menjunjung tinggi martabat kemanusiaan, nilai toleransi, persaudaraan universal (Vasudhaiva Kutumbakam), dan keadilan sosial bagi sesama.",
  },
  {
    title: "Nasionalis",
    desc: "Setia pada keutuhan Negara Kesatuan Republik Indonesia, Pancasila, UUD 1945, serta memelihara persatuan dalam kebinekaan nusantara.",
  },
  {
    title: "Progresif",
    desc: "Berpikir maju, adaptif terhadap kemajuan ilmu pengetahuan dan teknologi, serta berani menjadi agen perubahan dan pembaruan masyarakat.",
  },
];

export const organizationVision = "Terwujudnya kader mahasiswa Hindu yang berintelektual tinggi, berkarakter luhur, berwawasan kebangsaan, dan berdaya saing global untuk kemajuan umat dan bangsa.";

export const organizationMissions = [
  "Menyelenggarakan sistem kaderisasi yang berkualitas, berkelanjutan, dan relevan dengan tantangan zaman.",
  "Mengembangkan potensi intelektual, kepemimpinan, dan kewirausahaan mahasiswa Hindu di Kota Malang.",
  "Membangun sinergi kemitraan strategis dengan elemen pemuda, perguruan tinggi, pemerintah, dan masyarakat.",
  "Melaksanakan aksi pengabdian nyata bagi kemaslahatan umat Hindu dan masyarakat luas di Malang Raya.",
];
