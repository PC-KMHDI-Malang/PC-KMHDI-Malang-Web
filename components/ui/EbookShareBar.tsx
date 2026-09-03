"use client";

import { useEffect, useState } from "react";
import { Facebook, Twitter, Link2, Heart, Check, Instagram } from "lucide-react";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.83 14.13c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.13.11-1.82-.11-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.79-4.17-4.94-4.36-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.83 2 .9 2.14.07.14.12.31.02.5-.1.19-.15.31-.29.48-.14.17-.3.37-.43.5-.14.14-.29.29-.12.58.17.29.75 1.24 1.62 2.01 1.11.99 2.05 1.3 2.34 1.44.29.14.46.12.63-.07.17-.19.72-.84.92-1.13.19-.29.39-.24.65-.14.27.1 1.7.8 1.99.95.29.14.48.22.55.34.07.13.07.72-.17 1.4z" />
    </svg>
  );
}

interface EbookShareBarProps {
  title: string;
  type?: "news" | "ebook";
  id?: string;
  initialLikes?: number;
  coverImage?: string;
  categoryOrGenre?: string;
  authorOrPublisher?: string;
}

export function EbookShareBar({ title, type, id, initialLikes = 0, coverImage, categoryOrGenre, authorOrPublisher }: EbookShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isPending, setIsPending] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(window.location.href);
    if (type && id) {
      const storageKey = `${type}_liked_${id}`;
      const isAlreadyLiked = localStorage.getItem(storageKey) === "true";
      setLiked(isAlreadyLiked);
    }
  }, [type, id]);

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

    const nextLiked = !liked;
    const newCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

    // Optimistic UI update
    setLiked(nextLiked);
    setLikesCount(newCount);

    if (type && id) {
      const storageKey = `${type}_liked_${id}`;
      if (nextLiked) {
        localStorage.setItem(storageKey, "true");
      } else {
        localStorage.removeItem(storageKey);
      }

      setIsPending(true);
      try {
        const { toggleLikeAction } = await import("@/app/actions/like");
        const res = await toggleLikeAction(type, id, nextLiked);
        if (!res.success) {
          // Revert if failed on server
          console.warn("Gagal update like di database, kembali ke nilai semula.");
        } else if (typeof res.likes === "number") {
          setLikesCount(res.likes);
        }
      } catch (err) {
        console.error("Error like:", err);
      } finally {
        setIsPending(false);
      }
    }
  };

  const [isSharingIG, setIsSharingIG] = useState(false);

  const currentUrl = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
  const waText = encodeURIComponent(`${title}\n\n${currentUrl}`);
  const tweetText = encodeURIComponent(`${title}\n`);
  const tweetUrl = encodeURIComponent(currentUrl);
  const fbUrl = encodeURIComponent(currentUrl);

  const handleInstagramShare = async () => {
    if (isSharingIG) return;
    setIsSharingIG(true);

    // Otomatis salin link ke clipboard terlebih dahulu (agar user bisa langsung paste di stiker link IG)
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }

    try {
      // Generate gambar Story Card ala Spotify di latar belakang (tanpa pop up!)
      const { generateStoryCardBlob } = await import("@/lib/generateStoryCard");
      const blob = await generateStoryCardBlob({
        title,
        coverImage,
        categoryOrGenre,
        authorOrPublisher,
      });

      if (blob) {
        const file = new File([blob], `kmhdi-story-${Date.now()}.png`, { type: "image/png" });

        // Di HP (Android / iOS): navigator.share dengan file gambar langsung membuka target Instagram Stories!
        if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: title,
          });
          setIsSharingIG(false);
          return;
        }

        // Fallback (Desktop atau jika share file tidak didukung): langsung unduh gambar & buka Instagram
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `KMHDI-Story-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Gagal share ke Instagram:", err);
      }
    } finally {
      setIsSharingIG(false);
    }

    // Buka Instagram
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex items-center gap-2">
      {/* Facebook */}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${fbUrl}`}
        target="_blank"
        rel="noreferrer"
        title="Bagikan ke Facebook"
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white transition-colors"
      >
        <Facebook size={16} />
      </a>

      {/* Twitter / X */}
      <a
        href={`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`}
        target="_blank"
        rel="noreferrer"
        title="Bagikan ke Twitter/X"
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white transition-colors"
      >
        <Twitter size={16} />
      </a>

      {/* WhatsApp */}
      <a
        href={`https://api.whatsapp.com/send?text=${waText}`}
        target="_blank"
        rel="noreferrer"
        title="Bagikan ke WhatsApp"
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white transition-colors"
      >
        <WhatsAppIcon />
      </a>

      {/* Instagram Story (1-klik langsung generate card & buka Story) */}
      <button
        type="button"
        onClick={handleInstagramShare}
        disabled={isSharingIG}
        title="Bagikan ke Instagram Story (Card ala Spotify)"
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-pink-500/40 hover:bg-gradient-to-tr hover:from-amber-500/15 hover:via-pink-500/15 hover:to-purple-500/15 hover:text-pink-600 dark:hover:text-pink-400 transition-all disabled:opacity-60"
      >
        <Instagram size={16} className={isSharingIG ? "animate-spin" : ""} />
      </button>

      {/* Salin Tautan */}
      <button
        type="button"
        onClick={handleCopy}
        title="Salin tautan"
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white transition-colors"
      >
        {copied ? <Check size={16} className="text-green-600" /> : <Link2 size={16} />}
      </button>

      {/* Tombol Like dengan Penghitung */}
      <button
        type="button"
        onClick={handleLike}
        disabled={isPending}
        title={liked ? "Batal Suka" : "Sukai"}
        className={`h-9 px-3 flex items-center gap-1.5 rounded-lg border text-xs font-semibold transition-all ${
          liked
            ? "border-red-200 dark:border-rose-500/30 bg-red-50 dark:bg-rose-950/40 text-red-600 dark:text-rose-400 shadow-sm"
            : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white"
        }`}
      >
        <Heart size={15} className={liked ? "fill-red-600 dark:fill-rose-400 text-red-600 dark:text-rose-400" : ""} />
        <span>{likesCount}</span>
      </button>
    </div>
  );
}
