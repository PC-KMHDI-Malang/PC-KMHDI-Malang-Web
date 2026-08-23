import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";

import { newsData } from "@/data/news";

export default function News() {
  return (
    <section className="bg-slate-50 py-16 md:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Header */}

        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
            {newsData.badge}
          </span>

          <h2 className="mt-6 text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
            {newsData.title}
          </h2>

          <p className="mt-6 text-base leading-8 text-slate-600 md:text-lg">
            {newsData.description}
          </p>
        </div>

        {/* Cards */}

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {newsData.news.map((item) => (
            <article
              key={item.id}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              {/* Image */}

              <div className="relative h-64 overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-110"
                />

                <span className="absolute left-5 top-5 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                  {item.category}
                </span>
              </div>

              {/* Content */}

              <div className="p-6">
                <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
                  <CalendarDays size={16} />

                  <span>{item.date}</span>
                </div>

                <h3 className="text-xl font-bold leading-snug text-slate-900 transition group-hover:text-red-700">
                  {item.title}
                </h3>

                <Link
                  href={item.href}
                  className="mt-8 inline-flex items-center gap-2 font-semibold text-red-700 transition hover:gap-3"
                >
                  Baca Selengkapnya

                  <ArrowRight size={18} />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Button */}

        <div className="mt-16 flex justify-center">
          <Link
            href={newsData.button.href}
            className="inline-flex items-center gap-2 rounded-2xl bg-red-700 px-7 py-4 font-semibold text-white transition duration-300 hover:bg-red-800"
          >
            {newsData.button.label}

            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}