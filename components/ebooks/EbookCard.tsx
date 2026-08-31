import Link from "next/link";
import { Heart, CalendarDays, BookMarked } from "lucide-react";

interface EbookCardProps {
  id: string;
  title: string;
  genre: string;
  coverImage: string;
  createdAt: string;
  href: string;
}

export function EbookCard({ title, genre, coverImage, createdAt, href }: EbookCardProps) {
  const date = new Date(createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-[#111111] overflow-hidden hover:shadow-xl dark:hover:shadow-black/50 hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative h-44 bg-slate-100 dark:bg-slate-800/50 overflow-hidden">
        <img src={coverImage} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded-md text-[10px] font-bold uppercase tracking-wide">
          <BookMarked size={11} />
          {genre}
        </span>
        <button
          type="button"
          title="Favorit"
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 dark:bg-black/50 backdrop-blur text-slate-500 dark:text-slate-300 hover:text-red-600 dark:hover:text-rose-500 transition-colors"
        >
          <Heart size={14} />
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-white leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-red-600 dark:group-hover:text-rose-500 transition-colors">
          {title}
        </h3>

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-red-600 dark:text-rose-500">
            <CalendarDays size={12} />
            {date}
          </span>
          <span className="text-slate-400 dark:text-slate-500">{genre}</span>
        </div>
      </div>
    </Link>
  );
}
