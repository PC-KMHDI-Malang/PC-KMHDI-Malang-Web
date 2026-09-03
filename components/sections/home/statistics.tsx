import { statisticsData } from "@/data/statistics";
import { ScrollReveal, ScrollStagger, ScrollStaggerItem, CountUpOnScroll } from "@/components/ui/ScrollReveal";
import { CardCarousel } from "@/components/ui/CardCarousel";

function StatCard({ stat }: { stat: (typeof statisticsData.items)[number] }) {
  return (
    <div className="rounded-3xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#141417] p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-red-200 dark:hover:border-red-500/30 hover:shadow-xl hover:shadow-red-500/5 h-full">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/20">
        <stat.icon className="h-7 w-7 text-white" aria-hidden="true" />
      </div>
      <div className="mt-8 text-5xl font-bold bg-gradient-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-neutral-300 bg-clip-text text-transparent">
        <CountUpOnScroll value={stat.value} />
      </div>
      <div className="mt-3 text-base text-neutral-500 dark:text-neutral-400">{stat.label}</div>
    </div>
  );
}

export default function Statistics() {
  return (
    <section className="relative overflow-hidden bg-neutral-50/60 dark:bg-[#0f0f12] border-t border-b border-neutral-200/60 dark:border-white/10 py-20 sm:py-28 transition-colors duration-300">
      {/* Ambient Glow */}
      <div className="absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <ScrollReveal direction="up" delay={0.1}>
          <div className="mx-auto max-w-2xl lg:text-center">
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/40 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-400 shadow-sm">{statisticsData.badge}</span>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">{statisticsData.title}</h2>
            <p className="mt-6 text-lg leading-8 text-neutral-600 dark:text-neutral-400">{statisticsData.description}</p>
          </div>
        </ScrollReveal>

        {/* Mobile — active auto-playing carousel */}
        <div className="mt-12 sm:hidden">
          <CardCarousel>
            {statisticsData.items.map((stat) => (
              <StatCard key={stat.id} stat={stat} />
            ))}
          </CardCarousel>
        </div>

        {/* Tablet & up — full grid */}
        <ScrollStagger staggerDelay={0.12} className="mx-auto mt-16 hidden max-w-2xl grid-cols-2 gap-6 sm:grid lg:max-w-none xl:grid-cols-4">
          {statisticsData.items.map((stat) => (
            <ScrollStaggerItem key={stat.id}>
              <StatCard stat={stat} />
            </ScrollStaggerItem>
          ))}
        </ScrollStagger>
      </div>
    </section>
  );
}
