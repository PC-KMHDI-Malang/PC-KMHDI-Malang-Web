import type { Metadata } from "next";
import "./globals.css";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/layout/ScrollToTop";

export const metadata: Metadata = {
  title: {
    default: "PC KMHDI Malang",
    template: "%s | PC KMHDI Malang",
  },
  description:
    "Website Resmi Pengurus Cabang Kesatuan Mahasiswa Hindu Dharma Indonesia (PC KMHDI) Malang.",
  keywords: [
    "KMHDI",
    "PC KMHDI",
    "KMHDI Malang",
    "Mahasiswa Hindu",
    "Organisasi",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-white text-zinc-900 antialiased">
        <ScrollToTop />

        <Navbar />

        <main className="min-h-screen">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}