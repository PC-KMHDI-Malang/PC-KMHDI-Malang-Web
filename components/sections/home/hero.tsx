import { supabaseAdmin } from "@/lib/supabase";
import { heroData } from "@/data/hero";
import HeroClient from "./HeroClient";

// Caption di bawah lambang (Tahun Pengabdian & Kader Aktif) diambil dari kolom heroCaption*
// pada tabel "StatisticSection" di Supabase, bisa dikelola admin di /admin/statistics.
export default async function Hero() {
  const { data: section } = await supabaseAdmin.from("StatisticSection").select("*").eq("id", 1).maybeSingle();

  const captionYears = {
    value: section?.heroCaptionValue1 || heroData.captionYears.value,
    label: section?.heroCaptionLabel1 || heroData.captionYears.label,
  };
  const captionMembers = {
    value: section?.heroCaptionValue2 || heroData.captionMembers.value,
    label: section?.heroCaptionLabel2 || heroData.captionMembers.label,
  };

  return <HeroClient captionYears={captionYears} captionMembers={captionMembers} />;
}
