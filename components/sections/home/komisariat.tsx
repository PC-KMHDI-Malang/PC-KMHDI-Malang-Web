import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { komisariatData } from "@/data/komisariat";

export default function Komisariat() {
  return (
    <section className="bg-slate-50 py-16 md:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
            {komisariatData.badge}
          </span>

          <h2 className="mt-6 text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
            {komisariatData.title}
          </h2>

          <p className="mt-6 text-base leading-8 text-slate-600 md:text-lg">
            {komisariatData.description}
          </p>
        </div>

        {/* Grid */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {komisariatData.items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-red-200 hover:shadow-2xl"
            >
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50">
                  <Image
                    src={item.logo}
                    alt={item.university}
                    width={60}
                    height={60}
                    className="object-contain"
                  />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    {item.name}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {item.university}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center font-semibold text-red-700 transition-all group-hover:gap-3">
                Lihat Detail

                <ArrowRight className="ml-2 h-5 w-5" />
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 flex justify-center">
          <Link
            href={komisariatData.button.href}
            className="inline-flex items-center gap-2 rounded-2xl bg-red-700 px-7 py-4 font-semibold text-white transition hover:bg-red-800"
          >
            {komisariatData.button.label}

            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}