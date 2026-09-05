import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "PC KMHDI Malang — Kesatuan Mahasiswa Hindu Dharma Indonesia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default social-sharing card, used by every page that doesn't set its own OG image.
 * Renders server-side only — it never appears anywhere in the site UI.
 *
 * The emblem is read as PNG because satori (the renderer behind next/og) cannot decode WebP.
 */
export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public", "image", "logo-512.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "0 80px",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(ellipse 70% 60% at 20% 40%, rgba(153,27,27,0.65), transparent 70%), radial-gradient(ellipse 60% 50% at 90% 90%, rgba(251,191,36,0.16), transparent 70%)",
        }}
      >
        {/* Emblem */}
        <img src={logoSrc} width={260} height={260} alt="" style={{ objectFit: "contain" }} />

        {/* Wordmark and tagline */}
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 64 }}>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 700, color: "#ffffff", letterSpacing: -2 }}>PC KMHDI</div>
          <div style={{ display: "flex", fontSize: 46, fontWeight: 700, color: "#fbbf24", marginTop: 4 }}>Malang</div>
          <div style={{ display: "flex", width: 120, height: 6, backgroundColor: "#dc2626", borderRadius: 3, marginTop: 28 }} />
          <div style={{ display: "flex", fontSize: 30, color: "rgba(255,255,255,0.82)", marginTop: 28, lineHeight: 1.4, maxWidth: 620 }}>
            Kesatuan Mahasiswa Hindu Dharma Indonesia
          </div>
        </div>
      </div>
    ),
    size
  );
}
