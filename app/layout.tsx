import type { Metadata } from "next";
import "./globals.css";

import ScrollToTop from "@/components/layout/ScrollToTop";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "PC KMHDI Malang",
    template: "%s | PC KMHDI Malang",
  },
  description: "Website Resmi Pengurus Cabang Kesatuan Mahasiswa Hindu Dharma Indonesia (PC KMHDI) Malang.",
  keywords: ["KMHDI", "PC KMHDI", "KMHDI Malang", "Mahasiswa Hindu", "Organisasi"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="bg-white dark:bg-slate-950 text-zinc-900 dark:text-zinc-50 antialiased transition-colors" suppressHydrationWarning>
        <Providers>
          <ScrollToTop />
          {children}
        </Providers>
      </body>
    </html>
  );
}
