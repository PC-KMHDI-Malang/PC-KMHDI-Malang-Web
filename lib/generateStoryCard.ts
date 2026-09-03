export async function generateStoryCardBlob({
  title,
  coverImage,
  categoryOrGenre = "KMHDI",
  authorOrPublisher = "PC KMHDI Malang",
  date,
  description,
}: {
  title: string;
  coverImage?: string;
  categoryOrGenre?: string;
  authorOrPublisher?: string;
  date?: string;
  description?: string;
}): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // 1. Background Gradient (Deep Crimson to Deep Burgundy to Charcoal)
  const bgGradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  bgGradient.addColorStop(0, "#7f1d1d");
  bgGradient.addColorStop(0.35, "#4c0519");
  bgGradient.addColorStop(0.7, "#1c0409");
  bgGradient.addColorStop(1, "#09090b");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, 1080, 1920);

  // Ambient glow circles
  const glow1 = ctx.createRadialGradient(220, 260, 10, 220, 260, 480);
  glow1.addColorStop(0, "rgba(225, 29, 72, 0.38)");
  glow1.addColorStop(1, "rgba(225, 29, 72, 0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, 1080, 1920);

  const glow2 = ctx.createRadialGradient(860, 1600, 10, 860, 1600, 520);
  glow2.addColorStop(0, "rgba(185, 28, 28, 0.28)");
  glow2.addColorStop(1, "rgba(185, 28, 28, 0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, 1080, 1920);

  // 2. Header: Logo & KMHDI Branding
  try {
    const logo = new Image();
    logo.crossOrigin = "anonymous";
    logo.src = "/image/Logo.webp";
    await new Promise((resolve) => {
      logo.onload = resolve;
      logo.onerror = resolve;
    });
    if (logo.complete && logo.naturalWidth > 0) {
      ctx.drawImage(logo, 95, 95, 90, 90);
    }
  } catch {
    // ignore
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 38px sans-serif";
  ctx.fillText("PC KMHDI MALANG", 205, 138);

  ctx.fillStyle = "rgba(254, 205, 211, 0.85)";
  ctx.font = "600 23px sans-serif";
  ctx.fillText("PORTAL PUBLIKASI RESMI", 205, 172);

  // 3. Measure Content Dimensions to calculate EXACT compact card height (No Dead Space!)
  const imgPad = 32;
  const imgW = 760;
  const imgH = 520; // Proporsional dan ringkas

  // Measure Title lines (Max 2 lines)
  ctx.font = "bold 38px sans-serif";
  const titleLineHeight = 48;
  const titleLines: string[] = [];
  const words = title.split(" ");
  let currentLine = "";

  for (let n = 0; n < words.length; n++) {
    const testLine = currentLine + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > imgW && n > 0) {
      titleLines.push(currentLine.trim());
      currentLine = words[n] + " ";
      if (titleLines.length >= 2) {
        break;
      }
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine.trim() && titleLines.length < 2) {
    titleLines.push(currentLine.trim());
  }
  if (titleLines.length > 2) {
    titleLines.length = 2;
  }
  if (titleLines.length === 2 && words.length > 6) {
    titleLines[1] = titleLines[1].replace(/\.*$/, "") + "...";
  }

  // Measure Description lines (Max 3 lines + ellipsis)
  ctx.font = "400 23px sans-serif";
  const descLineHeight = 33;
  const descLines: string[] = [];

  if (description) {
    const cleanDesc = description
      .replace(/<[^>]*>?/gm, "")
      .replace(/\s+/g, " ")
      .trim();
    if (cleanDesc) {
      const descWords = cleanDesc.split(" ");
      let dLine = "";
      for (let i = 0; i < descWords.length; i++) {
        const testLine = dLine + descWords[i] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > imgW && i > 0) {
          descLines.push(dLine.trim());
          dLine = descWords[i] + " ";
          if (descLines.length >= 3) {
            dLine = "";
            break;
          }
        } else {
          dLine = testLine;
        }
      }
      if (dLine.trim() && descLines.length < 3) {
        descLines.push(dLine.trim());
      }
      if (descLines.length >= 3) {
        descLines[descLines.length - 1] = descLines[descLines.length - 1].replace(/\.*$/, "") + "...";
      }
    }
  }

  // 4. Calculate Compact Card Size
  const badgeHeight = 38;
  const badgeMarginTop = 26;
  const titleMarginTop = 20;
  const titleBlockHeight = titleLines.length * titleLineHeight;
  const descMarginTop = descLines.length > 0 ? 12 : 0;
  const descBlockHeight = descLines.length * descLineHeight;
  const footerMarginTop = 22;
  const footerBlockHeight = 44;
  const cardBottomPadding = 26;

  const cardH = imgPad + imgH + badgeMarginTop + badgeHeight + titleMarginTop + titleBlockHeight + descMarginTop + descBlockHeight + footerMarginTop + footerBlockHeight + cardBottomPadding;

  const cardW = imgW + imgPad * 2; // 824
  const cardX = (1080 - cardW) / 2; // 128 (Centered)
  const cardY = 250 + Math.max(0, (1480 - cardH) / 2); // Center vertically in lower space!
  const radius = 40;

  // 5. Draw Card Background & Shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
  ctx.shadowBlur = 55;
  ctx.shadowOffsetY = 24;

  ctx.fillStyle = "#121217";
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.fill();

  // Reset shadow for inner elements
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Card Border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.stroke();

  // 6. Draw Image Inside Card
  const imgX = cardX + imgPad;
  const imgY = cardY + imgPad;
  const imgRadius = 24;

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
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("KMHDI MALANG", cardX + cardW / 2, imgY + imgH / 2);
    ctx.textAlign = "start";
  }

  // 7. Category Badge & Date Row
  const metaY = imgY + imgH + badgeMarginTop;

  // Category Badge (Left)
  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  ctx.roundRect(imgX, metaY, 140, badgeHeight, badgeHeight / 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 17px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(categoryOrGenre.toUpperCase(), imgX + 70, metaY + 25);
  ctx.textAlign = "start";

  // Date (Right)
  if (date) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 21px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(date, imgX + imgW, metaY + 26);
    ctx.textAlign = "start";
  }

  // 8. Render Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 38px sans-serif";
  let curY = metaY + badgeHeight + titleMarginTop + 30;

  for (let i = 0; i < titleLines.length; i++) {
    ctx.fillText(titleLines[i], imgX, curY);
    curY += titleLineHeight;
  }

  // 9. Render Description (Max 3 lines, compact)
  if (descLines.length > 0) {
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "400 23px sans-serif";
    curY += descMarginTop - 15;

    for (let i = 0; i < descLines.length; i++) {
      ctx.fillText(descLines[i], imgX, curY);
      curY += descLineHeight;
    }
  }

  // 10. Divider & Author (Always snugly attached at bottom of card!)
  const dividerY = cardY + cardH - cardBottomPadding - footerBlockHeight;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(imgX, dividerY);
  ctx.lineTo(imgX + imgW, dividerY);
  ctx.stroke();

  // Author on left
  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 21px sans-serif";
  ctx.fillText(`Oleh: ${authorOrPublisher}`, imgX, dividerY + 36);

  // KMHDI Badge on right
  ctx.fillStyle = "#f43f5e";
  ctx.font = "bold 21px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("PC KMHDI MALANG", imgX + imgW, dividerY + 36);
  ctx.textAlign = "start";

  // Return PNG Blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/png");
  });
}
