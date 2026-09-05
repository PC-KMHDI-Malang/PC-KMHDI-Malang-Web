import type { Metadata, Viewport } from "next";
import "./globals.css";

import ScrollToTop from "@/components/layout/ScrollToTop";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { Providers } from "./providers";

export const metadata: Metadata = {
  // Makes every relative URL in metadata (OG images, canonicals) resolve to an absolute URL,
  // which social platforms require to render link previews.
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | Kesatuan Mahasiswa Hindu Dharma Indonesia`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "KMHDI",
    "Hindu",
    "kmhdi",
    "malang",
    "Cipayung",
    "Cipayung plus",
    "PC KMHDI",
    "KMHDI Malang",
    "PC KMHDI Malang",
    "Mahasiswa Hindu Malang",
    "Kesatuan Mahasiswa Hindu Dharma Indonesia",
    "organisasi mahasiswa Hindu",
    "Hindu Malang Raya",
    "PP KMHDI",
    "pemuda Hindu Indonesia",
    "kaderisasi KMHDI",
    "kaderisasi mahasiswa Hindu",
    "berita KMHDI Malang",
    "kegiatan mahasiswa Hindu",
    "e-Book KMHDI",
    "perpustakaan digital Hindu",
    "program kerja KMHDI",
    "organisasi kepemudaan Hindu",
    "wadah mahasiswa Hindu Dharma",
    "Hindu Dharma Indonesia",
    "Mahasiswa Hindu Kota Malang",
    "Mahasiswa Hindu Jawa Timur",
  ],
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} | Kesatuan Mahasiswa Hindu Dharma Indonesia`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Kesatuan Mahasiswa Hindu Dharma Indonesia`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Allows full-size image thumbnails and untruncated snippets in search results.
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": absoluteUrl("/#organization"),
      name: siteConfig.name,
      alternateName: siteConfig.legalName,
      url: siteConfig.url,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/image/logo-512.png"),
        width: 512,
        height: 512,
      },
      description: siteConfig.description,
      sameAs: [siteConfig.instagram],
      address: {
        "@type": "PostalAddress",
        streetAddress: siteConfig.address.street,
        addressLocality: siteConfig.address.locality,
        addressRegion: siteConfig.address.region,
        addressCountry: siteConfig.address.country,
      },
      areaServed: "Malang Raya, Jawa Timur, Indonesia",
    },
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      url: siteConfig.url,
      name: siteConfig.name,
      description: siteConfig.description,
      inLanguage: "id-ID",
      publisher: { "@id": absoluteUrl("/#organization") },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: absoluteUrl("/berita?q={search_term_string}"),
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="bg-white dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 antialiased selection:bg-red-600 selection:text-white transition-colors duration-300" suppressHydrationWarning>
        <JsonLd data={structuredData} />
        <NextTopLoader color="#dc2626" showSpinner={false} />
        <Toaster position="top-right" richColors />
        <Providers>
          <ScrollToTop />
          {children}
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
