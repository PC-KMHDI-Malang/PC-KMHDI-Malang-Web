import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { organizationPillars, organizationVision, organizationMissions, allMembers, Member } from "@/data/organization";
import { OrganizationSection } from "@/components/organization/OrganizationSection";
import { Sparkles, Heart, Flag, TrendingUp, Target, Compass, ArrowRight, ShieldCheck, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

// The "| PC KMHDI Malang" suffix comes from the title template in the root layout.
export const metadata: Metadata = {
  title: "Profil & Struktur Kepengurusan",
  description: "Mengenal visi, misi, 4 pilar jati diri, dan susunan kepengurusan resmi PC KMHDI Malang masa bakti 2024-2026.",
  alternates: { canonical: "/profil" },
  openGraph: {
    type: "website",
    title: "Profil & Struktur Kepengurusan | PC KMHDI Malang",
    description: "Mengenal visi, misi, 4 pilar jati diri, dan susunan kepengurusan resmi PC KMHDI Malang.",
    url: "/profil",
  },
};

const pillarIcons = [Sparkles, Heart, Flag, TrendingUp];

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
        <section className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121215] p-8 sm:p-12 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={14} />
                Mengenal Lebih Dekat
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-snug">Pusat Gerak dan Kaderisasi Mahasiswa Hindu di Kota Pendidikan Malang</h2>
              <p className="text-slate-600 dark:text-neutral-400 leading-relaxed text-sm sm:text-base">
                PC KMHDI Malang didirikan sebagai ruang persatuan, pembinaan moral, dan pengasahan intelektual bagi mahasiswa Hindu dari berbagai perguruan tinggi negeri maupun swasta di Malang Raya. Sebagai kota pendidikan dengan ragam
                latar belakang budaya, Malang menjadi wadah strategis bagi kader Hindu untuk bertumbuh dan berjejaring secara nasional.
              </p>
              <p className="text-slate-600 dark:text-neutral-400 leading-relaxed text-sm sm:text-base">
                Berlandaskan semangat <strong>Dharma Eva Hato Hanti</strong> (Dharma yang ditegakkan akan melindungi), PC KMHDI Malang terus konsisten menyelenggarakan kaderisasi berjenjang, advokasi kemahasiswaan, kajian keagamaan
                kontemporer, dan pengabdian masyarakat nyata.
              </p>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 p-1.5 shadow-2xl">
                <div className="w-full h-full rounded-[22px] bg-white dark:bg-[#151518] flex flex-col items-center justify-center p-8 text-center">
                  <Image src="/image/Logo.webp" alt="Logo KMHDI" width={110} height={110} priority className="object-contain drop-shadow-md mb-4" />
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">PC KMHDI Malang</h3>
                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-1">Satyam Eva Jayate</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. 4 Jati Diri KMHDI */}
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

        {/* 4. Visi & Misi Organisasi */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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

        {/* 5. Susunan Struktur Kepengurusan (Bagan Bebas Overlap & Seluruh Kader Berfoto) */}
        <OrganizationSection members={members} />

        {/* 6. Call to Action */}
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
