"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useHydrated } from "@/components/ui/useHydrated";
import { Link2, Heart, Check, Share2 } from "lucide-react";
import { SpotifyShareModal } from "./SpotifyShareModal";
import { LoginModal } from "@/components/auth/LoginModal";

interface EbookShareBarProps {
  title: string;
  type?: "news" | "ebook";
  id?: string;
  initialLikes?: number;
  coverImage?: string;
  categoryOrGenre?: string;
  authorOrPublisher?: string;
  date?: string;
  description?: string;
}

export function EbookShareBar({ title, type, id, initialLikes = 0, coverImage, categoryOrGenre, authorOrPublisher, date, description }: EbookShareBarProps) {
  // Status login & status suka dibaca di client (bukan lagi lewat prop server auth()/hasLiked())
  // supaya halaman artikel yang membungkus komponen ini bisa di-cache — lihat catatan yang sama
  // di app/(public)/layout.tsx dan Navbar.tsx.
  const { status: sessionStatus } = useSession();
  const isLoggedIn = sessionStatus === "authenticated";

  const [copied, setCopied] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isPending, setIsPending] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // window cuma ada di klien, jadi URL-nya dibaca setelah hidrasi.
  const hydrated = useHydrated();
  const shareUrl = hydrated ? window.location.href : "";

  const [liked, setLiked] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Baru dicek begitu kita tahu pengguna ini login — sebelum itu heart tampil kosong, sama
  // seperti pengunjung tamu, lalu berubah ke terisi kalau ternyata dia sudah pernah menyukainya.
  useEffect(() => {
    if (!isLoggedIn || !type || !id) {
      setLiked(false);
      return;
    }
    let cancelled = false;
    import("@/app/actions/like").then(({ getLikeStatusAction }) =>
      getLikeStatusAction(type, id).then((res) => {
        if (!cancelled) setLiked(res);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, type, id]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleLike = async () => {
    if (isPending) return;

    // Menyukai sekarang tercatat per akun (lihat migrasi 022), jadi butuh sesi. Tamu diarahkan
    // ke popup login di tempat — tidak dipindahkan keluar dari artikel yang sedang dibaca.
    if (!isLoggedIn) {
      setIsLoginOpen(true);
      return;
    }
    if (!type || !id) return;

    const nextLiked = !liked;
    const previousCount = likesCount;

    // Optimistic UI update
    setLiked(nextLiked);
    setLikesCount(nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1));

    setIsPending(true);
    try {
      const { toggleLikeAction } = await import("@/app/actions/like");
      const res = await toggleLikeAction(type, id, nextLiked);
      if (!res.success) {
        // Kembalikan tampilan ke keadaan semula supaya tidak menampilkan angka yang tidak
        // pernah tersimpan di server.
        setLiked(!nextLiked);
        setLikesCount(previousCount);
        if (res.requiresLogin) setIsLoginOpen(true);
      } else {
        if (typeof res.likes === "number") setLikesCount(res.likes);
        if (typeof res.liked === "boolean") setLiked(res.liked);
      }
    } catch (err) {
      console.error("Error like:", err);
      setLiked(!nextLiked);
      setLikesCount(previousCount);
    } finally {
      setIsPending(false);
    }
  };

  const currentUrl = shareUrl || (typeof window !== "undefined" ? window.location.href : "");

  return (
    <div className="flex items-center gap-2">
      {/* 1. Tombol Buka Sheet Bagikan (Ala Spotify) */}
      <button
        type="button"
        onClick={() => setIsShareModalOpen(true)}
        title="Bagikan artikel ini"
        className="h-9 px-3.5 flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-semibold text-xs shadow-sm transition-all hover:scale-105 active:scale-95"
      >
        <Share2 size={15} />
        <span>Bagikan</span>
      </button>

      {/* 2. Tombol Salin Tautan Cepat */}
      <button
        type="button"
        onClick={handleCopy}
        title="Salin tautan"
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white transition-colors"
      >
        {copied ? <Check size={16} className="text-emerald-600" /> : <Link2 size={16} />}
      </button>

      {/* 3. Tombol Like dengan Counter Supabase */}
      <button
        type="button"
        onClick={handleLike}
        disabled={isPending}
        title={liked ? "Batal Suka" : "Sukai"}
        className={`h-9 px-3 flex items-center gap-1.5 rounded-xl border text-xs font-semibold transition-all ${
          liked
            ? "border-red-200 dark:border-rose-500/30 bg-red-50 dark:bg-rose-950/40 text-red-600 dark:text-rose-400 shadow-sm"
            : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white"
        }`}
      >
        <Heart size={15} className={liked ? "fill-red-600 dark:fill-rose-400 text-red-600 dark:text-rose-400" : ""} />
        <span>{likesCount}</span>
      </button>

      {/* Spotify-Style Share Sheet Modal */}
      <SpotifyShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={title}
        coverImage={coverImage}
        categoryOrGenre={categoryOrGenre}
        authorOrPublisher={authorOrPublisher}
        date={date}
        description={description}
        url={currentUrl}
      />

      {/* Login di tempat: setelah berhasil, LoginModal reload penuh halaman ini, jadi
          useSession() & pengecekan status suka di atas otomatis jalan ulang dengan sesi baru. */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
