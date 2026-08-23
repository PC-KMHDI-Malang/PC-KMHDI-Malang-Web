interface GridBackgroundProps {
  className?: string;
}

export default function GridBackground({
  className = "",
}: GridBackgroundProps) {
  return (
    <div
      className={`absolute inset-0 ${className}`}
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }}
    />
  );
}