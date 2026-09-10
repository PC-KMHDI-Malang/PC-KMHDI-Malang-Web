interface WaveProps {
  className?: string;
}

// Lima batang tetap dengan tinggi berbeda supaya bentuknya seperti visualisasi audio/aktivitas,
// bukan sekadar meteran progres generik. Warnanya ikut currentColor (diatur lewat class teks di
// pemanggil), animasinya bisa disetel lewat custom property --duration/--delay pada style.
const BAR_HEIGHTS = [45, 70, 100, 70, 45];

export function Wave({ className = "" }: WaveProps) {
  return (
    <div className={`flex items-center justify-center gap-[12%] ${className}`} role="status" aria-label="Memuat">
      {BAR_HEIGHTS.map((height, i) => (
        <span
          key={i}
          className="w-[12%] rounded-full bg-current animate-wave-bar"
          style={{
            height: `${height}%`,
            animationDelay: `calc(${i} * var(--delay, 0.12s))`,
            animationDuration: "var(--duration, 1s)",
          }}
        />
      ))}
    </div>
  );
}
