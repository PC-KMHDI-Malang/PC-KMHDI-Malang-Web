"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { Menu, X, User, LayoutDashboard, Shield, LogOut, ChevronDown, Home, Info, Newspaper, BookOpen, Image as ImageIcon, ChevronRight } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

const menus = [
  {
    title: "Beranda",
    href: "/",
    icon: Home,
  },
  {
    title: "Profil",
    href: "/#tentang",
    icon: Info,
  },
  {
    title: "Publikasi",
    href: "/berita",
    icon: Newspaper,
  },
  {
    title: "e-Book",
    href: "/buku",
    icon: BookOpen,
  },
  {
    title: "Galeri",
    href: "/#galeri",
    icon: ImageIcon,
  },
];

interface NavbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
    image?: string | null;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!user;
  const isAdmin = user?.role === "ADMIN";
  const dashboardLink = isAdmin ? "/admin" : "/dashboard";
  const firstName = user?.name ? user.name.split(" ")[0] : "Akun";
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Lock background scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="fixed left-0 top-3 sm:top-4 z-50 w-full px-3 sm:px-6 flex justify-center pointer-events-none">
        <div className="w-full max-w-5xl pointer-events-auto">
          <nav
            className={`
              flex items-center justify-between
              rounded-full
              border
              px-5 py-2.5 sm:px-7 sm:py-3.5
              transition-all
              duration-300
              backdrop-blur-2xl
              backdrop-saturate-150
              ${
                scrolled
                  ? "border-white/25 bg-slate-900/55 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_14px_45px_rgba(0,0,0,0.45)]"
                  : "border-white/20 bg-slate-900/35 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_10px_35px_rgba(0,0,0,0.3)]"
              }
            `}
          >
            {/* 1. Logo Brand */}
            <Link href="/" className="flex items-center gap-3.5 transition hover:opacity-90 flex-shrink-0">
              <Image src="/image/Logo.webp" alt="PC KMHDI Malang Logo" width={48} height={48} unoptimized priority className="w-11 h-11 sm:w-12 sm:h-12 object-contain flex-shrink-0" />

              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">PC KMHDI</h1>
                <p className="text-xs font-medium text-white/75 tracking-wide">Kota Malang</p>
              </div>
            </Link>

            {/* 2. Desktop Navigation Links */}
            <div className="hidden items-center gap-8 lg:flex">
              {menus.map((menu) => (
                <Link key={menu.title} href={menu.href} className="text-sm sm:text-base font-semibold text-white/80 transition-colors hover:text-white">
                  {menu.title}
                </Link>
              ))}
            </div>

            {/* 3. Desktop Auth Status (Sudah Login vs Belum Login) */}
            <div className="hidden items-center gap-3.5 lg:flex">
              {isLoggedIn ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-white/15 hover:border-white/30"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-red-600 to-rose-500 font-bold text-xs text-white shadow">{userInitial}</div>
                    <span>Halo, {firstName}</span>
                    <ChevronDown size={15} className={`text-white/70 transition-transform duration-200 ${userDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 z-50">
                      {/* User Info Header */}
                      <div className="px-3 py-2.5 border-b border-white/10">
                        <p className="text-xs font-semibold text-white truncate">{user?.name || "Pengguna"}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                        <div className="mt-2">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${isAdmin ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"}`}>
                            {isAdmin ? "ADMINISTRATOR" : "ANGGOTA"}
                          </span>
                        </div>
                      </div>

                      {/* Dropdown Links */}
                      <div className="py-1.5 flex flex-col gap-0.5">
                        <Link href={dashboardLink} onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition">
                          {isAdmin ? <Shield size={14} className="text-red-400" /> : <LayoutDashboard size={14} className="text-blue-400" />}
                          <span>{isAdmin ? "Panel Admin" : "Dashboard Saya"}</span>
                        </Link>

                        <Link href="/dashboard/profile" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition">
                          <User size={14} className="text-slate-400" />
                          <span>Profil Saya</span>
                        </Link>
                      </div>

                      {/* Logout Action */}
                      <div className="pt-1 border-t border-white/10">
                        <form action={logoutAction}>
                          <button type="submit" className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition text-left">
                            <LogOut size={14} />
                            <span>Keluar</span>
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-500 px-6 py-2.5 text-sm sm:text-base font-bold text-white shadow-xl shadow-red-900/30 transition hover:scale-105 hover:shadow-red-900/50 active:scale-95"
                >
                  Login
                </Link>
              )}
            </div>

            {/* 4. Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20 active:scale-95 lg:hidden border border-white/15"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </nav>

          {/* 5. Mobile Menu Drawer (Dioptimasi untuk Layar HP) */}
          {mobileOpen && (
            <div className="fixed inset-0 top-[65px] z-40 bg-black/40 backdrop-blur-sm lg:hidden animate-in fade-in duration-200 p-4">
              <div className="w-full max-w-sm mx-auto rounded-3xl border border-white/20 bg-slate-900/80 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-3xl backdrop-saturate-150 animate-in slide-in-from-top-4 duration-300 max-h-[85vh] overflow-y-auto flex flex-col justify-between">
                <div>
                  {/* Status Login di HP */}
                  {isLoggedIn ? (
                    <div className="mb-4 rounded-2xl border border-white/15 bg-white/[0.08] p-3.5 flex items-center justify-between backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-red-600 to-rose-500 font-bold text-sm text-white shadow">{userInitial}</div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-white truncate">{user?.name || "Pengguna"}</p>
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${isAdmin ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"}`}>
                            {isAdmin ? "ADMIN" : "ANGGOTA"}
                          </span>
                        </div>
                      </div>

                      <Link href={dashboardLink} onClick={() => setMobileOpen(false)} className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition">
                        Buka
                      </Link>
                    </div>
                  ) : null}

                  {/* Daftar Navigasi Mobile */}
                  <div className="flex flex-col gap-1.5 py-1">
                    {menus.map((menu) => {
                      const IconComponent = menu.icon;
                      return (
                        <Link
                          key={menu.title}
                          href={menu.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 transition group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-300 group-hover:text-white group-hover:bg-red-600/20 transition">
                              <IconComponent size={16} />
                            </div>
                            <span>{menu.title}</span>
                          </div>
                          <ChevronRight size={15} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition" />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Aksi di Mobile */}
                <div className="mt-5 pt-4 border-t border-white/10 flex flex-col gap-2">
                  {isLoggedIn ? (
                    <>
                      <Link href={dashboardLink} onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/20">
                        {isAdmin ? <Shield size={16} className="text-red-400" /> : <LayoutDashboard size={16} className="text-blue-400" />}
                        <span>{isAdmin ? "Masuk Panel Admin" : "Masuk Dashboard"}</span>
                      </Link>

                      <form action={logoutAction}>
                        <button
                          type="submit"
                          onClick={() => setMobileOpen(false)}
                          className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-3 text-center text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20"
                        >
                          <LogOut size={16} />
                          <span>Keluar dari Akun</span>
                        </button>
                      </form>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-xl bg-gradient-to-r from-red-600 to-red-500 py-3 text-center text-sm font-bold text-white shadow-lg shadow-red-900/30 transition hover:brightness-110 active:scale-[0.98]"
                    >
                      Login ke Akun
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Spacer */}
      <div className="h-28 sm:h-32" />
    </>
  );
}
