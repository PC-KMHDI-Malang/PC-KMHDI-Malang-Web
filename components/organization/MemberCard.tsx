"use client";

import Image from "next/image";
import { Member } from "@/data/organization";
import { GraduationCap, Instagram } from "lucide-react";

interface MemberCardProps {
  member: Member;
  featured?: boolean;
}

export function MemberCard({ member, featured = false }: MemberCardProps) {
  const isBPH = member.department === "bph";
  const photo = member.imageUrl;

  return (
    <div
      className={`group relative rounded-3xl border overflow-hidden transition-all duration-300 flex flex-col bg-white dark:bg-[#121215] ${
        featured
          ? "border-red-300 dark:border-red-900/50 shadow-xl hover:shadow-2xl hover:-translate-y-2 ring-1 ring-red-500/20"
          : "border-slate-200/80 dark:border-white/10 shadow-md hover:shadow-xl hover:border-red-300 dark:hover:border-red-900/40 hover:-translate-y-1.5"
      }`}
    >
      {/* Pasfoto Resmi Frame */}
      <div className={`relative w-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-red-800 via-red-900 to-slate-950 ${featured ? "h-64 sm:h-72" : "h-56 sm:h-60"}`}>
        {photo ? (
          <Image src={photo} alt={member.name} fill className="object-cover object-top group-hover:scale-105 transition-transform duration-500" />
        ) : (
          /* Pasfoto Resmi Jas Organisasi Silhouette */
          <div className="relative w-full h-full flex flex-col items-center justify-end overflow-hidden">
            {/* Studio lighting ring */}
            <div className="absolute top-8 w-32 h-32 rounded-full bg-red-400/20 blur-2xl pointer-events-none" />

            <svg viewBox="0 0 100 100" fill="none" className="w-40 h-40 text-slate-900 group-hover:scale-105 transition-transform duration-500">
              <circle cx="50" cy="38" r="28" fill="#FFFFFF" fillOpacity="0.08" />
              <circle cx="50" cy="34" r="16" fill="#1E293B" />
              <path d="M20 90 C22 66 32 56 42 56 L58 56 C68 56 78 66 80 90 Z" fill="#0F172A" />
              <path d="M42 56 L50 70 L58 56 L54 56 L50 64 L46 56 Z" fill="#FFFFFF" />
              <path d="M48 64 L52 64 L51 78 L49 78 Z" fill="#DC2626" />
              <circle cx="34" cy="68" r="2.5" fill="#EF4444" stroke="#FDE047" strokeWidth="0.8" />
            </svg>

            {/* Inisial Medallion */}
            <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-xs flex items-center justify-center shadow">
              {member.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
          </div>
        )}

        {/* Gradient shadow for text protection */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70 group-hover:opacity-60 transition-opacity" />

        {/* Jabatan Badge */}
        <span
          className={`absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide shadow-md ${
            isBPH ? "bg-gradient-to-r from-red-600 to-rose-600 text-white border border-red-400/40" : "bg-slate-900/90 text-red-200 border border-white/10 backdrop-blur-md"
          }`}
        >
          {member.role}
        </span>
      </div>

      {/* Informasi Anggota */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">{member.name}</h4>

          <div className="mt-2.5 space-y-1 text-xs text-slate-500 dark:text-neutral-400">
            <p className="flex items-center gap-1.5 font-medium">
              <GraduationCap size={14} className="text-red-600 shrink-0" />
              <span className="truncate">{member.campus}</span>
            </p>
            <p className="text-[11px] text-slate-400 dark:text-neutral-500 pl-5 truncate">{member.major}</p>
          </div>
        </div>

        {/* Footer info: Social Media / Instagram */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 tracking-wider uppercase">{member.department.toUpperCase()}</span>

          {member.instagram ? (
            <a
              href={`https://instagram.com/${member.instagram.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-600 dark:hover:text-rose-400 transition-colors"
            >
              <Instagram size={13} />
              <span>@{member.instagram.replace(/^@/, "")}</span>
            </a>
          ) : (
            <a href="https://instagram.com/pc.kmhdimalang" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-600 dark:hover:text-rose-400 transition-colors">
              <Instagram size={13} />
              <span>@pc.kmhdimalang</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
