import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

import { aboutData } from "@/data/about";
import GridBackground from "@/components/ui/GridBackground";

export default function About() {
  return (
    <section className="bg-white py-16 md:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Image */}

          <div className="relative">
            <div className="overflow-hidden rounded-[32px] shadow-2xl">
              <Image
                src={aboutData.image}
                alt={aboutData.title}
                width={700}
                height={800}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Floating Stats */}

            <div className="absolute -bottom-8 left-1/2 grid w-[90%] -translate-x-1/2 grid-cols-2 rounded-3xl border border-white/20 bg-white/90 p-6 shadow-xl backdrop-blur-xl">
              {aboutData.statistics.map((item) => (
                <div key={item.label} className="text-center">
                  <h3 className="text-2xl font-bold text-red-700 md:text-3xl">
                    {item.value}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}

          <div>
            <span className="inline-flex rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
              {aboutData.badge}
            </span>

            <h2 className="mt-6 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {aboutData.title}
            </h2>

            <p className="mt-6 text-base leading-8 text-slate-600 md:text-lg">
              {aboutData.description}
            </p>

            <div className="mt-10 space-y-6">
              {aboutData.features.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                    <CheckCircle2 className="h-5 w-5 text-red-700" />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {feature.title}
                    </h3>

                    <p className="mt-1 text-slate-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-10 rounded-2xl bg-red-700 px-8 py-4 font-semibold text-white transition hover:bg-red-800">
              Pelajari Lebih Lanjut
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}