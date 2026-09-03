import { ArrowUpRight } from "lucide-react";
import { programsData } from "@/data/programs";

export default function Programs() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-red-900 via-red-800 to-red-950 py-24 sm:py-32">
      {/* Ambient Mesh Glows */}
      <div className="absolute -left-20 top-20 h-[400px] w-[400px] rounded-full bg-white/5 blur-[100px] pointer-events-none" />
      <div className="absolute -right-20 bottom-20 h-[400px] w-[400px] rounded-full bg-rose-500/10 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-red-100 backdrop-blur-xl">{programsData.badge}</span>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">{programsData.title}</h2>
          <p className="mt-6 text-base leading-8 text-red-100/70 md:text-lg">{programsData.description}</p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-5 sm:grid-cols-2 lg:max-w-none xl:grid-cols-3">
          {programsData.programs.map((program) => (
            <div
              key={program.id}
              className="group rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-white/20 hover:bg-white/10 hover:shadow-xl hover:shadow-black/20"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-rose-600 group-hover:shadow-lg group-hover:shadow-red-500/20">
                <program.icon className="h-7 w-7 text-red-300 transition-colors duration-300 group-hover:text-white" aria-hidden="true" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-white">{program.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-red-100/70">{program.description}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-red-300 transition-all duration-300 group-hover:gap-3 group-hover:text-white">
                Pelajari Program <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}