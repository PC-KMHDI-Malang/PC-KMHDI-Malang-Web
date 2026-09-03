import { statisticsData } from "@/data/statistics";

export default function Statistics() {
  return (
    <section className="relative overflow-hidden bg-neutral-50/60 border-t border-b border-neutral-200/60 py-20 sm:py-28">
      {/* Ambient Glow */}
      <div className="absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-2xl lg:text-center">
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm">{statisticsData.badge}</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">{statisticsData.title}</h2>
          <p className="mt-6 text-lg leading-8 text-neutral-600">{statisticsData.description}</p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:max-w-none xl:grid-cols-4">
          {statisticsData.items.map((stat) => (
            <div
              key={stat.id}
              className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-red-200 hover:shadow-xl hover:shadow-red-500/5"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/20">
                <stat.icon className="h-7 w-7 text-white" aria-hidden="true" />
              </div>
              <div className="mt-8 text-5xl font-bold bg-gradient-to-br from-zinc-900 to-zinc-600 bg-clip-text text-transparent">{stat.value}</div>
              <div className="mt-3 text-base text-neutral-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
