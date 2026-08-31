import { statisticsData } from "@/data/statistics";

export default function Statistics() {
  return (
    <section className="bg-slate-50 dark:bg-[#0a0a0a] py-16 md:py-24 lg:py-32 transition-colors">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Header */}

        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full bg-red-100 dark:bg-red-950/40 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-400">
            {statisticsData.badge}
          </span>

          <h2 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            {statisticsData.title}
          </h2>

          <p className="mt-6 text-base leading-8 text-slate-600 dark:text-slate-400 md:text-lg">
            {statisticsData.description}
          </p>
        </div>

        {/* Statistics Grid */}

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {statisticsData.items.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="group rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#111111] p-8 shadow-lg dark:shadow-none transition-all duration-300 hover:-translate-y-2 hover:border-red-200 dark:hover:border-rose-900/40 hover:shadow-2xl dark:hover:shadow-black/40"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40 transition-colors duration-300 group-hover:bg-red-700">
                  <Icon className="h-7 w-7 text-red-700 dark:text-red-400 transition-colors duration-300 group-hover:text-white" />
                </div>

                <h3 className="mt-8 text-5xl font-bold text-slate-900 dark:text-white">
                  {item.value}
                </h3>

                <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}