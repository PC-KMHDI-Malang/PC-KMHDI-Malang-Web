"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CountUp from "react-countup";

import { heroData } from "@/data/hero";
import AnimatedWord from "@/components/ui/AnimatedWord";

export default function Hero() {
  return (
    <section className="relative -mt-32 overflow-hidden bg-gradient-to-b from-red-800 via-red-900 to-red-950 pt-36 pb-20 lg:pt-24">
      {/* Background Glow */}

      <div className="absolute left-0 top-0 h-50 w-50 rounded-full bg-red-500/20 blur-3xl pointer-events-none" />

      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-red-400/10 blur-3xl pointer-events-none" />

      {/* Grid */}

      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid min-h-screen items-center gap-7 py-12 lg:grid-cols-2">
          {/* LEFT */}

          <div>
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-red-100 backdrop-blur-xl">{heroData.badge}</span>

            <h1 className="mt-4 text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-5xl">
              {heroData.title.first} <AnimatedWord words={heroData.title.animated} />
            </h1>

            <p className="mt-8 max-w-xl text-base leading-7 text-red-50 md:text-lg">{heroData.description}</p>

            {/* Button */}

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              {heroData.buttons.map((button) => (
                <Link
                  key={button.label}
                  href={button.href}
                  className={
                    button.primary
                      ? "inline-flex items-center justify-center rounded-2xl bg-white px-7 py-4 font-semibold text-red-900 transition hover:scale-105"
                      : "inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-7 py-4 font-semibold text-white backdrop-blur-xl transition hover:bg-white/20"
                  }
                >
                  {button.label}

                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ))}
            </div>

            {/* Statistics */}

            <div className="mt-16 grid grid-cols-2 gap-5 md:grid-cols-4">
              {heroData.statistics.map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-white/10 p-5 text-center backdrop-blur-xl">
                  <h3 className="text-3xl font-bold text-white">
                    <CountUp end={Number(item.value)} duration={1} suffix="+" enableScrollSpy scrollSpyOnce />
                  </h3>

                  <p className="mt-2 text-sm text-red-100">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}

          <div className="relative">
            <div className="overflow-hidden rounded-[40px] border border-white/10 bg-white/10 p-4 backdrop-blur-2xl">
              <Image src={heroData.image} alt={heroData.title.first} width={800} height={800} priority className="h-auto w-full rounded-[20px] object-cover" />
            </div>

            {/* Floating Card */}

            <div className="absolute -bottom-8 left-1/2 w-[260px] -translate-x-1/2 rounded-3xl border border-white/10 bg-white/15 p-6 backdrop-blur-3xl">
              <h4 className="text-center text-3xl font-bold text-white">35+</h4>

              <p className="mt-2 text-center text-sm text-red-100">Tahun Pengabdian</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
