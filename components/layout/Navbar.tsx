"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const menus = [
  {
    title: "Beranda",
    href: "/",
  },
  {
    title: "Profil",
    href: "/#tentang",
  },
  {
    title: "Publikasi",
    href: "/berita",
  },
  {
    title: "Buku",
    href: "/buku",
  },
  {
    title: "Galeri",
    href: "/#galeri",
  },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className="fixed left-0 top-2 z-50 w-full">
        <div className="mx-auto max-w-7xl px-2 py-2">
          <nav
            className={`
              flex items-center justify-between
              rounded-3xl
              border
              transition-all
              duration-300

              ${scrolled ? "border-white/10 bg-slate-900/70 shadow-2xl backdrop-blur-2xl" : "border-white/10 bg-slate-900/40 shadow-lg backdrop-blur-2xl"}
            `}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-4 px-6 py-4">
              <Image src="/image/Logo.png" alt="KMHDI" width={65} height={65} />

              <div>
                <h1 className="text-lg font-bold text-white">PC KMHDI</h1>

                <p className="text-sm text-white/70">Malang</p>
              </div>
            </Link>

            {/* Desktop Menu */}

            <div className="hidden items-center gap-8 lg:flex">
              {menus.map((menu) => (
                <Link key={menu.title} href={menu.href} className="text-sm font-medium text-white/80 transition hover:text-white">
                  {menu.title}
                </Link>
              ))}
            </div>

            {/* Right */}

            <div className="hidden items-center gap-3 pr-6 lg:flex">
              <Link href="/login" className="rounded-full bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 font-semibold text-white shadow-xl transition hover:scale-105">
                Login
              </Link>
            </div>

            {/* Mobile */}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="mr-5 rounded-xl bg-white/10 p-3 text-white lg:hidden">
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </nav>

          {/* Mobile Menu */}

          {mobileOpen && (
            <div className="mt-4 rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-3xl lg:hidden">
              <div className="flex flex-col gap-5">
                {menus.map((menu) => (
                  <Link key={menu.title} href={menu.href} className="text-white" onClick={() => setMobileOpen(false)}>
                    {menu.title}
                  </Link>
                ))}

                <Link href="/login" onClick={() => setMobileOpen(false)} className="mt-3 block rounded-xl bg-red-600 py-3 text-center font-semibold text-white transition hover:bg-red-700">
                  Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Spacer */}

      <div className="h-32" />
    </>
  );
}
