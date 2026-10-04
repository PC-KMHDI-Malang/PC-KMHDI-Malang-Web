import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface KasPageHeaderProps {
  badge: string;
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
  action?: React.ReactNode;
}

// Banner merah yang sama persis dengan halaman /profile, dipakai bersama oleh /kas dan
// /kas/kelola supaya kedua halaman kas terasa satu keluarga dengan halaman akun kader lainnya.
export function KasPageHeader({ badge, title, description, backHref, backLabel, action }: KasPageHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-red-800 via-red-900 to-red-950 pt-44 pb-16 relative overflow-hidden">
      <div className="absolute left-0 top-0 h-48 w-48 rounded-full bg-red-500/20 blur-3xl pointer-events-none" />
      <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-rose-400/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-semibold text-red-100/80 hover:text-white transition-colors mb-6">
          <ArrowLeft size={16} />
          {backLabel}
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-red-100 backdrop-blur-xl mb-3">{badge}</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">{title}</h1>
            <p className="text-red-100/80 text-sm sm:text-base mt-2 max-w-xl">{description}</p>
          </div>

          {action}
        </div>
      </div>
    </div>
  );
}
