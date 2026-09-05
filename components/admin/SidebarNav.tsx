"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Image as ImageIcon, Users, KeyRound, FileText, Network, BarChart3, Handshake } from "lucide-react";

interface SidebarNavProps {
  role: string;
}

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "Beranda", icon: LayoutDashboard },
    { href: "/admin/statistics", label: "Statistik Pencapaian", icon: BarChart3 },
    { href: "/admin/pengurus", label: "Struktur Pengurus", icon: Network },
    { href: "/admin/mitra", label: "Mitra & Kolaborasi", icon: Handshake },
    { href: "/admin/ebooks", label: "Manajemen Ebook", icon: BookOpen },
    { href: "/admin/gallery", label: "Manajemen Galeri", icon: ImageIcon },
    { href: "/admin/news", label: "Manajemen Artikel", icon: FileText },
    ...(role === "ADMIN" ? [{ href: "/admin/users", label: "Manajemen User", icon: Users }] : []),
    { href: "/admin/profile", label: "Ganti Password", icon: KeyRound },
  ];

  return (
    <nav className="flex-1 p-4 space-y-2">
      {links.map((link) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 font-medium ${
              isActive
                ? "bg-red-50 dark:bg-[#1a1414] text-red-600 dark:text-rose-400 border border-red-100 dark:border-rose-900/30"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent"
            }`}
          >
            <Icon size={20} className={isActive ? "text-red-600 dark:text-rose-400" : ""} />
            <span className="text-[15px]">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
