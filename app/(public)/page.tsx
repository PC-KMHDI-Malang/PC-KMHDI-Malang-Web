import type { Metadata } from "next";

import Hero from "@/components/sections/home/hero";
import About from "@/components/sections/home/about";
import Statistics from "@/components/sections/home/statistics";
import Partners from "@/components/sections/home/partners";
import Programs from "@/components/sections/home/programs";
import News from "@/components/sections/home/news";
import Ebooks from "@/components/sections/home/ebooks";
import Gallery from "@/components/sections/home/gallery";
import CTA from "@/components/sections/home/CTA";

// Title, description, and OG data are inherited from the root layout; only the canonical
// URL has to be declared here so this page doesn't fall back to an inherited one.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Statistics />
      <Partners />
      <Programs />
      <News />
      <Ebooks />
      <Gallery />
      <CTA />
    </>
  );
}