import { ArrowUpRight } from "lucide-react";
import { programsData } from "@/data/programs";

export default function Programs() {
  return (
    <section className="bg-gradient-to-br from-red-900 via-red-800 to-red-950 py-20 md:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
            {programsData.badge}
          </span>

          <h2 className="mt-6 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {programsData.title}
          </h2>

          <p className="mt-6 text-base leading-8 text-white md:text-lg">
            {programsData.description}
          </p>
        </div>

        {/* Cards */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {programsData.programs.map((program) => {
            const Icon = program.icon;

            return (
              <div
                key={program.id}
                className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-red-200 hover:shadow-2xl"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 transition-colors duration-300 group-hover:bg-red-700">
                  <Icon className="h-8 w-8 text-red-700 transition-colors duration-300 group-hover:text-white" />
                </div>

                <h3 className="mt-8 text-2xl font-bold text-slate-900">
                  {program.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  {program.description}
                </p>

                <button className="mt-8 inline-flex items-center gap-2 font-semibold text-red-700 transition-all duration-300 group-hover:gap-3">
                  Pelajari Program
                  <ArrowUpRight className="h-5 w-5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}