"use client";

import { useState } from "react";
import Image from "next/image";
import { departmentsInfo, organizationInfo, Member } from "@/data/organization";
import { MemberCard } from "./MemberCard";
import {
  GraduationCap,
  Users,
  Network,
  Grid3X3,
  CheckCircle2,
  Layers,
} from "lucide-react";

// Komponen Kotak Node Pimpinan (Ketua, Sekre, Benda, Wakil, Kabiro, Direktur)
function ChartNode({
  member,
  highlight = false,
  badgeColor = "red",
}: {
  member: Member;
  highlight?: boolean;
  badgeColor?: "red" | "gold" | "slate" | "crimson";
}) {
  const badgeStyles = {
    red: "bg-red-600 text-white border-red-500",
    gold: "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400 shadow-amber-500/20",
    slate: "bg-slate-800 text-slate-200 border-slate-700",
    crimson: "bg-gradient-to-r from-red-700 to-rose-700 text-white border-red-600",
  }[badgeColor];

  const photo = member.imageUrl;

  return (
    <div
      className={`relative w-full max-w-[210px] sm:max-w-[230px] rounded-2xl border bg-white dark:bg-[#121215] p-3 sm:p-3.5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center z-10 ${
        highlight
          ? "border-red-400 dark:border-red-600 ring-2 ring-red-500/20 shadow-red-500/10"
          : "border-slate-200/90 dark:border-white/10 hover:border-red-300 dark:hover:border-red-800"
      }`}
    >
      {/* Lencana Jabatan */}
      <span
        className={`inline-block text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs mb-2 border ${badgeStyles} truncate max-w-full`}
      >
        {member.role}
      </span>

      {/* Pasfoto Resmi */}
      <div className="relative w-16 h-20 sm:w-18 sm:h-22 rounded-xl overflow-hidden bg-gradient-to-br from-red-800 via-red-900 to-slate-950 mb-2 shadow-inner border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
        {photo ? (
          <Image
            src={photo}
            alt={member.name}
            fill
            className="object-cover object-top"
          />
        ) : (
          <div className="relative w-full h-full flex items-end justify-center">
            <svg viewBox="0 0 100 100" fill="none" className="w-18 h-18 text-slate-900">
              <circle cx="50" cy="38" r="26" fill="#FFFFFF" fillOpacity="0.08" />
              <circle cx="50" cy="34" r="15" fill="#1E293B" />
              <path d="M20 90 C22 66 32 56 42 56 L58 56 C68 56 78 66 80 90 Z" fill="#0F172A" />
              <path d="M42 56 L50 70 L58 56 L54 56 L50 64 L46 56 Z" fill="#FFFFFF" />
              <path d="M48 64 L52 64 L51 78 L49 78 Z" fill="#DC2626" />
              <circle cx="34" cy="68" r="2.5" fill="#EF4444" stroke="#FDE047" strokeWidth="0.8" />
            </svg>
            <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white/15 backdrop-blur text-white text-[7px] font-black flex items-center justify-center">
              {member.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
          </div>
        )}
      </div>

      {/* Nama & Kampus */}
      <h4 className="font-extrabold text-xs sm:text-[13px] text-slate-900 dark:text-white leading-snug line-clamp-2">
        {member.name}
      </h4>

      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-neutral-400 mt-1 flex items-center justify-center gap-1 font-medium max-w-full">
        <GraduationCap size={11} className="text-red-600 shrink-0" />
        <span className="truncate">{member.campus}</span>
      </p>

      <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5 block truncate max-w-full">
        {member.major}
      </span>
    </div>
  );
}

// Komponen Kotak Foto Staf Biro / Pengurus Lembaga (Tanpa label pill "Staf Biro" agar bersih dan rapi)
function StafChartCard({
  member,
  showRole = false,
}: {
  member: Member;
  showRole?: boolean;
}) {
  const photo = member.imageUrl;

  return (
    <div className="w-full rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#161619] p-2 sm:p-2.5 shadow-xs hover:shadow-md transition-all flex items-center gap-2.5 text-left">
      {/* Pasfoto Staf */}
      <div className="relative w-10 h-12 sm:w-11 sm:h-13 rounded-xl overflow-hidden bg-gradient-to-br from-red-800 via-red-900 to-slate-950 shrink-0 border border-slate-200 dark:border-white/10 flex items-center justify-center">
        {photo ? (
          <Image
            src={photo}
            alt={member.name}
            fill
            className="object-cover object-top"
          />
        ) : (
          <div className="relative w-full h-full flex items-end justify-center">
            <svg viewBox="0 0 100 100" fill="none" className="w-11 h-11 text-slate-900">
              <circle cx="50" cy="34" r="14" fill="#1E293B" />
              <path d="M22 90 C24 68 32 58 42 58 L58 58 C68 58 76 68 78 90 Z" fill="#0F172A" />
              <path d="M44 58 L50 70 L56 58 Z" fill="#FFFFFF" />
              <path d="M48 64 L52 64 L51 76 L49 76 Z" fill="#DC2626" />
            </svg>
            <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-white/20 text-white text-[7px] font-black flex items-center justify-center">
              {member.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
          </div>
        )}
      </div>

      {/* Identitas Kader */}
      <div className="min-w-0 flex-1">
        {showRole && (
          <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 inline-block mb-1 truncate max-w-full border border-red-100 dark:border-red-900/30">
            {member.role}
          </span>
        )}
        <h5 className="font-bold text-[11px] sm:text-xs text-slate-900 dark:text-white truncate leading-tight">
          {member.name}
        </h5>
        <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-neutral-400 truncate mt-0.5">
          {member.campus}
        </p>
        <p className="text-[8px] sm:text-[9px] text-slate-400 dark:text-neutral-500 truncate">
          {member.major}
        </p>
      </div>
    </div>
  );
}

export function OrganizationSection({ members }: { members: Member[] }) {
  const [activeView, setActiveView] = useState<"tree" | "grid">("tree");
  const [activeDeptTab, setActiveDeptTab] = useState<string>("all");

  // Urutkan seluruh kader berdasarkan orderIndex
  const sortedMembers = [...members].sort((a, b) => a.orderIndex - b.orderIndex);

  // 1. PIMPINAN CABANG (BPH)
  // Ketua Cabang (paling tinggi)
  const ketua =
    sortedMembers.find(
      (m) => m.department === "bph" && m.role.toLowerCase().includes("ketua") && !m.role.toLowerCase().includes("wakil")
    ) || sortedMembers[0];

  // Sekretaris Cabang & Wakil
  const sekretaris = sortedMembers.find(
    (m) => m.department === "bph" && m.role.toLowerCase().includes("sekretaris") && !m.role.toLowerCase().includes("wakil")
  );
  const wasekcab = sortedMembers.find(
    (m) => m.department === "bph" && m.role.toLowerCase().includes("wakil sekretaris")
  );

  // Bendahara Cabang & Wakil
  const bendahara = sortedMembers.find(
    (m) => m.department === "bph" && m.role.toLowerCase().includes("bendahara") && !m.role.toLowerCase().includes("wakil")
  );
  const wabencab = sortedMembers.find(
    (m) => m.department === "bph" && m.role.toLowerCase().includes("wakil bendahara")
  );

  // 2. 5 BIDANG PELAKSANA (Organisasi, Kaderisasi, Litbang, Sosmas, DDI)
  const bidangList = departmentsInfo.filter(
    (d) => d.id !== "bph" && d.id !== "kewirausahaan"
  );

  // 3. LEMBAGA NON-BIDANG (Lembaga Kewirausahaan - disamakan tampilannya)
  const kwuMembers = sortedMembers.filter((m) => m.department === "kewirausahaan");
  const direkturKwu =
    kwuMembers.find(
      (m) => m.level === "direktur" || m.role.toLowerCase().includes("direktur")
    ) || kwuMembers[0];

  const pengurusKwuList = kwuMembers.filter((m) => m.id !== direkturKwu?.id);

  // Filter untuk Tab Seluruh Kader
  const filteredMembers =
    activeDeptTab === "all"
      ? sortedMembers
      : sortedMembers.filter((m) => m.department === activeDeptTab);

  return (
    <section id="struktur" className="scroll-mt-28 space-y-10 w-full">
      {/* Header & Pilihan Tab */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-900/40 px-4 py-1.5 text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-widest">
            <Users size={14} />
            Struktur Organisasi
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mt-3">
            {organizationInfo.cabinetName}
          </h2>
          <p className="text-slate-500 dark:text-neutral-400 text-sm sm:text-base mt-1.5">
            Masa Bakti {organizationInfo.period} • &ldquo;{organizationInfo.theme}&rdquo;
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#161619] p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveView("tree")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeView === "tree"
                ? "bg-white dark:bg-[#222228] text-red-600 dark:text-rose-400 shadow-sm"
                : "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Network size={16} />
            <span>Bagan Struktur</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("grid")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeView === "grid"
                ? "bg-white dark:bg-[#222228] text-red-600 dark:text-rose-400 shadow-sm"
                : "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Grid3X3 size={16} />
            <span>Seluruh Kader ({members.length})</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: BAGAN STRUKTUR POHON (KETUA LEBIH TINGGI, 6 KOLOM SERAGAM TANPA SCROLL)
         ========================================================================= */}
      {activeView === "tree" && (
        <div className="space-y-12 animate-in fade-in duration-200 w-full">
          
          {/* KANVAS BAGAN STRUKTUR POHON */}
          <div className="w-full flex flex-col items-center">
            
            {/* --- LEVEL 1: KETUA CABANG (LEBIH TINGGI DI ATAS) --- */}
            <div className="flex flex-col items-center relative z-20">
              {ketua && <ChartNode member={ketua} badgeColor="gold" highlight />}
              
              {/* Garis vertikal utama turun dari Ketua Cabang */}
              <div className="w-1 h-8 bg-red-600" />
            </div>

            {/* --- LEVEL 2: PERCABANGAN HORIZONTAL KE SEKRETARIS & BENDAHARA --- */}
            <div className="w-full max-w-2xl relative flex flex-col items-center">
              
              {/* Poros tengah komando terus ke bawah sampai menyentuh garis bidang */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 -bottom-6 w-1 bg-red-600 z-0" />

              {/* Batang horizontal penghubung Ketua ke Sekre & Benda */}
              <div className="w-1/2 h-1 bg-red-600 relative z-10">
                {/* Turun ke Sekretaris (Kiri) */}
                <div className="absolute left-0 -translate-x-1/2 top-0 w-1 h-6 bg-red-600" />
                {/* Turun ke Bendahara (Kanan) */}
                <div className="absolute right-0 translate-x-1/2 top-0 w-1 h-6 bg-red-600" />
              </div>

              {/* Baris Sekretaris & Bendahara + Wakilnya */}
              <div className="w-full grid grid-cols-2 gap-8 sm:gap-24 pt-6 relative z-10">
                {/* Sisi Kiri: SEKRETARIS CABANG -> WAKIL SEKRETARIS CABANG */}
                <div className="flex flex-col items-center relative">
                  {sekretaris && <ChartNode member={sekretaris} badgeColor="crimson" />}
                  
                  {/* Garis turun ke Wakil Sekretaris */}
                  <div className="w-1 h-6 bg-red-600 relative z-0" />
                  {wasekcab && <ChartNode member={wasekcab} badgeColor="slate" />}
                </div>

                {/* Sisi Kanan: BENDAHARA CABANG -> WAKIL BENDAHARA CABANG */}
                <div className="flex flex-col items-center relative">
                  {bendahara && <ChartNode member={bendahara} badgeColor="crimson" />}
                  
                  {/* Garis turun ke Wakil Bendahara */}
                  <div className="w-1 h-6 bg-red-600 relative z-0" />
                  {wabencab && <ChartNode member={wabencab} badgeColor="slate" />}
                </div>
              </div>

              {/* Garis Koordinasi Putus-Putus Pimpinan Cabang */}
              <div className="w-full max-w-md border-t-2 border-dashed border-red-400/50 dark:border-rose-500/40 mt-8 mb-0 flex justify-center relative z-10">
                <span className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest bg-white dark:bg-[#0a0a0c] px-3 -mt-2">
                  Koordinasi BPH
                </span>
              </div>
            </div>

            {/* --- LEVEL 3: BATANG DISTRIBUSI KOMANDO KE 6 DEPARTEMEN --- */}
            <div className="w-full flex flex-col items-center mt-6 relative">
              <div className="w-full grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4 relative z-10">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  /* Hanya sel baris pertama yang ditampilkan di tiap breakpoint: 2 di mobile,
                     3 di tablet, 6 di desktop. Sebelumnya keenam sel selalu dirender, sehingga
                     batang distribusi ikut tergambar ulang di baris kedua dan ketiga — itulah
                     yang membuat garisnya tampak menumpuk tiga di mobile. */
                  <div
                    key={idx}
                    className={`relative justify-center h-8 ${idx < 2 ? "flex" : idx === 2 ? "hidden md:flex" : "hidden xl:flex"}`}
                  >
                    {/* Horizontal Connector per row */}
                    {/* Mobile (2 cols) */}
                    <div className={`md:hidden absolute top-0 h-1 bg-red-600
                      ${idx % 2 === 0 ? "left-1/2 right-[-0.875rem] sm:right-[-1rem]" : "left-[-0.875rem] sm:left-[-1rem] right-1/2"}`}
                    />
                    {/* Tablet (3 cols) */}
                    <div className={`hidden md:block xl:hidden absolute top-0 h-1 bg-red-600
                      ${idx % 3 === 0 ? "left-1/2 right-[-1rem]" : idx % 3 === 2 ? "left-[-1rem] right-1/2" : "left-[-1rem] right-[-1rem]"}`}
                    />
                    {/* Desktop (6 cols) */}
                    <div className={`hidden xl:block absolute top-0 h-1 bg-red-600
                      ${idx === 0 ? "left-1/2 right-[-1rem]" : idx === 5 ? "left-[-1rem] right-1/2" : "left-[-1rem] right-[-1rem]"}`}
                    />

                    {/* Vertical drop */}
                    <div className="absolute top-0 w-1 h-8 bg-red-600" />

                    {/* Titik Sambungan Poros Tengah dari Ketua (hanya di baris pertama, persis di tengah struktur) */}
                    {idx === 2 && (
                      <div className="hidden md:block xl:hidden absolute top-0 right-[-0.5rem] w-1 h-1 bg-red-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* --- LEVEL 4: 6 KOLOM SEJAJAR (WARNA SERAGAM & TANPA LABEL STAF BIRO) --- */}
            <div className="w-full grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4 pt-1">
              
              {/* 5 BIDANG PELAKSANA */}
              {bidangList.map((bidang) => {
                const kabid = sortedMembers.find(
                  (m) =>
                    m.department === bidang.id &&
                    (m.level === "kabid" ||
                      m.level === "kabiro" ||
                      m.role.toLowerCase().includes("ketua bidang") ||
                      m.role.toLowerCase().includes("kepala bidang") ||
                      m.role.toLowerCase().includes("kepala"))
                );
                const stafList = sortedMembers
                  .filter((m) => m.department === bidang.id && m.id !== kabid?.id)
                  .sort((a, b) => a.orderIndex - b.orderIndex);

                return (
                  <div
                    key={bidang.id}
                    className="w-full flex flex-col items-center rounded-3xl border border-slate-200/90 dark:border-white/10 bg-slate-50/70 dark:bg-[#121215] p-3 shadow-xs hover:shadow-sm transition-all"
                  >
                    {/* Header Label Bidang */}
                    <div className="w-full text-center pb-2 mb-2.5 border-b border-slate-200 dark:border-white/10">
                      <span className="text-[8px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest block">
                        Bidang
                      </span>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white mt-0.5 leading-snug truncate">
                        {bidang.name}
                      </h4>
                    </div>

                    {/* Ketua Bidang Berfoto */}
                    <div className="w-full flex flex-col items-center">
                      {kabid && <ChartNode member={kabid} badgeColor="red" />}
                      <div className="w-0.5 h-5 bg-slate-300 dark:bg-neutral-700 my-1" />
                    </div>

                    {/* Seluruh Staf Bidang (Tanpa label pill "Staf") */}
                    <div className="w-full space-y-2 mt-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center block mb-1">
                        Staf ({stafList.length})
                      </span>
                      {stafList.map((staf) => (
                        <StafChartCard key={staf.id} member={staf} showRole={false} />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* 1 LEMBAGA KEWIRAUSAHAAN (WARNA SERAGAM DENGAN BIDANG LAINNYA) */}
              <div className="w-full flex flex-col items-center rounded-3xl border border-slate-200/90 dark:border-white/10 bg-slate-50/70 dark:bg-[#121215] p-3 shadow-xs hover:shadow-sm transition-all">
                {/* Header Label Lembaga */}
                <div className="w-full text-center pb-2 mb-2.5 border-b border-slate-200 dark:border-white/10">
                  <span className="text-[8px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest block">
                    Non-Bidang
                  </span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white mt-0.5 leading-snug truncate">
                    Lembaga Kewirausahaan
                  </h4>
                </div>

                {/* Direktur Lembaga */}
                <div className="w-full flex flex-col items-center">
                  {direkturKwu && <ChartNode member={direkturKwu} badgeColor="red" />}
                  <div className="w-0.5 h-5 bg-slate-300 dark:bg-neutral-700 my-1" />
                </div>

                {/* Pengurus Lembaga (Sekretaris, Bendahara, Staf) */}
                <div className="w-full space-y-2 mt-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center block mb-1">
                    Pengurus ({pengurusKwuList.length})
                  </span>
                  {pengurusKwuList.map((member) => (
                    <StafChartCard
                      key={member.id}
                      member={member}
                      showRole={!member.role.toLowerCase().includes("staf")}
                    />
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Rincian Ringkasan Tugas 5 Bidang & Lembaga */}
          <div className="pt-8 border-t border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Layers size={20} className="text-red-600" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Tugas Pokok &amp; Fungsi Bidang serta Lembaga
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {departmentsInfo
                .filter((d) => d.id !== "bph")
                .map((dept) => (
                  <div
                    key={dept.id}
                    className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121215] p-4 shadow-xs"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={16} className="text-red-600" />
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {dept.name}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed pl-6">
                      {dept.description}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: SELURUH KADER (KATALOG GRID DENGAN FILTER DEPARTEMEN LENGKAP)
         ========================================================================= */}
      {activeView === "grid" && (
        <div className="space-y-8 animate-in fade-in duration-200 w-full">
          {/* Tombol Filter Kategori / Departemen */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveDeptTab("all")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeDeptTab === "all"
                  ? "bg-red-600 text-white shadow-md"
                  : "bg-slate-100 dark:bg-[#161619] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10"
              }`}
            >
              Semua Kader ({members.length})
            </button>

            {departmentsInfo.map((dept) => {
              const count = members.filter((m) => m.department === dept.id).length;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setActiveDeptTab(dept.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeDeptTab === dept.id
                      ? "bg-red-600 text-white shadow-md"
                      : "bg-slate-100 dark:bg-[#161619] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10"
                  }`}
                >
                  {dept.shortName} ({count})
                </button>
              );
            })}
          </div>

          {/* Grid Foto Seluruh Kader */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                featured={
                  member.role.toLowerCase().includes("ketua cabang") ||
                  member.role.toLowerCase().includes("direktur")
                }
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
