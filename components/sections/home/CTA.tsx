import Link from "next/link";
import { ArrowRight, PhoneCall } from "lucide-react";

import { ctaData } from "@/data/cta";

export default function CTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-red-950 to-slate-950 py-24 md:py-32 lg:py-40">
      {/* Background Glow */}
      <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-red-600/20 blur-[100px] pointer-events-none" />
      <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-rose-500/15 blur-[100px] pointer-events-none" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-red-500/10 blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
        <div className="relative rounded-[2.5rem] border border-white/10 bg-white/5 p-10 md:p-16 text-center shadow-2xl backdrop-blur-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-red-200 backdrop-blur-xl">
            {ctaData.badge}
          </span>

          <h2 className="mt-8 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            <span className="bg-gradient-to-r from-white via-red-100 to-rose-200 bg-clip-text text-transparent">
              {ctaData.title}
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-slate-300 md:text-lg">
            {ctaData.description}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={ctaData.primaryButton.href} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-8 py-4 font-semibold text-white shadow-[0_0_32px_rgba(239,68,68,0.3)] hover:shadow-[0_0_48px_rgba(239,68,68,0.5)] hover:scale-[1.02] transition-all duration-300 sm:w-auto">
              {ctaData.primaryButton.label}
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href={ctaData.secondaryButton.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 hover:border-white/20 px-8 py-4 font-semibold transition-all duration-300 sm:w-auto"
            >
              <PhoneCall className="h-5 w-5" />
              {ctaData.secondaryButton.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
