import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { organizationPillars, organizationVision, organizationMissions, organizationInfo, allMembers, Member } from "@/data/organization";
import { OrganizationSection } from "@/components/organization/OrganizationSection";
import { HashCleanup } from "@/components/ui/HashCleanup";
import { TiltLogo } from "@/components/ui/TiltLogo";
import {
  Sparkles,
  Heart,
  Flag,
  TrendingUp,
  Target,
  Compass,
  ArrowRight,
  ShieldCheck,
  BookMarked,
  Flower2,
  MapPinned,
  CircleDot,
  Crown,
  Palette,
} from "lucide-react";

export const dynamic = "force-dynamic";

// The "| PC KMHDI Malang" suffix comes from the title template in the root layout.
export const metadata: Metadata = {
  title: "Profil & Struktur Kepengurusan",
  description: "Mengenal sejarah, makna logo, visi, misi, 4 pilar jati diri, dan susunan kepengurusan resmi PC KMHDI Malang masa bakti 2024-2026.",
  alternates: { canonical: "/profil" },
  openGraph: {
    type: "website",
    title: "Profil & Struktur Kepengurusan | PC KMHDI Malang",
    description: "Mengenal sejarah, makna logo, visi, misi, 4 pilar jati diri, dan susunan kepengurusan resmi PC KMHDI Malang.",
    url: "/profil",
  },
};

const pillarIcons = [Sparkles, Heart, Flag, TrendingUp];

// Linimasa singkat KMHDI — draft awal, silakan koreksi tanggal/detail pastinya.
const timeline = [
  { year: "3 Sep 1993", title: "KMHDI Lahir Secara Nasional", desc: "Kesatuan Mahasiswa Hindu Dharma Indonesia dideklarasikan sebagai wadah konsolidasi mahasiswa Hindu se-Indonesia." },
  { year: `${organizationInfo.establishedYear}`, title: "PC KMHDI Malang Berdiri", desc: "Pimpinan Cabang Malang dibentuk untuk menjadi rumah kaderisasi mahasiswa Hindu di Malang Raya." },
  { year: "Kini", title: "Terus Bertumbuh", desc: `Aktif menaungi ${organizationInfo.memberCount} dari berbagai kampus di Malang Raya melalui kaderisasi, kajian, dan pengabdian masyarakat.` },
];

// Makna elemen lambang — draft awal berdasarkan simbol yang tampak pada logo, silakan dikoreksi.
const logoMeanings = [
  {
    icon: Flower2,
    title: "Bunga Padma (Teratai)",
    desc: "Melambangkan kesucian dan tempat bersemayamnya nilai-nilai luhur — teratai tetap bersih walau tumbuh di lumpur, sebagaimana kader diharapkan menjaga jati diri di tengah tantangan zaman.",
  },
  {
    icon: CircleDot,
    title: "Swastika",
    desc: "Simbol suci dalam tradisi Hindu yang melambangkan keselamatan, kesejahteraan, dan keseimbangan semesta (Rwa Bhineda) — jauh lebih tua dari penyalahgunaannya di abad ke-20.",
  },
  {
    icon: MapPinned,
    title: "Peta Kepulauan Indonesia",
    desc: "Menegaskan wawasan kebangsaan KMHDI yang hadir dan bergerak dari Sabang sampai Merauke, bukan hanya di satu daerah.",
  },
  {
    icon: BookMarked,
    title: "Buku & Api yang Menyala",
    desc: "Buku terbuka melambangkan ilmu pengetahuan, sedangkan api di atasnya adalah semangat juang dan intelektualitas yang tak pernah padam.",
  },
  {
    icon: Crown,
    title: "Mahkota & Tanggal 3-09-1993",
    desc: "Mahkota melambangkan kehormatan dan kedaulatan organisasi, dengan tanggal lahir KMHDI secara nasional tertulis di pita bawahnya.",
  },
  {
    icon: Palette,
    title: "Warna Merah & Hitam",
    desc: "Merah menegaskan keberanian dan semangat juang kader, sementara hitam pada lingkar nama organisasi melambangkan keteguhan dan kedalaman spiritual.",
  },
];

export default async function ProfilPage() {
  // Query data pengurus dinamis dari database Supabase
  const { data: dbMembers } = await supabaseAdmin.from("Pengurus").select("*").order("orderIndex", { ascending: true });

  const members: Member[] =
    dbMembers && dbMembers.length > 0
      ? dbMembers.map((m) => ({
          id: m.id,
          name: m.name,
          role: m.role,
          department: m.department,
          level: m.level || "staf",
          campus: m.campus,
          major: m.major,
          imageUrl: m.imageUrl,
          instagram: m.instagram || "pc.kmhdimalang",
          orderIndex: m.orderIndex || 0,
          period: m.period || "2024 - 2026",
        }))
      : allMembers;

  return (
    <div className="-mt-32 bg-white dark:bg-[#0a0a0c] transition-colors min-h-screen pb-24">
      <HashCleanup />

      {/* 1. Hero Header Banner */}
      <div className="bg-gradient-to-br from-red-800 via-red-900 to-red-950 pt-44 pb-20 relative overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-red-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-rose-400/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-red-100 backdrop-blur-xl mb-4">
                <ShieldCheck size={14} />
                Tentang Organisasi
              </span>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">Profil &amp; Struktur Organisasi</h1>
              <p className="text-red-100/80 text-base sm:text-lg mt-3 max-w-3xl leading-relaxed">
                Pimpinan Cabang Kesatuan Mahasiswa Hindu Dharma Indonesia Malang sebagai wadah persatuan, kaderisasi, intelektual, dan pengabdian mahasiswa Hindu di Malang Raya.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8 -mt-8 space-y-16">
        {/* 2. Sejarah KMHDI */}
        <section id="sejarah" className="scroll-mt-28 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121215] p-8 sm:p-12 shadow-xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Perjalanan Kami</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2">Sejarah KMHDI</h2>
            <p className="text-slate-500 dark:text-neutral-400 text-sm sm:text-base mt-2 leading-relaxed">
              PC KMHDI Malang didirikan sebagai ruang persatuan, pembinaan moral, dan pengasahan intelektual bagi mahasiswa Hindu dari berbagai perguruan tinggi negeri maupun swasta di Malang Raya. Berlandaskan semangat{" "}
              <strong className="text-slate-700 dark:text-neutral-200">Dharma Eva Hato Hanti</strong> (Dharma yang ditegakkan akan melindungi), kami konsisten menyelenggarakan kaderisasi berjenjang, advokasi kemahasiswaan, kajian
              keagamaan kontemporer, dan pengabdian masyarakat nyata.
            </p>
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-5">
            {/* Garis penghubung linimasa (desktop: horizontal, mobile: vertical) */}
            <div className="hidden sm:block absolute top-5 left-[16.5%] right-[16.5%] h-0.5 bg-gradient-to-r from-red-200 via-red-400 to-red-200 dark:from-red-900/40 dark:via-red-600/60 dark:to-red-900/40" />
            <div className="sm:hidden absolute top-2 bottom-2 left-5 w-0.5 bg-gradient-to-b from-red-200 via-red-400 to-red-200 dark:from-red-900/40 dark:via-red-600/60 dark:to-red-900/40" />

            {timeline.map((item, idx) => (
              <div key={item.year} className="relative sm:text-center pl-14 sm:pl-0">
                <span className="absolute sm:static sm:mx-auto left-0 top-0 inline-flex items-center justify-center h-10 w-10 rounded-full bg-red-600 text-white text-sm font-black mb-4 shadow-md shadow-red-600/30 ring-4 ring-white dark:ring-[#121215]">
                  {idx + 1}
                </span>
                <p className="text-red-600 dark:text-red-400 font-black text-lg leading-none sm:mt-4">{item.year}</p>
                <h3 className="font-bold text-slate-900 dark:text-white mt-2.5">{item.title}</h3>
                <p className="text-slate-500 dark:text-neutral-400 text-sm mt-1.5 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Makna Logo */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121215] p-6 sm:p-10 shadow-xl">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="relative flex h-full w-full items-center justify-center min-h-96" style={{ perspective: 1000 }}>
                <div className="absolute h-4/5 w-4/5 rounded-full bg-red-500/10 dark:bg-red-500/15 blur-2xl" />
                <TiltLogo src="/image/Logo.webp" alt="Lambang PC KMHDI Malang" size={600} className="relative h-full w-full" />
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="mb-8">
                <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Filosofi Lambang</span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2">Makna di Balik Logo KMHDI</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {logoMeanings.map((item) => (
                  <div
                    key={item.title}
                    className="flex gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 hover:border-red-200 dark:hover:border-red-500/30 transition-colors"
                  >
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
                      <item.icon size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</h3>
                      <p className="text-slate-500 dark:text-neutral-400 text-xs mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. 4 Jati Diri KMHDI */}
        <section>
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Prinsip Perjuangan</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2">4 Jati Diri KMHDI</h2>
            <p className="text-slate-500 dark:text-neutral-400 text-sm sm:text-base mt-2">Empat nilai luhur yang menjiwai setiap gerak langkah dan sikap kader KMHDI.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {organizationPillars.map((pillar, index) => {
              const IconComponent = pillarIcons[index] || Sparkles;
              return (
                <div
                  key={pillar.title}
                  className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121215] p-7 shadow-lg hover:shadow-2xl hover:border-red-300 dark:hover:border-red-500/40 hover:-translate-y-1.5 transition-all duration-300 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 mb-5 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all">
                    <IconComponent size={26} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{pillar.title}</h3>
                  <p className="text-slate-600 dark:text-neutral-400 text-sm leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. Visi & Misi Organisasi */}
        <section id="visi-misi" className="scroll-mt-28 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Visi */}
          <div className="lg:col-span-5 rounded-3xl border border-red-200/80 dark:border-red-900/40 bg-gradient-to-br from-red-600 to-rose-700 p-8 sm:p-10 text-white shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6">
                <Target size={26} className="text-white" />
              </div>
              <span className="text-xs font-bold text-red-200 uppercase tracking-widest">Arah Gerak Utama</span>
              <h3 className="text-2xl sm:text-3xl font-black mt-2 leading-tight">Visi Organisasi</h3>
              <p className="mt-6 text-red-50 text-base sm:text-lg leading-relaxed italic">&ldquo;{organizationVision}&rdquo;</p>
            </div>
            <div className="pt-8 border-t border-white/20 mt-8 text-xs text-red-100 font-semibold">
              <span>PC KMHDI Malang Menuju Era Keemasan</span>
            </div>
          </div>

          {/* Misi */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121215] p-8 sm:p-10 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
                <Compass size={24} />
              </div>
              <div>
                <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Langkah Strategis</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Misi Organisasi</h3>
              </div>
            </div>

            <div className="space-y-4">
              {organizationMissions.map((mission, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#18181c] border border-slate-100 dark:border-white/5">
                  <div className="w-8 h-8 rounded-xl bg-red-600 text-white font-bold text-sm shrink-0 flex items-center justify-center shadow-md">{idx + 1}</div>
                  <p className="text-slate-700 dark:text-neutral-300 text-sm sm:text-base leading-relaxed font-medium">{mission}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Susunan Struktur Kepengurusan (Bagan Bebas Overlap & Seluruh Kader Berfoto) */}
        <OrganizationSection members={members} />

        {/* 7. Call to Action */}
        <section className="rounded-3xl bg-gradient-to-r from-red-700 via-rose-700 to-red-800 p-8 sm:p-12 text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl sm:text-3xl font-black">Ingin Bergabung atau Berkolaborasi?</h3>
            <p className="text-red-100 mt-2 max-w-xl text-sm sm:text-base leading-relaxed">Kami membuka pintu selebar-lebarnya bagi mahasiswa Hindu di Kota Malang dan lembaga mitra untuk berproses dan berkarya bersama.</p>
          </div>
          <Link
            href="https://wa.me/6287774230949?text=Halo%20Admin%20PC%20KMHDI%20Malang%2C%20saya%20tertarik%20untuk%20bergabung%20atau%20berkolaborasi."
            target="_blank"
            rel="noopener noreferrer"
            className="self-start md:self-auto inline-flex items-center gap-2 rounded-2xl bg-white text-red-900 font-bold px-7 py-4 shadow-xl hover:bg-neutral-100 hover:scale-105 transition-all text-sm shrink-0"
          >
            Hubungi Pengurus
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </div>
  );
}
