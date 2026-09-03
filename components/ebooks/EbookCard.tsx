"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";

interface EbookCardProps {
  id: string;
  title: string;
  genre: string;
  coverImage: string;
  pdfUrl?: string | null;
  createdAt: string;
  href: string;
}

export function EbookCard({ title, genre, coverImage, pdfUrl, createdAt, href }: EbookCardProps) {
  const date = new Date(createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  const year = new Date(createdAt).getFullYear();

  return (
    <div className="group block rounded-xl border border-rose-100 dark:border-white/10 bg-white dark:bg-[#141417] overflow-hidden shadow-sm hover:shadow-xl hover:border-red-300 dark:hover:border-red-500/40 hover:-translate-y-1 transition-all duration-300 relative">
      <Link href={href} className="absolute inset-0 z-0" aria-label={`View ${title}`} />

      <div className="relative h-48 bg-neutral-100 dark:bg-neutral-900 overflow-hidden pointer-events-none">
        <SafeImage src={coverImage} alt={title} fill unoptimized className="object-cover transition-transform duration-500" />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 z-20 pointer-events-auto">
          <Link href={href} className="flex flex-col items-center group/btn hover:scale-110 transition-transform">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white mb-2 shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300 ease-out">
              <Eye size={22} />
            </div>
            <span className="text-white font-bold text-xs drop-shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">View</span>
          </Link>
        </div>

        {/* Top left genre badge */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-red-600 rounded text-[10px] font-bold text-white uppercase tracking-wider z-10">{genre}</div>

        {/* Bottom left date badge */}
        <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-zinc-900/90 rounded text-[11px] font-bold text-white z-10">{date}</div>
      </div>

      <div className="p-4 bg-white dark:bg-[#141417] pointer-events-none">
        <h3 className="font-bold text-[13px] text-zinc-900 dark:text-white leading-tight line-clamp-2 min-h-[2rem] group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors uppercase">{title}</h3>

        <div className="mt-4 flex flex-col gap-0.5 text-[11px]">
          <span className="text-neutral-500 font-medium">PC KMHDI Malang</span>
          <span className="text-zinc-900 dark:text-white font-bold">{year}</span>
        </div>
      </div>
    </div>
  );
}
