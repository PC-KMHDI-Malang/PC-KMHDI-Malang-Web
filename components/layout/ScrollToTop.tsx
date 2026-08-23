"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Kembali ke atas"
      className={`
        fixed
        bottom-5
        right-5
        z-50

        flex
        h-12
        w-12
        items-center
        justify-center

        rounded-2xl

        border
        border-white/20

        bg-white/15
        backdrop-blur-2xl

        text-white

        shadow-xl

        transition-all
        duration-300

        hover:-translate-y-1
        hover:scale-105
        hover:bg-red-600

        md:h-14
        md:w-14

        ${
          visible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-8 opacity-0"
        }
      `}
    >
      <ChevronUp
        size={22}
        className="md:h-6 md:w-6"
      />
    </button>
  );
}