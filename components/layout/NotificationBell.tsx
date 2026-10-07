"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

import { getMyNotificationsAction, getMyUnreadCountAction, markNotificationsReadAction, type MyNotifications } from "@/app/actions/notification";
import { appUrl } from "@/lib/appHost";

// Lonceng notifikasi agenda di navbar. Saat komponen muncul dan saat tab kembali difokuskan hanya
// JUMLAH belum dibaca yang diambil (satu query ringan); isi daftarnya baru diambil saat lonceng
// DIBUKA. Tanpa polling terus-menerus. Hanya dirender untuk anggota (lihat showAgenda di Navbar);
// action-nya sendiri juga menolak non-anggota.

function timeAgo(iso: string, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
}

export function NotificationBell() {
  const [data, setData] = useState<MyNotifications>({ unread: 0, items: [] });
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Daftar lengkap + jumlah (dipakai saat lonceng dibuka).
  const refresh = useCallback(async () => {
    try {
      setData(await getMyNotificationsAction());
    } catch {
      // Lonceng bukan fitur kritis: gagal memuat dibiarkan diam, bukan memunculkan error.
    }
  }, []);

  // Hanya jumlahnya; daftar yang sudah dimuat dibiarkan apa adanya.
  const refreshCount = useCallback(async () => {
    try {
      const unread = await getMyUnreadCountAction();
      setData((prev) => (prev.unread === unread ? prev : { ...prev, unread }));
    } catch {
      // diam, lihat catatan di atas
    }
  }, []);

  useEffect(() => {
    // Pembacaan awal. `cancelled` mencegah setState setelah komponen sudah dilepas (mis. pindah
    // halaman sebelum jawaban server datang).
    let cancelled = false;
    getMyUnreadCountAction()
      .then((unread) => {
        if (!cancelled) setData((prev) => ({ ...prev, unread }));
      })
      .catch(() => {
        // Lonceng bukan fitur kritis: gagal memuat dibiarkan diam.
      });

    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshCount();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshCount]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) void refresh();
  }

  // Optimistis: tampilan langsung berubah, server menyusul. Kalau gagal, refresh berikutnya
  // mengembalikan keadaan yang benar dari database.
  function markOneRead(id: string) {
    setData((prev) => {
      const target = prev.items.find((item) => item.id === id);
      if (!target || target.readAt) return prev;
      return { unread: Math.max(0, prev.unread - 1), items: prev.items.map((item) => (item.id === id ? { ...item, readAt: new Date().toISOString() } : item)) };
    });
    void markNotificationsReadAction([id]);
  }

  function markAllRead() {
    setData((prev) => ({ unread: 0, items: prev.items.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })) }));
    void markNotificationsReadAction();
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label={data.unread > 0 ? `Notifikasi, ${data.unread} belum dibaca` : "Notifikasi"}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-sm transition hover:bg-white/15 hover:border-white/30 cursor-pointer"
      >
        <Bell size={17} />
        {data.unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow">{data.unread > 9 ? "9+" : data.unread}</span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-20 z-50 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <p className="text-xs font-bold text-white">Notifikasi</p>
            {data.unread > 0 && (
              <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-300 hover:text-sky-200 cursor-pointer">
                <CheckCheck size={12} /> Tandai semua dibaca
              </button>
            )}
          </div>

          {data.items.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-slate-400">Belum ada notifikasi.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto overscroll-contain py-1">
              {data.items.map((item) => {
                const unread = !item.readAt;
                const body = (
                  <>
                    <div className="flex items-start gap-2">
                      {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" aria-hidden />}
                      <div className="min-w-0">
                        <p className={`text-xs leading-snug ${unread ? "font-bold text-white" : "font-medium text-slate-300"}`}>{item.title}</p>
                        {item.body && <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{item.body}</p>}
                        <p className="mt-1 text-[10px] text-slate-500">{timeAgo(item.createdAt)}</p>
                      </div>
                    </div>
                  </>
                );
                return (
                  <li key={item.id}>
                    {item.url ? (
                      <Link
                        href={appUrl(item.url)}
                        onClick={() => {
                          markOneRead(item.id);
                          setOpen(false);
                        }}
                        className="block rounded-xl px-3 py-2.5 transition hover:bg-white/10"
                      >
                        {body}
                      </Link>
                    ) : (
                      <button type="button" onClick={() => markOneRead(item.id)} className="block w-full rounded-xl px-3 py-2.5 text-left transition hover:bg-white/10 cursor-pointer">
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
