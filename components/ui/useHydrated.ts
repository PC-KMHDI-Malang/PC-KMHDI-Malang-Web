"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

// Beberapa komponen baru boleh merender isi aslinya setelah hidrasi selesai — createPortal butuh
// document, dan next-themes belum tahu tema pilihan pengguna saat render di server. Pola lama
// (useState(false) + useEffect(() => setMounted(true))) memaksa satu render tambahan lewat
// setState di dalam efek; useSyncExternalStore memberi jawaban berbeda untuk server dan klien
// tanpa render berantai itu.
export function useHydrated() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
