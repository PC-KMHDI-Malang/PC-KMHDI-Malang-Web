"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { SafeImage as Image } from "@/components/ui/SafeImage";
import { X, ChevronLeft, ChevronRight, Calendar, Maximize2 } from "lucide-react";

export interface GalleryItem {
  id: string;
  title: string;
  coverImage: string;
  description?: string | null;
  createdAt: string;
}

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selectedItem = selectedIndex !== null ? items[selectedIndex] : null;

  const handleClose = () => setSelectedIndex(null);

  const handlePrev = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + items.length) % items.length);
  }, [selectedIndex, items.length]);

  const handleNext = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % items.length);
  }, [selectedIndex, items.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, handlePrev, handleNext]);

  // Lock scroll when lightbox is open
  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedIndex]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item, index) => (
          <div
            key={item.id}
            onClick={() => setSelectedIndex(index)}
            className="group relative h-72 rounded-3xl overflow-hidden cursor-pointer bg-slate-100 dark:bg-[#141417] border border-slate-200/80 dark:border-white/10 shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300"
          >
            <Image src={item.coverImage} alt={item.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

            {/* Hover Expand Icon */}
            <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md">
              <Maximize2 size={16} />
            </div>

            {/* Caption */}
            <div className="absolute bottom-0 inset-x-0 p-5 flex flex-col justify-end text-white">
              <span className="text-[11px] font-medium text-red-300 flex items-center gap-1.5 mb-1.5">
                <Calendar size={12} />
                {formatDate(item.createdAt)}
              </span>
              <h3 className="font-bold text-base leading-snug line-clamp-2 drop-shadow-sm group-hover:text-red-200 transition-colors">{item.title}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal Pop-up — rendered via portal so it always sits above the Navbar, */}
      {/* regardless of any stacking context created by ancestor sections on the page. */}
      {selectedItem &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            {/* Overlay Click to Close */}
            <div className="absolute inset-0" onClick={handleClose} />

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-5 right-5 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur transition cursor-pointer"
              aria-label="Tutup foto"
            >
              <X size={22} />
            </button>

            {/* Navigation Prev Button */}
            {items.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur transition cursor-pointer"
                aria-label="Foto sebelumnya"
              >
                <ChevronLeft size={26} />
              </button>
            )}

            {/* Navigation Next Button */}
            {items.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur transition cursor-pointer"
                aria-label="Foto selanjutnya"
              >
                <ChevronRight size={26} />
              </button>
            )}

            {/* Lightbox Content Container */}
            <div onClick={(e) => e.stopPropagation()} className="relative z-10 max-w-4xl w-full max-h-[90vh] flex flex-col items-center animate-in zoom-in-95 duration-200">
              <div className="relative w-full h-[55vh] sm:h-[65vh] rounded-3xl overflow-hidden shadow-2xl bg-black/40">
                <Image src={selectedItem.coverImage} alt={selectedItem.title} fill sizes="(max-width: 768px) 100vw, 896px" className="object-contain" priority />
              </div>

              <div className="w-full bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-5 mt-4 text-white text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">{selectedItem.title}</h2>
                  {selectedItem.description && <p className="text-sm text-slate-300 mt-1 max-w-xl">{selectedItem.description}</p>}
                </div>
                <span className="text-xs text-red-200 shrink-0 font-medium">{formatDate(selectedItem.createdAt)}</span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
