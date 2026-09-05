import type { Metadata } from "next";
import { Hammer, Sparkles, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Program Kerja",
  description: "Halaman program kerja PC KMHDI Malang sedang dalam proses pengerjaan.",
  alternates: { canonical: "/program" },
  // Halaman placeholder ini ditaut dari Navbar (submenu Profil), jadi Google akan tetap
  // menemukannya walau sengaja tidak dimasukkan ke sitemap.ts — noindex mencegah halaman
  // "dalam pengerjaan" ini nongol di hasil pencarian dan dianggap konten tipis oleh Google.
  robots: { index: false, follow: true },
};

export default function ProgramPage() {
  return (
    <div className="-mt-32 flex min-h-screen items-center justify-center bg-white dark:bg-[#0a0a0c] px-5 pt-32 pb-20 transition-colors">
      <div className="relative mx-auto max-w-xl text-center">
        {/* Ambient glow */}
        <div className="absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/10 blur-3xl" />

        <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/20" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-red-600 to-rose-600 shadow-xl shadow-red-600/30">
            <Hammer size={34} className="text-white animate-[wiggle_1.8s_ease-in-out_infinite]" />
          </div>
          <Sparkles size={18} className="absolute -right-1 -top-1 text-amber-400 animate-pulse" />
        </div>

        <span className="inline-flex items-center gap-2 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/40 px-4 py-1.5 text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">
          <Clock size={13} />
          Dalam Proses Pengerjaan
        </span>

        <h1 className="mt-5 text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Halaman Program Kerja</h1>
        <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-500 dark:text-neutral-400">
          Kami sedang menyiapkan halaman ini untuk menampilkan program kerja PC KMHDI Malang secara lengkap. Nantikan kabar terbarunya, ya!
        </p>
      </div>

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-12deg); }
          50% { transform: rotate(12deg); }
        }
      `}</style>
    </div>
  );
}
