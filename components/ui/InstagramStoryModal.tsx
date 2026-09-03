"use client";

import { useEffect, useRef, useState } from "react";
import { X, Download, Share2, Copy, Check, Instagram, Sparkles } from "lucide-react";

interface InstagramStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  coverImage?: string;
  categoryOrGenre?: string;
  authorOrPublisher?: string;
  url: string;
}

export function InstagramStoryModal({ isOpen, onClose, title, coverImage, categoryOrGenre = "KMHDI", authorOrPublisher = "PC KMHDI Malang", url }: InstagramStoryModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    if (typeof navigator !== "undefined" && !!navigator.share && !!navigator.canShare) {
      setCanNativeShare(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setImageBlob(null);
      setImageUrl("");
      return;
    }

    setIsGenerating(true);
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderCard = async () => {
      // 1. Background Gradient (Dark Red to Deep Burgundy to Onyx)
      const bgGradient = ctx.createLinearGradient(0, 0, 1080, 1920);
      bgGradient.addColorStop(0, "#7f1d1d");
      bgGradient.addColorStop(0.35, "#4c0519");
      bgGradient.addColorStop(0.7, "#1c0409");
      bgGradient.addColorStop(1, "#09090b");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 1080, 1920);

      // Ambient glow circles
      const glow1 = ctx.createRadialGradient(200, 300, 10, 200, 300, 450);
      glow1.addColorStop(0, "rgba(225, 29, 72, 0.35)");
      glow1.addColorStop(1, "rgba(225, 29, 72, 0)");
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, 1080, 1920);

      const glow2 = ctx.createRadialGradient(880, 1500, 10, 880, 1500, 500);
      glow2.addColorStop(0, "rgba(185, 28, 28, 0.25)");
      glow2.addColorStop(1, "rgba(185, 28, 28, 0)");
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, 1080, 1920);

      // 2. Header: Logo & Branding
      try {
        const logo = new Image();
        logo.crossOrigin = "anonymous";
        logo.src = "/image/Logo.webp";
        await new Promise((resolve) => {
          logo.onload = resolve;
          logo.onerror = resolve;
        });
        if (logo.complete && logo.naturalWidth > 0) {
          ctx.drawImage(logo, 100, 120, 90, 90);
        }
      } catch {
        // ignore
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 40px sans-serif";
      ctx.fillText("PC KMHDI MALANG", 215, 160);

      ctx.fillStyle = "rgba(254, 205, 211, 0.8)";
      ctx.font = "500 26px sans-serif";
      ctx.fillText("PUBLIKASI RESMI", 215, 198);

      // 3. Spotify-Style Center Card
      const cardX = 100;
      const cardY = 270;
      const cardW = 880;
      const cardH = 1250;
      const radius = 48;

      // Card Shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 60;
      ctx.shadowOffsetY = 25;

      // Card Background (Dark Glassmorphic container)
      ctx.fillStyle = "#111116";
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, radius);
      ctx.fill();

      // Reset shadow for inner elements
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Card Border
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, radius);
      ctx.stroke();

      // 4. Image inside card
      const imgPad = 45;
      const imgX = cardX + imgPad;
      const imgY = cardY + imgPad;
      const imgW = cardW - imgPad * 2;
      const imgH = 680;
      const imgRadius = 32;

      let imageLoaded = false;
      if (coverImage) {
        try {
          const mainImg = new Image();
          mainImg.crossOrigin = "anonymous";
          mainImg.src = coverImage;
          await new Promise((resolve) => {
            mainImg.onload = () => {
              imageLoaded = true;
              resolve(null);
            };
            mainImg.onerror = resolve;
          });

          if (imageLoaded && mainImg.complete) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(imgX, imgY, imgW, imgH, imgRadius);
            ctx.clip();

            // Cover object-fit logic
            const imgAspect = mainImg.naturalWidth / mainImg.naturalHeight;
            const targetAspect = imgW / imgH;
            let drawW, drawH, offsetX, offsetY;

            if (imgAspect > targetAspect) {
              drawH = imgH;
              drawW = imgH * imgAspect;
              offsetX = imgX - (drawW - imgW) / 2;
              offsetY = imgY;
            } else {
              drawW = imgW;
              drawH = imgW / imgAspect;
              offsetX = imgX;
              offsetY = imgY - (drawH - imgH) / 2;
            }

            ctx.drawImage(mainImg, offsetX, offsetY, drawW, drawH);
            ctx.restore();
          }
        } catch {
          // ignore
        }
      }

      if (!imageLoaded) {
        ctx.fillStyle = "#27272a";
        ctx.beginPath();
        ctx.roundRect(imgX, imgY, imgW, imgH, imgRadius);
        ctx.fill();

        ctx.fillStyle = "#71717a";
        ctx.font = "bold 36px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("KMHDI MALANG", cardX + cardW / 2, imgY + imgH / 2);
        ctx.textAlign = "start";
      }

      // 5. Category Pill Badge
      const badgeY = imgY + imgH + 50;
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.roundRect(imgX, badgeY, 180, 50, 25);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(categoryOrGenre.toUpperCase(), imgX + 90, badgeY + 33);
      ctx.textAlign = "start";

      // 6. Title (Text wrapping)
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 48px sans-serif";
      const titleX = imgX;
      let titleY = badgeY + 115;
      const maxTitleWidth = imgW;
      const lineHeight = 62;

      const words = title.split(" ");
      let currentLine = "";
      let linesDrawn = 0;

      for (let n = 0; n < words.length; n++) {
        const testLine = currentLine + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxTitleWidth && n > 0) {
          ctx.fillText(currentLine, titleX, titleY);
          currentLine = words[n] + " ";
          titleY += lineHeight;
          linesDrawn++;
          if (linesDrawn >= 3) {
            currentLine = currentLine.trim() + "...";
            break;
          }
        } else {
          currentLine = testLine;
        }
      }
      ctx.fillText(currentLine, titleX, titleY);

      // 7. Author / Subtitle
      ctx.fillStyle = "#a1a1aa";
      ctx.font = "500 28px sans-serif";
      ctx.fillText(`Oleh: ${authorOrPublisher}`, titleX, cardY + cardH - 55);

      // 8. Footer Link Sticker Prompt
      const footerY = 1630;
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.beginPath();
      ctx.roundRect(100, footerY, 880, 160, 40);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(100, footerY, 880, 160, 40);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 34px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🔗 Buka link di Stiker Tautan Instagram", 540, footerY + 68);

      ctx.fillStyle = "#fda4af";
      ctx.font = "500 26px sans-serif";
      ctx.fillText("Baca versi lengkap di website resmi PC KMHDI Malang", 540, footerY + 115);
      ctx.textAlign = "start";

      // Export to Blob
      canvas.toBlob((blob) => {
        if (blob) {
          setImageBlob(blob);
          setImageUrl(URL.createObjectURL(blob));
          setIsGenerating(false);
        }
      }, "image/png");
    };

    renderCard();
  }, [isOpen, title, coverImage, categoryOrGenre, authorOrPublisher]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleShareStory = async () => {
    if (!imageBlob) return;

    const file = new File([imageBlob], `story-${Date.now()}.png`, { type: "image/png" });

    // Salin link terlebih dahulu ke clipboard agar user bisa langsung paste di stiker link IG
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore
    }

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: title,
          text: `Baca selengkapnya: ${title}`,
        });
        return;
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Gagal share:", err);
        }
      }
    }

    // Fallback: Download file
    handleDownload();
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `KMHDI-Story-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl p-6 sm:p-8 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5 text-white">
            <span className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 flex items-center justify-center shadow-lg">
              <Instagram size={18} className="text-white" />
            </span>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Story Card ala Spotify</h3>
              <p className="text-xs text-slate-400">Siap dibagikan ke Instagram Stories</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Card Preview Container */}
        <div className="my-5 flex justify-center items-center bg-black/40 rounded-3xl p-4 border border-white/5 relative min-h-[380px]">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
              <Sparkles className="animate-spin text-rose-500" size={32} />
              <p className="text-sm font-medium">Merender Story Card estetik...</p>
            </div>
          ) : imageUrl ? (
            <img src={imageUrl} alt="Story Preview" className="max-h-[380px] w-auto aspect-[9/16] object-contain rounded-2xl shadow-2xl border border-white/10" />
          ) : null}
        </div>

        {/* Tips Box */}
        <div className="bg-rose-950/40 border border-rose-800/30 rounded-2xl p-3.5 mb-5 text-xs text-rose-200/90 flex items-start gap-2.5">
          <span className="text-base shrink-0">💡</span>
          <p className="leading-relaxed">
            Link website sudah otomatis disalin! Setelah kartu terbuka di Instagram Story, tambahkan <strong>Stiker Tautan (Link Sticker)</strong> lalu paste link-nya agar penonton bisa langsung membaca.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleShareStory}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-pink-900/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <Share2 size={16} />
            {canNativeShare ? "Bagikan ke Instagram Story" : "Download Story Card"}
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors border border-white/10 disabled:opacity-50"
            >
              <Download size={14} />
              Simpan Gambar
            </button>

            <button type="button" onClick={handleCopyLink} className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors border border-white/10">
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? "Link Disalin!" : "Salin Link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
