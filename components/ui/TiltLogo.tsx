"use client";

import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform, type PanInfo } from "framer-motion";

interface TiltLogoProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

// Logo 3D yang bisa dimiringkan mengikuti kursor/sentuhan — sama seperti lambang di Hero beranda,
// tapi tanpa plakat/card di belakangnya, hanya gambar logo itu sendiri yang "mengambang".
export function TiltLogo({ src, alt, size = 260, className = "" }: TiltLogoProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 18, mass: 0.6 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [14, -14]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-14, 14]), springConfig);

  const updateFromPoint = (clientX: number, clientY: number, rect: DOMRect) => {
    x.set((clientX - rect.left) / rect.width - 0.5);
    y.set((clientY - rect.top) / rect.height - 0.5);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    updateFromPoint(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
  };

  const handleDrag = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const target = e.currentTarget as HTMLDivElement | null;
    if (!target) return;
    updateFromPoint(info.point.x, info.point.y, target.getBoundingClientRect());
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      role="img"
      aria-label={alt}
      drag
      dragElastic={0.15}
      dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
      onDrag={handleDrag}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      onDragEnd={reset}
      whileTap={{ scale: 0.97 }}
      style={{ rotateX, rotateY, perspective: 1000, touchAction: "none" }}
      className={`touch-none cursor-grab active:cursor-grabbing ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        priority
        draggable={false}
        className="h-full w-full select-none object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)] dark:drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)]"
      />
    </motion.div>
  );
}
