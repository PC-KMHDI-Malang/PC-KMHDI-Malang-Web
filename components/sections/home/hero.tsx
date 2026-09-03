"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import CountUp from "react-countup";

import { heroData } from "@/data/hero";
import AnimatedWord from "@/components/ui/AnimatedWord";

export default function Hero() {
  return (
    <section className="relative -mt-32 overflow-hidden bg-gradient-to-b from-slate-950 via-red-950 to-slate-950 pt-36 pb-20 lg:pt-24">
      {/* Ambient Mesh Glows */}
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-red-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-rose-500/20 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none" />

      {/* Grid */}
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid min-h-screen items-center gap-12 py-12 lg:grid-cols-2">

          {/* IMAGE — appears first on mobile (order-1), right side on desktop (lg:order-2) */}
          <div className="relative flex justify-center lg:justify-end order-1 lg:order-2">
            {/* Decorative Ring */}
            <div className="absolute top-1/2 left-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 pointer-events-none sm:h-[420px] sm:w-[420px] lg:h-[520px] lg:w-[520px]" />

            <div className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-lg">
              <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-3 shadow-2xl shadow-red-950/30 backdrop-blur-2xl">
                <Image
                  src={heroData.image}
                  alt={heroData.title.first}
                  width={800}
                  height={800}
                  priority
                  className="h-auto w-full rounded-[2rem] object-cover"
                />
              </div>

              {/* Floating Card 1 - Bottom Left */}
              <div className="absolute -bottom-6 -left-2 z-20 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl backdrop-blur-2xl sm:-left-8 sm:p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white sm:h-12 sm:w-12">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white sm:text-xl">35+</h4>
                  <p className="text-xs text-slate-300 sm:text-sm">Tahun Pengabdian</p>
                </div>
              </div>

              {/* Floating Card 2 - Top Right */}
              <div className="absolute -right-2 -top-4 z-20 rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl backdrop-blur-2xl sm:-right-8 sm:-top-6 sm:p-5">
                <h4 className="text-xl font-bold text-emerald-400 sm:text-2xl">500+</h4>
                <p className="mt-1 text-xs text-slate-300 sm:text-sm">Kader Aktif</p>
              </div>
            </div>
          </div>

          {/* TEXT — appears second on mobile (order-2), left side on desktop (lg:order-1) */}
          <div className="order-2 lg:order-1">
            <h1 className="text-3xl font-extrabold leading-[1.1] sm:text-4xl lg:text-6xl">
              <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                {heroData.title.first}
              </span>{" "}
              <AnimatedWord words={heroData.title.animated} />
            </h1>

            <p className="mt-8 max-w-xl text-base leading-7 text-slate-300 md:text-lg">
              {heroData.description}
            </p>

            {/* Buttons */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              {heroData.buttons.map((button) => (
                <Link
                  key={button.label}
                  href={button.href}
                  className={
                    button.primary
                      ? "group inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-7 py-4 font-semibold text-white shadow-[0_0_32px_rgba(239,68,68,0.3)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_48px_rgba(239,68,68,0.5)]"
                      : "inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-7 py-4 font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:border-white/20"
                  }
                >
                  {button.label}
                  {button.primary && (
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  )}
                </Link>
              ))}
            </div>

            {/* Statistics */}
            <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
              {heroData.statistics.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/5 bg-white/5 p-5 text-center backdrop-blur-xl transition-all duration-300 hover:border-white/10 hover:bg-white/10"
                >
                  <h3 className="text-3xl font-bold text-white">
                    <CountUp end={Number(item.value)} duration={2} suffix="+" enableScrollSpy scrollSpyOnce />
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
