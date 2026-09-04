"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Menu as MenuIcon, X, User, Shield, LogOut, ChevronDown, Home, Info, Newspaper, BookOpen, Image as ImageIcon, ChevronRight, Users, FolderOpen } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LoginModal } from "@/components/auth/LoginModal";

type SubMenu = {
  title: string;
  href: string;
};

type NavMenu = {
  title: string;
  href: string;
  icon: any;
  submenus?: SubMenu[];
};

const menus: NavMenu[] = [
  {
    title: "Beranda",
    href: "/",
    icon: Home,
  },
  {
    title: "Profil",
    href: "/profil",
    icon: Info,
    submenus: [
      { title: "Sejarah", href: "/profil#sejarah" },
      { title: "Visi & Misi", href: "/profil#visi-misi" },
      { title: "Struktur Organisasi", href: "/profil#struktur" },
    ],
  },
  {
    title: "Publikasi",
    href: "/berita",
    icon: Newspaper,
    submenus: [
      { title: "Berita & Artikel", href: "/berita" },
      { title: "e-Book", href: "/buku" },
      { title: "Galeri", href: "/galeri" },
    ],
  },
  {
    title: "Organisasi",
    href: "#",
    icon: Users,
    submenus: [
      { title: "Pimpinan Cabang", href: "#" },
      { title: "Komisariat", href: "#" },
    ],
  },
  {
    title: "Direktori",
    href: "#",
    icon: FolderOpen,
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
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [mobileOpenMenus, setMobileOpenMenus] = useState<Record<string, boolean>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!user;
  const isAdmin = user?.role === "ADMIN";
  const accountLink = isAdmin ? "/admin" : "/profile";
  const firstName = user?.name ? user.name.split(" ")[0] : "Akun";
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
        setShowLogoutConfirm(false);
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

  const toggleMobileMenu = (title: string, e: React.MouseEvent) => {
    e.preventDefault();
    setMobileOpenMenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  return (
    <>
      <header className="fixed left-0 top-3 sm:top-4 z-50 w-full px-3 sm:px-6 flex justify-center pointer-events-none">
        <div className="w-full max-w-5xl pointer-events-auto">
          <nav
            className={`
              relative z-50
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
                <span className="block text-base sm:text-lg font-black tracking-tight text-white leading-tight">PC KMHDI</span>
                <p className="text-xs font-medium text-white/75 tracking-wide">Kota Malang</p>
              </div>
            </Link>

            {/* 2. Desktop Navigation Links */}
            <div className="hidden items-center gap-6 lg:flex">
              {menus.map((menu) => {
                const isActive = pathname === menu.href || (menu.href !== "/" && pathname.startsWith(menu.href));
                
                return (
                  <div key={menu.title} className="relative group">
                    <Link 
                      href={menu.href} 
                      className={`flex items-center gap-1.5 py-2 text-sm sm:text-base font-semibold transition-all relative ${
                        isActive ? "text-white" : "text-white/80 hover:text-white"
                      }`}
                    >
                      {menu.title}
                      {menu.submenus && <ChevronDown size={14} className="opacity-70 group-hover:rotate-180 transition-transform duration-200" />}
                      
                      {/* Active Indicator Line */}
                      {isActive && (
                        <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-red-500 rounded-full"></span>
                      )}
                    </Link>

                    {menu.submenus && (
                      <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="w-48 bg-[#1e1e1e]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-col gap-1">
                          {menu.submenus.map((sub) => (
                            <Link 
                              key={sub.title} 
                              href={sub.href}
                              className="px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                            >
                              {sub.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 3. Desktop Actions (Theme Toggle & Auth) */}
            <div className="hidden items-center gap-3 lg:flex">
              {/* Sakelar Mode Gelap / Terang */}
              <ThemeToggle iconOnly />

              {isLoggedIn ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(!userDropdownOpen);
                      if (!userDropdownOpen) setShowLogoutConfirm(false);
                    }}
                    className="flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-white/15 hover:border-white/30 cursor-pointer"
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
                        {isAdmin && (
                          <Link href="/admin" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition">
                            <Shield size={14} className="text-red-400" />
                            <span>Panel Admin</span>
                          </Link>
                        )}

                        <Link href="/profile" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition">
                          <User size={14} className="text-rose-400" />
                          <span>Profil &amp; Sandi</span>
                        </Link>
                      </div>

                      {/* Logout Action */}
                      <div className="pt-1 border-t border-white/10">
                        {showLogoutConfirm ? (
                          <div className="px-3 py-2">
                            <p className="text-[11px] text-slate-300 font-semibold mb-2 text-center">Yakin ingin keluar?</p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition"
                              >
                                Batal
                              </button>
                              <form action={logoutAction} className="flex-1">
                                <button
                                  type="submit"
                                  className="w-full py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold transition shadow-sm"
                                >
                                  Ya, Keluar
                                </button>
                              </form>
                            </div>
                          </div>
                        ) : (
                          <button 
                            type="button" 
                            onClick={() => setShowLogoutConfirm(true)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition text-left cursor-pointer"
                          >
                            <LogOut size={14} />
                            <span>Keluar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setLoginModalOpen(true)}
                  className="rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-500 px-6 py-2.5 text-sm sm:text-base font-bold text-white shadow-xl shadow-red-900/30 transition hover:scale-105 hover:shadow-red-900/50 active:scale-95 cursor-pointer"
                >
                  Login
                </button>
              )}
            </div>

            {/* 4. Mobile Controls (Theme Toggle & Hamburger) */}
            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle iconOnly />

              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20 active:scale-95 border border-white/15 cursor-pointer"
              >
                {mobileOpen ? <X size={22} /> : <MenuIcon size={22} />}
              </button>
            </div>
          </nav>

          {/* 5. Mobile Menu Drawer (Dioptimasi untuk Layar HP) */}
          {mobileOpen && (
            <div
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 top-0 z-40 bg-black/30 backdrop-blur-md lg:hidden animate-in fade-in duration-200 p-4 pt-20 overflow-y-auto"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm mx-auto rounded-3xl border border-white/20 bg-slate-900/80 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-3xl backdrop-saturate-150 animate-in slide-in-from-top-4 duration-300 max-h-[85vh] overflow-y-auto flex flex-col justify-between"
              >
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

                      <Link href={accountLink} onClick={() => setMobileOpen(false)} className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition">
                        {isAdmin ? "Admin" : "Profil"}
                      </Link>
                    </div>
                  ) : null}

                  {/* Sakelar Tema di Mobile */}
                  <ThemeToggle className="mb-3" />

                  {/* Daftar Navigasi Mobile */}
                  <div className="flex flex-col gap-1.5 py-1">
                    {menus.map((menu) => {
                      const IconComponent = menu.icon;
                      const hasSub = !!menu.submenus;
                      const isExpanded = mobileOpenMenus[menu.title];

                      return (
                        <div key={menu.title} className="flex flex-col">
                          <Link
                            href={hasSub ? "#" : menu.href}
                            onClick={hasSub ? (e) => toggleMobileMenu(menu.title, e) : () => setMobileOpen(false)}
                            className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition group ${
                              isExpanded ? "bg-white/10 text-white" : "text-slate-200 hover:text-white hover:bg-white/10"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                                isExpanded ? "bg-red-600/30 text-red-400" : "bg-white/5 text-slate-300 group-hover:text-white group-hover:bg-red-600/20"
                              }`}>
                                <IconComponent size={16} />
                              </div>
                              <span>{menu.title}</span>
                            </div>
                            {hasSub ? (
                              <ChevronDown size={15} className={`text-white/50 transition-transform ${isExpanded ? "rotate-180 text-white" : ""}`} />
                            ) : (
                              <ChevronRight size={15} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition" />
                            )}
                          </Link>

                          {hasSub && (
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              isExpanded ? "max-h-64 opacity-100 mt-1" : "max-h-0 opacity-0"
                            }`}>
                              <div className="pl-11 pr-2 py-2 flex flex-col gap-1 border-l-2 border-white/10 ml-5">
                                {menu.submenus!.map((sub) => (
                                  <Link
                                    key={sub.title}
                                    href={sub.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                  >
                                    {sub.title}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Aksi di Mobile */}
                <div className="mt-5 pt-4 border-t border-white/10 flex flex-col gap-2">
                  {isLoggedIn ? (
                    <>
                      {isAdmin ? (
                        <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/20">
                          <Shield size={16} className="text-red-400" />
                          <span>Masuk Panel Admin</span>
                        </Link>
                      ) : (
                        <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/20">
                          <User size={16} className="text-rose-400" />
                          <span>Atur Profil &amp; Sandi</span>
                        </Link>
                      )}

                      {showLogoutConfirm ? (
                        <div className="w-full rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 animate-in fade-in zoom-in-95 duration-200">
                          <p className="text-xs text-rose-300 font-semibold mb-3 text-center">Yakin ingin keluar dari akun?</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setShowLogoutConfirm(false)}
                              className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
                            >
                              Batal
                            </button>
                            <form action={logoutAction} className="flex-1">
                              <button
                                type="submit"
                                onClick={() => setMobileOpen(false)}
                                className="w-full py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition shadow-md"
                              >
                                Ya, Keluar
                              </button>
                            </form>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowLogoutConfirm(true)}
                          className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-3 text-center text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20 cursor-pointer"
                        >
                          <LogOut size={16} />
                          <span>Keluar dari Akun</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        setLoginModalOpen(true);
                      }}
                      className="w-full block rounded-xl bg-gradient-to-r from-red-600 to-red-500 py-3 text-center text-sm font-bold text-white shadow-lg shadow-red-900/30 transition hover:brightness-110 active:scale-[0.98] cursor-pointer"
                    >
                      Login ke Akun
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Modal Login Pop-up */}
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />

      {/* Spacer */}
      <div className="h-28 sm:h-32" />
    </>
  );
}
