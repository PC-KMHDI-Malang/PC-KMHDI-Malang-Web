import Image from "next/image";

import { partnersData } from "@/data/partners";

export default function Partners() {
  return (
    <section className="bg-white py-16 md:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Header */}

        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
            {partnersData.badge}
          </span>

          <h2 className="mt-6 text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
            {partnersData.title}
          </h2>

          <p className="mt-6 text-base leading-8 text-slate-600 md:text-lg">
            {partnersData.description}
          </p>
        </div>

        {/* Logo Grid */}

        <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {partnersData.partners.map((partner) => (
            <div
              key={partner.id}
              className="
                group
                flex
                h-36
                items-center
                justify-center
                rounded-3xl
                border
                border-slate-200
                bg-white
                p-6
                shadow-md
                transition-all
                duration-300
                hover:-translate-y-2
                hover:border-red-200
                hover:shadow-xl
              "
            >
              <Image
                src={partner.logo}
                alt={partner.name}
                width={120}
                height={120}
                className="
                  h-auto
                  max-h-20
                  w-auto
                  object-contain
                  grayscale
                  transition
                  duration-300
                  group-hover:grayscale-0
                  group-hover:scale-110
                "
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}