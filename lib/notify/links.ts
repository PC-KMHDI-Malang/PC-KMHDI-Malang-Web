import { APP_URL } from "@/lib/appHost";
import { siteConfig } from "@/lib/site";

// Link absolut ke halaman agenda untuk kanal di luar situs (email, WhatsApp). Agenda tinggal di
// domain sistem kalau NEXT_PUBLIC_APP_URL diisi; kalau kosong (lokal / preview) semuanya satu
// domain, jadi jatuh ke domain situs.
export function absoluteAppLink(path: string): string {
  return `${APP_URL || siteConfig.url}${path}`;
}
