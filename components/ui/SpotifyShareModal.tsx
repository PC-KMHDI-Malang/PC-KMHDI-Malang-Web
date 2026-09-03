"use client";

import { useEffect, useState } from "react";
import { X, Link2, Check, Download, Twitter, Facebook, Sparkles } from "lucide-react";
import { generateStoryCardBlob } from "@/lib/generateStoryCard";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.83 14.13c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.13.11-1.82-.11-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.79-4.17-4.94-4.36-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.83 2 .9 2.14.07.14.12.31.02.5-.1.19-.15.31-.29.48-.14.17-.3.37-.43.5-.14.14-.29.29-.12.58.17.29.75 1.24 1.62 2.01 1.11.99 2.05 1.3 2.34 1.44.29.14.46.12.63-.07.17-.19.72-.84.92-1.13.19-.29.39-.24.65-.14.27.1 1.7.8 1.99.95.29.14.48.22.55.34.07.13.07.72-.17 1.4z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface SpotifyShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  coverImage?: string;
  categoryOrGenre?: string;
  authorOrPublisher?: string;
  date?: string;
  description?: string;
  url: string;
}

export function SpotifyShareModal({ isOpen, onClose, title, coverImage, categoryOrGenre = "KMHDI", authorOrPublisher = "PC KMHDI Malang", date, description, url }: SpotifyShareModalProps) {
  const [cardBlob, setCardBlob] = useState<Blob | null>(null);
  const [cardPreviewUrl, setCardPreviewUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      setCardBlob(null);
      setCardPreviewUrl("");
      setShareFeedback("");
      return;
    }

    let isMounted = true;
    setIsGenerating(true);

    generateStoryCardBlob({
      title,
      coverImage,
      categoryOrGenre,
      authorOrPublisher,
      date,
      description,
    }).then((blob) => {
      if (!isMounted) return;
      if (blob) {
        setCardBlob(blob);
        setCardPreviewUrl(URL.createObjectURL(blob));
      }
      setIsGenerating(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, title, coverImage, categoryOrGenre, authorOrPublisher, date, description]);

  if (!isOpen) return null;

  // 1. Action: Salin Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setShareFeedback("Tautan disalin!");
      setTimeout(() => {
        setCopied(false);
        setShareFeedback("");
      }, 2500);
    } catch {
      // ignore
    }
  };

  // 2. Action: Share Instagram Story
  const handleInstagramStory = async () => {
    // 1. Salin link ke clipboard otomatis agar siap ditempel di Stiker Tautan Instagram
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }

    if (!cardBlob) {
      // Fallback langsung buka IG jika card belum ter-render
      window.open("https://www.instagram.com/", "_blank");
      return;
    }

    const file = new File([cardBlob], `KMHDI-Story-${Date.now()}.png`, { type: "image/png" });

    // Jika di HP yang mendukung share file (iOS Safari / Android Chrome)
    if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        setShareFeedback("Membuka Instagram Stories...");
        await navigator.share({
          files: [file],
          title: title,
        });
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") {
          setShareFeedback("");
          return;
        }
      }
    }

    // Fallback untuk Desktop: Unduh kartu gambar dan buka Instagram
    const downloadUrl = URL.createObjectURL(cardBlob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `KMHDI-Story-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

    setShareFeedback("Kartu diunduh! Tautan otomatis disalin ke clipboard.");
    window.open("https://www.instagram.com/", "_blank");
  };

  // 3. Action: WhatsApp
  const handleWhatsApp = () => {
    const waText = encodeURIComponent(`${title}\n\n${url}`);
    window.open(`https://api.whatsapp.com/send?text=${waText}`, "_blank");
  };

  // 4. Action: Twitter / X
  const handleTwitter = () => {
    const tweetText = encodeURIComponent(`${title}\n`);
    const tweetUrl = encodeURIComponent(url);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`, "_blank");
  };

  // 5. Action: Facebook
  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
  };

  // 6. Action: Simpan Gambar HD
  const handleDownloadCard = () => {
    if (!cardBlob) return;
    const downloadUrl = URL.createObjectURL(cardBlob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `KMHDI-Card-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
    setShareFeedback("Kartu HD tersimpan ke galeri!");
    setTimeout(() => setShareFeedback(""), 2500);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal / Bottom Sheet */}
      <div className="relative w-full sm:max-w-md bg-[#121216] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[36px] shadow-2xl p-6 sm:p-7 flex flex-col max-h-[92vh] z-10 animate-in slide-in-from-bottom duration-300">
        {/* Handle bar on mobile */}
        <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto -mt-1 mb-4 sm:hidden" />

        {/* Header with Close */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
            <h3 className="text-white font-bold text-base tracking-wide">Bagikan</h3>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Center: Spotify-Style Visual Card Preview */}
        <div className="relative my-4 flex items-center justify-center rounded-3xl bg-[#09090c] p-4 border border-white/5 shadow-inner min-h-[310px] overflow-hidden">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-400 py-16">
              <Sparkles className="animate-spin text-rose-500" size={30} />
              <p className="text-xs font-medium tracking-wide text-slate-300">Merender Kartu Cerita...</p>
            </div>
          ) : cardPreviewUrl ? (
            <div className="relative group">
              <img src={cardPreviewUrl} alt="Card Preview" className="max-h-[300px] w-auto aspect-[9/16] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10" />
              {/* Badge KMHDI floating */}
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-white border border-white/10 flex items-center gap-1.5">
                <span>KMHDI</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Feedback Alert if link is copied */}
        {shareFeedback && <div className="mb-3 px-4 py-2 bg-rose-950/60 border border-rose-600/40 rounded-xl text-center text-xs font-semibold text-rose-200 animate-in fade-in">{shareFeedback}</div>}

        {/* Instructions hint */}
        <p className="text-[11px] text-center text-slate-400 mb-4">
          Bagikan ke <strong>Instagram Stories</strong> untuk menampilkan kartu estetik ini. Link website otomatis disalin untuk ditempel di Stiker Tautan!
        </p>

        {/* Horizontal Share Options Row (Spotify Style) */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto py-2 px-1">
          {/* 1. Salin Link */}
          <button type="button" onClick={handleCopyLink} className="flex flex-col items-center gap-2 group min-w-[62px]">
            <div className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center group-hover:bg-white/20 group-active:scale-95 transition-all shadow-md">
              {copied ? <Check size={20} className="text-emerald-400" /> : <Link2 size={20} />}
            </div>
            <span className="text-[11px] text-slate-300 font-medium group-hover:text-white">{copied ? "Disalin" : "Salin link"}</span>
          </button>

          {/* 2. WhatsApp */}
          <button type="button" onClick={handleWhatsApp} className="flex flex-col items-center gap-2 group min-w-[62px]">
            <div className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center group-hover:opacity-90 group-active:scale-95 transition-all shadow-md">
              <WhatsAppIcon />
            </div>
            <span className="text-[11px] text-slate-300 font-medium group-hover:text-white">WhatsApp</span>
          </button>

          {/* 3. Instagram Stories (Highlight) */}
          <button type="button" onClick={handleInstagramStory} disabled={isGenerating} className="flex flex-col items-center gap-2 group min-w-[62px] disabled:opacity-50">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] text-white flex items-center justify-center group-hover:opacity-90 group-active:scale-95 transition-all shadow-lg shadow-pink-900/40 ring-2 ring-rose-500/40">
              <InstagramIcon />
            </div>
            <span className="text-[11px] text-rose-300 font-bold group-hover:text-white">Stories</span>
          </button>

          {/* 4. Twitter / X */}
          <button type="button" onClick={handleTwitter} className="flex flex-col items-center gap-2 group min-w-[62px]">
            <div className="w-12 h-12 rounded-full bg-black border border-white/20 text-white flex items-center justify-center group-hover:bg-white/10 group-active:scale-95 transition-all shadow-md">
              <Twitter size={18} />
            </div>
            <span className="text-[11px] text-slate-300 font-medium group-hover:text-white">X</span>
          </button>

          {/* 5. Facebook */}
          <button type="button" onClick={handleFacebook} className="flex flex-col items-center gap-2 group min-w-[62px]">
            <div className="w-12 h-12 rounded-full bg-[#1877F2] text-white flex items-center justify-center group-hover:opacity-90 group-active:scale-95 transition-all shadow-md">
              <Facebook size={20} />
            </div>
            <span className="text-[11px] text-slate-300 font-medium group-hover:text-white">Facebook</span>
          </button>

          {/* 6. Simpan Gambar */}
          <button type="button" onClick={handleDownloadCard} disabled={isGenerating} className="flex flex-col items-center gap-2 group min-w-[62px] disabled:opacity-50">
            <div className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center group-hover:bg-white/20 group-active:scale-95 transition-all shadow-md">
              <Download size={18} />
            </div>
            <span className="text-[11px] text-slate-300 font-medium group-hover:text-white">Simpan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
