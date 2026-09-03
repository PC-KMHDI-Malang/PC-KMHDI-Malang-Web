"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CountUp from "react-countup";
import { motion, useMotionValue, useSpring, useTransform, type PanInfo } from "framer-motion";

import { heroData } from "@/data/hero";
import AnimatedWord from "@/components/ui/AnimatedWord";

// Pointer/touch-driven 3D tilt for the emblem — rotates in real 3D as you drag or hover it.
function Tilt3DLogo() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 18, mass: 0.6 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [16, -16]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-16, 16]), springConfig);

  const glowX = useTransform(x, (v) => `${50 + v * 70}%`);
  const glowY = useTransform(y, (v) => `${50 + v * 70}%`);
  const glowBackground = useTransform([glowX, glowY], ([gx, gy]) =>
    `radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,0.45), transparent 60%)`
  );

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
    <div className="relative" style={{ perspective: 1200 }}>
      <motion.div
        role="img"
        aria-label="Lambang PC KMHDI Malang, dapat disentuh dan diputar"
        drag
        dragElastic={0.15}
        dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
        onDrag={handleDrag}
        onPointerMove={handlePointerMove}
        onPointerLeave={reset}
        onDragEnd={reset}
        whileTap={{ scale: 0.97 }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d", touchAction: "none" }}
        className="relative touch-none cursor-grab overflow-hidden rounded-[1.75rem] border border-white/15 bg-gradient-to-b from-red-900/40 via-slate-950/60 to-slate-950/80 shadow-2xl shadow-black/50 active:cursor-grabbing"
      >
        {/* Concentric rings behind the emblem, like a seal — each sits at its own depth */}
        <div style={{ transform: "translateZ(15px)" }} className="absolute left-1/2 top-1/2 h-[88%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 pointer-events-none" />
        <div style={{ transform: "translateZ(30px)" }} className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 pointer-events-none" />

        <div style={{ transform: "translateZ(70px)" }} className="relative flex aspect-square w-full items-center justify-center p-4 sm:p-6">
          <Image
            src={heroData.image}
            alt="Lambang PC KMHDI Malang"
            width={520}
            height={520}
            priority
            unoptimized
            draggable={false}
            className="h-full w-full select-none object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)]"
          />
        </div>

        {/* Glossy highlight that tracks the touch/cursor point for a real reflective feel */}
        <motion.div style={{ background: glowBackground, transform: "translateZ(85px)" }} className="pointer-events-none absolute inset-0 mix-blend-soft-light" />
      </motion.div>

      {/* Grounding shadow beneath the plaque */}
      <div className="mx-auto -mt-3 h-6 w-4/5 rounded-full bg-black/40 blur-xl" />
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative -mt-32 overflow-hidden bg-gradient-to-b from-slate-950 via-red-950 to-slate-950 pt-36 pb-20 lg:pt-24">
      {/* Ambient Glow */}
      <div className="absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-red-600/15 blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-[420px] w-[420px] rounded-full bg-red-900/20 blur-[130px] pointer-events-none" />

      {/* Woven texture — quiet nod to traditional cloth motifs instead of a generic tech mesh */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 14px), repeating-linear-gradient(-45deg, #fff 0px, #fff 1px, transparent 1px, transparent 14px)",
        }}
      />

      {/* Grid */}
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid min-h-screen items-center gap-12 py-12 lg:grid-cols-2">
          {/* IMAGE — appears first on mobile (order-1), right side on desktop (lg:order-2) */}
          <div className="relative flex justify-center lg:justify-end order-1 lg:order-2">
            <div className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-lg">
              <Tilt3DLogo />

              {/* Caption bar — grounded credentials instead of floating badges on top of the emblem */}
              <div className="mt-4 flex items-stretch overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                <div className="flex-1 px-4 py-3.5 text-center sm:px-6">
                  <p className="text-xl font-bold text-white sm:text-2xl">
                    <CountUp end={35} duration={2} suffix="+" enableScrollSpy scrollSpyOnce />
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">Tahun Pengabdian</p>
                </div>
                <div className="w-px bg-white/10" />
                <div className="flex-1 px-4 py-3.5 text-center sm:px-6">
                  <p className="text-xl font-bold text-white sm:text-2xl">
                    <CountUp end={500} duration={2} suffix="+" enableScrollSpy scrollSpyOnce />
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">Kader Aktif</p>
                </div>
              </div>
            </div>
          </div>

          {/* TEXT — appears second on mobile (order-2), left side on desktop (lg:order-1) */}
          <div className="order-2 lg:order-1">
            <h1 className="text-3xl font-extrabold leading-[1.15] text-white sm:text-4xl lg:text-5xl">
              {heroData.title.first} <AnimatedWord words={heroData.title.animated} />
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 md:text-lg">{heroData.description}</p>

            {/* Buttons */}
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              {heroData.buttons.map((button) => {
                const isExternal = button.href.startsWith("http");
                return (
                  <Link
                    key={button.label}
                    href={button.href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className={
                      button.primary
                        ? "group inline-flex items-center justify-center rounded-xl bg-red-700 px-7 py-4 font-semibold text-white shadow-lg shadow-red-950/40 transition-colors duration-300 hover:bg-red-600"
                        : "inline-flex items-center justify-center rounded-xl border border-white/15 bg-transparent px-7 py-4 font-semibold text-white transition-colors duration-300 hover:bg-white/5"
                    }
                  >
                    {button.label}
                    {button.primary && <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />}
                  </Link>
                );
              })}
            </div>

            {/* Statistics */}
            <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-4">
              {heroData.statistics.map((item) => (
                <div key={item.label} className="bg-slate-950/60 p-5 text-center">
                  <h3 className="text-3xl font-bold text-white">
                    <CountUp end={Number(item.value)} duration={2} suffix="+" enableScrollSpy scrollSpyOnce />
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
