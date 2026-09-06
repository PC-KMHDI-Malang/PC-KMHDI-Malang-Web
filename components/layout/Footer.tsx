import Image from "next/image";
import Link from "next/link";

import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";

import { Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-red-900/20 bg-[#0b0b0f] text-white">
      {/* Background Glow */}
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-red-700/10 blur-[140px]" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-red-600/10 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-6 py-20">
        {/* Grid */}
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-4">
              <Image src="/image/Logo.webp" alt="KMHDI" width={60} height={60} />
              <div>
                <h2 className="text-xl font-bold">PC KMHDI</h2>
                <p className="text-sm text-zinc-400">Malang</p>
              </div>
            </div>

            <p className="mt-6 leading-7 text-zinc-400">Website resmi Pengurus Cabang Kesatuan Mahasiswa Hindu Dharma Indonesia Malang sebagai pusat informasi, publikasi, dan pelayanan organisasi.</p>

            {/* Social */}
            <div className="mt-8 flex gap-4">
              <Link href="#" className="rounded-full bg-white/5 p-3 transition hover:bg-red-600">
                <FaInstagram size={18} />
              </Link>
              <Link href="#" className="rounded-full bg-white/5 p-3 transition hover:bg-red-600">
                <FaFacebook size={18} />
              </Link>
              <Link href="#" className="rounded-full bg-white/5 p-3 transition hover:bg-red-600">
                <FaYoutube size={18} />
              </Link>
            </div>
          </div>

          {/* Navigasi */}
          <div>
            <h3 className="mb-6 text-lg font-semibold">Navigasi</h3>
            <ul className="space-y-4 text-zinc-400">
              <li>
                <Link href="/" className="transition hover:text-white">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/profil" className="transition hover:text-white">
                  Profil
                </Link>
              </li>
              <li>
                <Link href="/berita" className="transition hover:text-white">
                  Publikasi
                </Link>
              </li>
              <li>
                <Link href="/galeri" className="transition hover:text-white">
                  Galeri
                </Link>
              </li>
              <li>
                <Link href="/e-book" className="transition hover:text-white">
                  E-Book
                </Link>
              </li>
            </ul>
          </div>

          {/* Layanan */}
          <div>
            <h3 className="mb-6 text-lg font-semibold">Layanan</h3>
            <ul className="space-y-4 text-zinc-400">
              <li>
                <Link href="/profil" className="transition hover:text-white">
                  Keanggotaan
                </Link>
              </li>
              <li>
                <Link href="/berita" className="transition hover:text-white">
                  Artikel
                </Link>
              </li>
              <li>
                <Link href="/berita" className="transition hover:text-white">
                  Berita
                </Link>
              </li>
              <li>
                <Link href="/e-book" className="transition hover:text-white">
                  Perpustakaan
                </Link>
              </li>
              <li>
                <Link href="/e-book" className="transition hover:text-white">
                  Download
                </Link>
              </li>
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <h3 className="mb-6 text-lg font-semibold">Hubungi Kami</h3>
            <div className="space-y-5 text-zinc-400">
              <div className="flex gap-3">
                <MapPin size={20} className="mt-1 text-red-500" />
                <p>
                  Sekretariat PC KMHDI Malang
                  <br />
                  Kota Malang, Jawa Timur
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-red-500" />
                <p>info@kmhdimalang.org</p>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-red-500" />
                <p>+62 877-7423-0949</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 text-left text-sm text-zinc-500 md:flex-row">
            <p>
              © {new Date().getFullYear()} PC KMHDI Malang. All Rights Reserved. <br />
              Created by{" "}
              <Link href="https://www.instagram.com/pujarajisthaa_aw" className="text-zinc-300 hover:underline">
                Rajistha
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
