import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="bg-white dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 antialiased selection:bg-red-600 selection:text-white transition-colors duration-300" suppressHydrationWarning>
        <Providers>
          <ScrollToTop />
          {children}
        </Providers>
      </body>
    </html>
  );
}
