import Link from "next/link";
import { CalendarDays, Eye, User as UserIcon } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";

interface NewsCardProps {
  slug: string;
  title: string;
  category: string;
  coverImage: string;
  authorName: string;
  createdAt: string;
}

export function NewsCard({ slug, title, category, coverImage, authorName, createdAt }: NewsCardProps) {
  const date = new Date(createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <Link
      href={`/berita/${slug}`}
      className="group block rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-[#111111] overflow-hidden hover:shadow-xl dark:hover:shadow-black/50 hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative h-44 bg-slate-100 dark:bg-slate-800/50 overflow-hidden">
        <SafeImage src={coverImage} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="flex flex-col items-center gap-1.5" title="Baca">
            <span className="w-10 h-10 flex items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
              <Eye size={18} />
            </span>
            <span className="text-white text-xs font-semibold drop-shadow">Baca</span>
          </span>
        </div>
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded-md text-[10px] font-bold uppercase tracking-wide">{category}</span>
        <span className="absolute bottom-3 left-3 inline-flex items-center px-2.5 py-1 bg-slate-900/70 text-white rounded-md text-[10px] font-semibold">{date}</span>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-white leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-red-600 dark:group-hover:text-rose-500 transition-colors">{title}</h3>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <UserIcon size={12} />
          <span className="font-medium truncate">{authorName || "Admin KMHDI"}</span>
        </div>
      </div>
    </Link>
  );
}
