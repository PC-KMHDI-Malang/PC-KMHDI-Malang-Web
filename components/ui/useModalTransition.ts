"use client";

import { useEffect, useState } from "react";

// Semua modal di aplikasi ini memakai pola yang sama: dipasang ke DOM dulu, baru satu frame
// kemudian kelas transisinya dinyalakan (kalau langsung dinyalakan bersamaan, browser tidak
// punya keadaan awal untuk dianimasikan), dan saat ditutup ditahan dulu sampai animasi keluar
// selesai sebelum dilepas. Dulu blok ini disalin utuh di belasan komponen modal.
//
// setState-nya sengaja dijalankan di dalam callback rAF/timer, bukan langsung di badan efek:
// setState sinkron di dalam efek memicu render berantai (react-hooks/set-state-in-effect).
const EXIT_DURATION_MS = 300;

export function useModalTransition(isOpen: boolean) {
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      let innerFrame = 0;
      const frame = requestAnimationFrame(() => {
        setIsRendered(true);
        innerFrame = requestAnimationFrame(() => setIsVisible(true));
      });
      return () => {
        cancelAnimationFrame(frame);
        cancelAnimationFrame(innerFrame);
      };
    }

    const frame = requestAnimationFrame(() => setIsVisible(false));
    const timer = setTimeout(() => setIsRendered(false), EXIT_DURATION_MS);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [isOpen]);

  useBodyScrollLock(isOpen);

  return { isRendered, isVisible };
}

// Halaman di belakang modal tidak boleh ikut ter-scroll selama modal terbuka.
export function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);
}
