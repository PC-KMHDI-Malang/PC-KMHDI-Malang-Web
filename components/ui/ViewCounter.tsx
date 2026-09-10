"use client";

import { useEffect, useRef, useState } from "react";

interface ViewCounterProps {
  type: "News" | "Ebook";
  id: string;
  initialViews: number;
}

// Halaman artikel di-cache statis, jadi server component-nya tidak lagi menambah hitungan
// "dilihat" sendiri — komponen ini yang memicunya sekali per kunjungan browser, lalu
// menampilkan angka terbaru begitu server membalas (sebelum itu, angka cache lama yang tampil).
export function ViewCounter({ type, id, initialViews }: ViewCounterProps) {
  const [views, setViews] = useState(initialViews);
  const incrementedRef = useRef(false);

  useEffect(() => {
    if (incrementedRef.current) return;
    incrementedRef.current = true;

    let cancelled = false;
    import("@/app/actions/views").then(({ incrementViewCountAction }) =>
      incrementViewCountAction(type, id).then((next) => {
        if (!cancelled && typeof next === "number") setViews(next);
      }),
    );

    return () => {
      cancelled = true;
    };
  }, [type, id]);

  return <>{views.toLocaleString("id-ID")}</>;
}
