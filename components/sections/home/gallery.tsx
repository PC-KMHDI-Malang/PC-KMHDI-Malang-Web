import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { galleryData } from "@/data/gallery";

export default function Gallery() {
  const firstRow = galleryData.images.slice(0, 4);
  const secondRow = galleryData.images.slice(4);

  return (
    <section className="overflow-hidden bg-slate-50 py-20 md:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Header */}

        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
            {galleryData.badge}
          </span>

          <h2 className="mt-6 text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
            {galleryData.title}
          </h2>

          <p className="mt-6 text-base leading-8 text-slate-600 md:text-lg">
            {galleryData.description}
          </p>
        </div>
      </div>

      {/* ROW 1 */}

      <div className="relative mt-16">
        <div className="flex w-max animate-marquee gap-6">
          {[...firstRow, ...firstRow].map((image, index) => (
            <div
              key={index}
              className="relative h-72 w-[320px] overflow-hidden rounded-3xl shadow-xl"
            >
              <Image
                src={image}
                alt={`Gallery ${index + 1}`}
                fill
                className="object-cover transition duration-500 hover:scale-110"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ROW 2 */}

      <div className="relative mt-6">
        <div className="flex w-max animate-marquee-reverse gap-6">
          {[...secondRow, ...secondRow].map((image, index) => (
            <div
              key={index}
              className="relative h-72 w-[320px] overflow-hidden rounded-3xl shadow-xl"
            >
              <Image
                src={image}
                alt={`Gallery ${index + 5}`}
                fill
                className="object-cover transition duration-500 hover:scale-110"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Button */}

      <div className="mt-16 flex justify-center">
        <Link
          href={galleryData.button.href}
          className="inline-flex items-center gap-2 rounded-2xl bg-red-700 px-7 py-4 font-semibold text-white transition hover:bg-red-800"
        >
          {galleryData.button.label}

          <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}