import type { Metadata } from "next";
import { Handshake, Globe, Instagram } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { SafeImage } from "@/components/ui/SafeImage";

export const dynamic = "force-dynamic";

// The "| PC KMHDI Malang" suffix comes from the title template in the root layout.
export const metadata: Metadata = {
  title: "Mitra & Kolaborasi",
  description: "Daftar lembaga, organisasi, dan institusi yang berkolaborasi bersama PC KMHDI Malang dalam program kaderisasi dan pengabdian masyarakat.",
  alternates: { canonical: "/mitra" },
  openGraph: {
    type: "website",
    title: "Mitra & Kolaborasi | PC KMHDI Malang",
    description: "Daftar lembaga, organisasi, dan institusi yang berkolaborasi bersama PC KMHDI Malang.",
    url: "/mitra",
  },
};

export default async function MitraPage() {
  const { data: partners } = await supabaseAdmin.from("Partner").select("*").order("orderIndex", { ascending: true });
  const items = partners || [];

  return (
    <div className="-mt-32 bg-white dark:bg-[#0a0a0c] transition-colors min-h-screen pb-20">
      {/* Header Banner Merah Megah */}
      <div className="bg-gradient-to-br from-red-800 via-red-900 to-red-950 pt-44 pb-16 relative overflow-hidden">
        <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-red-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-rose-400/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-red-100 backdrop-blur-xl mb-4">
                <Handshake size={14} />
                Kolaborasi
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">Mitra & Kolaborasi Kami</h1>
              <p className="text-red-100/80 text-base sm:text-lg mt-3 max-w-2xl leading-relaxed">
                PC KMHDI Malang bekerja sama dengan berbagai lembaga, organisasi, dan institusi dalam mewujudkan program-program kaderisasi dan pengabdian masyarakat.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-2xl text-white text-xs font-bold shadow-lg">
              <span>{items.length} Mitra Terdaftar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Konten Grid Mitra */}
      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl transition-colors">
          {items.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Handshake size={40} className="mx-auto mb-4 opacity-40" />
              <p className="font-medium">Belum ada mitra yang ditambahkan.</p>
              <p className="text-sm text-slate-400 mt-1">Nantikan kabar kolaborasi terbaru dari PC KMHDI Malang.</p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-5 sm:gap-6">
              {items.map((partner) => {
                // Ikon Instagram/Situs Web yang benar-benar diisi saja yang ditampilkan, supaya
                // pengunjung memilih sendiri tujuannya kalau kedua tautan itu diisi.
                const links = [
                  partner.instagramUrl ? { href: partner.instagramUrl, icon: Instagram, label: "Instagram" } : null,
                  partner.websiteUrl ? { href: partner.websiteUrl, icon: Globe, label: "Situs Web" } : null,
                ].filter((link): link is { href: string; icon: typeof Instagram; label: string } => link !== null);

                return (
                  <div
                    key={partner.id}
                    className="group flex w-full max-w-45 sm:w-44 flex-col items-center rounded-2xl border border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-white/2 p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-red-200 dark:hover:border-red-500/30 hover:shadow-lg"
                  >
                    <div className="relative h-16 w-full">
                      <SafeImage src={partner.logoUrl} alt={partner.name} fill sizes="200px" className="object-contain" />
                    </div>
                    <p className="mt-4 min-h-[2.25rem] text-sm font-bold text-slate-800 dark:text-white line-clamp-2">{partner.name}</p>

                    {/* Baris ikon selalu dicadangkan tingginya, supaya tinggi kartu tetap rata walau sebagian mitra belum punya tautan */}
                    <div className="mt-3 flex min-h-[1.75rem] items-center gap-2">
                      {links.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`${partner.name} — kunjungi ${link.label}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-[#1c1c22] border border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500 shadow-sm transition-colors hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30"
                        >
                          <link.icon size={13} />
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
