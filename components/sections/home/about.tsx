import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { aboutData } from "@/data/about";

export default function About() {
  return (
    <section id="tentang" className="relative overflow-hidden bg-white py-16 md:py-24 lg:py-32">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Image */}
          <div className="relative pb-16 md:pb-0">
            <div className="overflow-hidden rounded-[2.5rem] shadow-2xl ring-1 ring-slate-200">
              <Image
                src={aboutData.image}
                alt={aboutData.title}
                width={700}
                height={800}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Floating Stats */}
            <div className="absolute -bottom-6 left-1/2 grid w-[92%] -translate-x-1/2 grid-cols-4 gap-4 rounded-2xl border border-slate-100 bg-white/95 p-5 shadow-xl backdrop-blur-2xl">
              {aboutData.statistics.map((item) => (
                <div key={item.label} className="text-center">
                  <h3 className="text-2xl font-bold bg-gradient-to-br from-red-600 to-rose-500 bg-clip-text text-transparent md:text-3xl">
                    {item.value}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
              {aboutData.badge}
            </span>

            <h2 className="mt-6 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {aboutData.title}
            </h2>

            <p className="mt-6 text-base leading-8 text-slate-600 md:text-lg">
              {aboutData.description}
            </p>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {aboutData.features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-slate-100 bg-slate-50 p-5 transition-all duration-300 hover:-translate-y-2 hover:border-red-200 hover:shadow-lg"
                >
                  <div className="mb-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 transition-colors group-hover:bg-red-200">
                    <CheckCircle2 className="h-5 w-5 text-red-700" />
                  </div>
                  <h3 className="font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20ingin%20bertanya%20tentang%20KMHDI%20Malang."
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-block rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-8 py-4 font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-2 hover:shadow-xl hover:shadow-red-600/30"
            >
              Pelajari Lebih Lanjut
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}