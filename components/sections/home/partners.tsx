import Link from "next/link";
import { ArrowRight, Instagram, Globe } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { SafeImage } from "@/components/ui/SafeImage";
import { partnersData } from "@/data/partners";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

function PartnerLogo({ name, logoUrl, websiteUrl, instagramUrl }: { name: string; logoUrl: string; websiteUrl?: string | null; instagramUrl?: string | null }) {
  // Kalau Instagram maupun Situs Web diisi dua-duanya, tampilkan ikon kecil untuk masing-masing
  // supaya pengunjung yang memilih tujuannya sendiri — bukan salah satu dipilihkan otomatis.
  // Ikon yang belum diisi link-nya tidak ditampilkan sama sekali.
  const links = [
    instagramUrl ? { href: instagramUrl, icon: Instagram, label: "Instagram" } : null,
    websiteUrl ? { href: websiteUrl, icon: Globe, label: "Situs Web" } : null,
  ].filter((link): link is { href: string; icon: typeof Instagram; label: string } => link !== null);

  return (
    <div className="group relative shrink-0">
      {/* Tooltip ala gelembung chat: nama + ikon tautan (kalau ada) jadi satu baris, plus "ekor" segitiga menunjuk ke logo */}
      <div className="pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2 -translate-y-full scale-90 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100">
        <div className="relative flex items-center gap-2 whitespace-nowrap rounded-2xl bg-slate-900 dark:bg-white px-3.5 py-2 text-xs font-semibold text-white dark:text-slate-900 shadow-xl">
          <span>{name}</span>
          {links.length > 0 && (
            <span className="flex items-center gap-1 border-l border-white/20 dark:border-slate-900/15 pl-2">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={link.label}
                  className="pointer-events-auto flex h-5 w-5 items-center justify-center rounded-full bg-white/15 dark:bg-slate-900/10 transition-colors hover:bg-white/25 dark:hover:bg-slate-900/20"
                >
                  <link.icon size={11} />
                </a>
              ))}
            </span>
          )}
          <span className="absolute left-1/2 top-full -mt-1.5 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] bg-slate-900 dark:bg-white" />
        </div>
      </div>

      {/* Logo mitra biasanya PNG transparan — tampilkan apa adanya tanpa kotak/kartu pembungkus. */}
      <div className="relative h-24 w-56 opacity-70 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0">
        <SafeImage src={logoUrl} alt={name} fill sizes="224px" className="object-contain" />
      </div>
    </div>
  );
}

export default async function Partners() {
  const { data: dbPartners } = await supabaseAdmin.from("Partner").select("*").order("orderIndex", { ascending: true });

  // Belum ada mitra yang ditambahkan admin — tampilkan logo KMHDI sendiri sebagai default,
  // supaya section ini tidak pernah kosong di beranda.
  const partners = dbPartners && dbPartners.length > 0 ? dbPartners : [{ id: "fallback", name: partnersData.fallbackLogo.name, logoUrl: partnersData.fallbackLogo.logoUrl, websiteUrl: null, instagramUrl: null }];

  // Animasinya menggeser tepat -50% dari total lebar track, jadi track itu dibagi 2 "separuh"
  // yang harus identik. Supaya -50% itu tidak pernah menyisakan ruang kosong di layar lebar,
  // tiap separuh harus lebih lebar daripada layar terlebar yang realistis — bukan sekadar jumlah
  // salinan yang tetap, karena dengan sedikit mitra jumlah tetap bisa kalah lebar dari layar besar.
  const SLOT_WIDTH_PX = 264; // perkiraan lebar 1 logo (h-24 w-56 = 224px) + jarak gap-10 (40px)
  const TARGET_HALF_WIDTH_PX = 2600; // cukup lebar untuk monitor besar sekalipun
  const copiesPerHalf = Math.max(1, Math.ceil(TARGET_HALF_WIDTH_PX / SLOT_WIDTH_PX / partners.length));
  const loopItems = Array.from({ length: copiesPerHalf * 2 }, () => partners).flat();

  // Kecepatan geser dibuat konsisten (piksel/detik) berdasarkan lebar sebenarnya, supaya makin
  // banyak mitra tidak membuat animasinya jadi terasa buru-buru atau justru lambat sekali.
  const halfWidthPx = copiesPerHalf * partners.length * SLOT_WIDTH_PX;
  const marqueeDuration = Math.min(60, Math.max(15, Math.round(halfWidthPx / 80)));

  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#0c0c0e] py-16 md:py-20 transition-colors duration-300">
      {/* Ambient Glow, konsisten dengan section lain */}
      <div className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />

      <ScrollReveal direction="up" delay={0.1}>
        <p className="relative text-center text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-red-600 dark:text-red-400">{partnersData.trustedByLabel}</p>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.2} className="relative mt-10">
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-16 sm:w-40 bg-gradient-to-r from-white dark:from-[#0c0c0e] to-transparent transition-colors duration-300" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-16 sm:w-40 bg-gradient-to-l from-white dark:from-[#0c0c0e] to-transparent transition-colors duration-300" />
        {/* Berhenti bergulir saat kursor di atasnya, supaya logo & tooltip nyaman dilihat/diklik */}
        <div className="flex w-max animate-marquee marquee-pausable gap-10" style={{ animationDuration: `${marqueeDuration}s` }}>
          {loopItems.map((partner, index) => (
            <PartnerLogo key={`${partner.id}-${index}`} name={partner.name} logoUrl={partner.logoUrl} websiteUrl={partner.websiteUrl} instagramUrl={partner.instagramUrl} />
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.3} className="relative mt-12 flex justify-center">
        <Link
          href={partnersData.button.href}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-7 py-4 font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-300 hover:shadow-xl hover:shadow-red-600/30 hover:scale-[1.02]"
        >
          {partnersData.button.label}
          <ArrowRight size={18} />
        </Link>
      </ScrollReveal>
    </section>
  );
}
