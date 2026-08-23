import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
} from "lucide-react";

import { eventsData } from "@/data/event";

export default function Events() {
  return (
    <section className="bg-slate-50 py-16 md:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Header */}

        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
            {eventsData.badge}
          </span>

          <h2 className="mt-6 text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
            {eventsData.title}
          </h2>

          <p className="mt-6 text-base leading-8 text-slate-600 md:text-lg">
            {eventsData.description}
          </p>
        </div>

        {/* Cards */}

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {eventsData.events.map((event) => (
            <article
              key={event.id}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="relative h-60 overflow-hidden">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-110"
                />

                <div className="absolute left-5 top-5 rounded-2xl bg-red-700 px-4 py-2 text-center text-white shadow-lg">
                  <p className="text-xs uppercase">Event</p>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900">
                  {event.title}
                </h3>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-slate-600">
                    <CalendarDays className="h-5 w-5 text-red-700" />
                    <span>{event.date}</span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-600">
                    <Clock3 className="h-5 w-5 text-red-700" />
                    <span>{event.time}</span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin className="h-5 w-5 text-red-700" />
                    <span>{event.location}</span>
                  </div>
                </div>

                <Link
                  href={event.href}
                  className="mt-8 inline-flex items-center gap-2 font-semibold text-red-700 transition-all hover:gap-3"
                >
                  Lihat Detail

                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* CTA */}

        <div className="mt-16 flex justify-center">
          <Link
            href={eventsData.button.href}
            className="inline-flex items-center gap-2 rounded-2xl bg-red-700 px-7 py-4 font-semibold text-white transition hover:bg-red-800"
          >
            {eventsData.button.label}

            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}