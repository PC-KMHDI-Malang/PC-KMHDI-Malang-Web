import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

import { aboutData } from "@/data/about";
import { ScrollReveal, ScrollStagger, ScrollStaggerItem, CountUpOnScroll } from "@/components/ui/ScrollReveal";

export default function About() {
  return (
    <section id="tentang" className="relative overflow-hidden bg-white dark:bg-[#0c0c0e] py-16 md:py-24 lg:py-32 transition-colors duration-300">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left Column: Image & Floating Stats */}
          <div className="relative pb-16 md:pb-0">
            <ScrollReveal direction="left" delay={0.1} duration={0.8}>
              <div className="overflow-hidden rounded-[2.5rem] shadow-2xl ring-1 ring-slate-200 dark:ring-white/10">
                <Image src={aboutData.image} alt={aboutData.title} width={700} height={800} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
              </div>
            </ScrollReveal>

            {/* Floating Stats */}
            <ScrollReveal direction="up" delay={0.3} duration={0.8} className="absolute -bottom-6 left-1/2 w-[92%] -translate-x-1/2">
              <div className="grid grid-cols-4 gap-4 rounded-2xl border border-slate-100 dark:border-white/10 bg-white/95 dark:bg-[#141417]/95 p-5 shadow-xl backdrop-blur-2xl">
                {aboutData.statistics.map((item) => (
                  <div key={item.label} className="text-center">
                    <h3 className="text-2xl font-bold bg-gradient-to-br from-red-600 to-rose-500 bg-clip-text text-transparent md:text-3xl">
                      <CountUpOnScroll value={item.value} />
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 dark:text-neutral-400 sm:text-sm font-medium">{item.label}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Content */}
          <div>
            <ScrollReveal direction="right" delay={0.15}>
              <span className="inline-flex items-center gap-2 rounded-full border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/40 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-400">{aboutData.badge}</span>

              <h2 className="mt-6 text-3xl font-bold leading-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">{aboutData.title}</h2>

              <p className="mt-6 text-base leading-8 text-slate-600 dark:text-neutral-400 md:text-lg">{aboutData.description}</p>
            </ScrollReveal>

            <ScrollStagger staggerDelay={0.1} className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {aboutData.features.map((feature) => (
                <ScrollStaggerItem key={feature.title}>
                  <div className="group rounded-2xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-[#141417] p-5 transition-all duration-300 hover:-translate-y-2 hover:border-red-200 dark:hover:border-red-500/30 hover:shadow-lg h-full">
                    <div className="mb-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/60 transition-colors group-hover:bg-red-200 dark:group-hover:bg-red-900/60">
                      <CheckCircle2 className="h-5 w-5 text-red-700 dark:text-red-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-neutral-400">{feature.description}</p>
                  </div>
                </ScrollStaggerItem>
              ))}
            </ScrollStagger>

            <ScrollReveal direction="up" delay={0.4}>
              <Link
                href="/profil"
                className="mt-10 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-7 py-4 font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-300 hover:shadow-xl hover:shadow-red-600/30 hover:scale-[1.02]"
              >
                Pelajari Profil Lengkap
                <ArrowRight size={18} />
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
