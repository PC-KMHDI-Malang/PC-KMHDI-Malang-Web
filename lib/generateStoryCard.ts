export async function generateStoryCardBlob({
  title,
  coverImage,
  categoryOrGenre = "KMHDI",
  authorOrPublisher = "PC KMHDI Malang",
}: {
  title: string;
  coverImage?: string;
  categoryOrGenre?: string;
  authorOrPublisher?: string;
}): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

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

  // Card Background
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

  // Return PNG Blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/png");
  });
}
