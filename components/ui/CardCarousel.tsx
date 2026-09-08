"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";

interface CardCarouselProps {
  children: ReactNode[];
  className?: string;
  dotActiveClassName?: string;
  dotInactiveClassName?: string;
  autoplayInterval?: number;
}

export function CardCarousel({
  children,
  className = "",
  dotActiveClassName = "w-6 bg-red-600",
  dotInactiveClassName = "w-2 bg-neutral-300 dark:bg-white/20",
  autoplayInterval = 3500,
}: CardCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  // Embla adalah sistem di luar React: state di sini cuma cerminan posisinya. Sinkronisasi
  // pertama dijalankan lewat requestAnimationFrame, bukan langsung di badan efek, supaya tidak
  // memicu render berantai. Listener-nya juga dilepas saat cleanup — sebelumnya tidak, sehingga
  // setiap kali efek ini jalan ulang listener lama menumpuk.
  useEffect(() => {
    if (!emblaApi) return;

    const sync = () => {
      setScrollSnaps(emblaApi.scrollSnapList());
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", sync);
    emblaApi.on("reInit", sync);
    const frame = requestAnimationFrame(sync);

    return () => {
      cancelAnimationFrame(frame);
      emblaApi.off("select", sync);
      emblaApi.off("reInit", sync);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => emblaApi.scrollNext(), autoplayInterval);
    return () => clearInterval(interval);
  }, [emblaApi, autoplayInterval]);

  return (
    <div className={className}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {children.map((child, index) => (
            <div key={index} className="min-w-0 flex-[0_0_86%] pr-4 first:pl-1">
              {child}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => scrollTo(index)}
            aria-label={`Ke slide ${index + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${index === selectedIndex ? dotActiveClassName : dotInactiveClassName}`}
          />
        ))}
      </div>
    </div>
  );
}
