import Hero from "@/components/sections/home/hero";
import About from "@/components/sections/home/about";
import Statistics from "@/components/sections/home/statistics";
import Programs from "@/components/sections/home/programs";
import News from "@/components/sections/home/news";
import Ebooks from "@/components/sections/home/ebooks";
import Gallery from "@/components/sections/home/gallery";
import CTA from "@/components/sections/home/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Statistics />
      <Programs />
      <News />
      <Ebooks />
      <Gallery />
      <CTA />
    </>
  );
}