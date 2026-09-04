import {
  Users,
  GraduationCap,
  CalendarDays,
  Handshake,
  Award,
  BookOpen,
  Building2,
  Heart,
  Globe,
  Star,
  TrendingUp,
  Target,
  Sparkles,
  MapPin,
  Trophy,
  Flag,
  School,
  Rocket,
  type LucideIcon,
} from "lucide-react";

// Daftar ikon yang boleh dipilih admin untuk kartu statistik.
// Kunci (string) inilah yang disimpan di kolom "icon" pada tabel Statistic.
export const iconMap: Record<string, LucideIcon> = {
  Users,
  GraduationCap,
  CalendarDays,
  Handshake,
  Award,
  BookOpen,
  Building2,
  Heart,
  Globe,
  Star,
  TrendingUp,
  Target,
  Sparkles,
  MapPin,
  Trophy,
  Flag,
  School,
  Rocket,
};

export const iconOptions = Object.keys(iconMap);

export function getIcon(name: string | null | undefined): LucideIcon {
  return (name && iconMap[name]) || Users;
}
