"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { logoutAction } from "@/app/actions/auth";

interface SessionAutoLogoutProps {
  timeoutMinutes?: number; // Default 120 minutes (2 jam)
}

export function SessionAutoLogout({ timeoutMinutes = 120 }: SessionAutoLogoutProps) {
  // Dibaca di client, bukan lewat prop dari server — lihat catatan yang sama di Navbar.tsx.
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    const timeoutMs = timeoutMinutes * 60 * 1000;

    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(async () => {
        // Reload penuh (bukan router.push) disengaja: setelah sesi habis, semua state & cache
        // halaman yang masih mengira pengguna login harus ikut dibuang.
        try {
          await logoutAction();
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- reload penuh disengaja, lihat di atas
          window.location.href = "/login?reason=timeout";
        } catch {
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- reload penuh disengaja, lihat di atas
          window.location.href = "/login";
        }
      }, timeoutMs);
    };

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isLoggedIn, timeoutMinutes]);

  return null;
}
