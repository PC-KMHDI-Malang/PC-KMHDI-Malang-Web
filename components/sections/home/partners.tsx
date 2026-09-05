import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { partnersData } from "@/data/partners";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { PartnerLogo } from "./PartnerLogo";

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
