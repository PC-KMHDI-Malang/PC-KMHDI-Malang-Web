import Link from "next/link";
import { ArrowRight, PhoneCall } from "lucide-react";

import { ctaData } from "@/data/cta";

export default function CTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-red-900 via-red-800 to-red-950 py-20 md:py-24 lg:py-32">
      {/* Background Glow */}

      <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-red-600/20 blur-[120px]" />

      <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-white/10 blur-[120px]" />

      <div className="relative mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
        <div className="rounded-[40px] border border-white/10 bg-white/10 p-10 text-center shadow-2xl backdrop-blur-2xl md:p-16">
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-red-100">
            {ctaData.badge}
          </span>

          <h2 className="mt-8 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            {ctaData.title}
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-red-100 md:text-lg">
            {ctaData.description}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={ctaData.primaryButton.href}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 font-semibold text-red-800 transition duration-300 hover:scale-105 sm:w-auto"
            >
              {ctaData.primaryButton.label}

              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href={ctaData.secondaryButton.href}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-8 py-4 font-semibold text-white backdrop-blur-xl transition duration-300 hover:bg-white/20 sm:w-auto"
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