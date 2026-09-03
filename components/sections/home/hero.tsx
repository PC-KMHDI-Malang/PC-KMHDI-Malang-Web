"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CountUp from "react-countup";
import { motion, useMotionValue, useScroll, useSpring, useTransform, type PanInfo, type Variants } from "framer-motion";

import { heroData } from "@/data/hero";
import AnimatedWord from "@/components/ui/AnimatedWord";

// Gold dust motes drifting slowly across the whole hero, for a soft ambient shimmer.
const dustMotes = [
  { left: "4%", top: "70%", size: 3, delay: "0s", duration: "12s" },
  { left: "11%", top: "30%", size: 2, delay: "2s", duration: "14s" },
  { left: "19%", top: "55%", size: 3, delay: "4.5s", duration: "11s" },
  { left: "27%", top: "15%", size: 2, delay: "1s", duration: "13s" },
  { left: "38%", top: "80%", size: 3, delay: "6s", duration: "15s" },
  { left: "49%", top: "40%", size: 2, delay: "3s", duration: "12.5s" },
  { left: "58%", top: "20%", size: 3, delay: "5s", duration: "13.5s" },
  { left: "66%", top: "65%", size: 2, delay: "0.5s", duration: "11.5s" },
  { left: "74%", top: "35%", size: 3, delay: "7s", duration: "14.5s" },
  { left: "83%", top: "58%", size: 2, delay: "2.5s", duration: "12s" },
  { left: "91%", top: "22%", size: 3, delay: "4s", duration: "13s" },
  { left: "96%", top: "75%", size: 2, delay: "6.5s", duration: "15s" },
];

const textReveal: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const revealItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

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
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 140]);

  return (
    <section ref={sectionRef} className="relative -mt-32 overflow-hidden bg-gradient-to-b from-black via-red-950 to-black pt-36 pb-20 lg:pt-24">
      {/* Background layer — parallax: scrolls slower than the foreground content for cinematic depth */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 pointer-events-none">
        {/* Ambient Glow */}
        <div className="absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-red-600/15 blur-[130px]" />
        <div className="absolute -bottom-40 -right-40 h-[420px] w-[420px] rounded-full bg-red-900/20 blur-[130px]" />

        {/* Gold spotlight from above, for a richer, more ceremonial feel */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(251,191,36,0.10),transparent_70%)]" />

        {/* Vignette to frame the composition */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.6)_100%)]" />

        {/* Firelight glowing up from the bottom edge */}
        <div className="absolute inset-x-0 bottom-0 h-80 bg-[radial-gradient(ellipse_70%_100%_at_50%_100%,rgba(249,115,22,0.35),rgba(220,38,38,0.12)_55%,transparent_80%)] blur-2xl animate-flame-glow" />

        {/* Cinematic light rays, swaying gently */}
        <div
          className="absolute left-[15%] top-[-10%] h-[140%] w-24 bg-gradient-to-b from-transparent via-amber-200/10 to-transparent blur-2xl animate-ray-sway"
          style={{ "--ray-angle": "-16deg" } as React.CSSProperties}
        />
        <div
          className="absolute right-[20%] top-[-15%] h-[140%] w-32 bg-gradient-to-b from-transparent via-amber-100/[0.08] to-transparent blur-2xl animate-ray-sway"
          style={{ "--ray-angle": "12deg", animationDelay: "1.5s" } as React.CSSProperties}
        />


        {/* Rising embers */}
        <div className="absolute inset-0 overflow-hidden">
          {[
            { left: "6%", size: 4, delay: "0s", duration: "6s" },
            { left: "14%", size: 3, delay: "1.2s", duration: "7.5s" },
            { left: "23%", size: 5, delay: "2.4s", duration: "6.8s" },
            { left: "34%", size: 3, delay: "0.6s", duration: "8s" },
            { left: "45%", size: 4, delay: "3s", duration: "6.2s" },
            { left: "57%", size: 3, delay: "1.8s", duration: "7.2s" },
            { left: "68%", size: 5, delay: "0.3s", duration: "7.8s" },
            { left: "77%", size: 3, delay: "2.7s", duration: "6.5s" },
            { left: "86%", size: 4, delay: "1.5s", duration: "8.4s" },
            { left: "93%", size: 3, delay: "3.6s", duration: "7s" },
          ].map((ember, i) => (
            <span
              key={i}
              className="absolute bottom-0 rounded-full bg-gradient-to-t from-orange-500 via-amber-400 to-transparent shadow-[0_0_8px_2px_rgba(251,146,60,0.7)] animate-ember-rise"
              style={{
                left: ember.left,
                width: ember.size,
                height: ember.size,
                animationDelay: ember.delay,
                animationDuration: ember.duration,
              }}
            />
          ))}
        </div>

        {/* Drifting gold dust motes, spread across the whole hero */}
        <div className="absolute inset-0 overflow-hidden">
          {dustMotes.map((dust, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-amber-200 shadow-[0_0_6px_1px_rgba(252,211,77,0.8)] animate-dust-drift"
              style={{
                left: dust.left,
                top: dust.top,
                width: dust.size,
                height: dust.size,
                animationDelay: dust.delay,
                animationDuration: dust.duration,
              }}
            />
          ))}
        </div>
      </motion.div>

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
          <motion.div variants={textReveal} initial="hidden" animate="show" className="order-2 lg:order-1">
            {/* Ornamental flourish — a quiet, premium touch above the headline */}
            <motion.div variants={revealItem} className="mb-5 flex items-center gap-3">
              <span className="h-px w-10 bg-gradient-to-r from-transparent to-amber-400/70" />
              <span className="h-1.5 w-1.5 rotate-45 bg-amber-400/80" />
              <span className="h-px w-10 bg-gradient-to-l from-transparent to-amber-400/70" />
            </motion.div>

            <motion.h1 variants={revealItem} className="text-3xl font-extrabold leading-[1.15] text-white sm:text-4xl lg:text-5xl">
              {heroData.title.first} <AnimatedWord words={heroData.title.animated} />
            </motion.h1>

            {/* Animated gold underline, drawing in beneath the headline */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: "left" }}
              className="mt-4 h-px w-28 bg-gradient-to-r from-amber-400 to-transparent"
            />

            <motion.p variants={revealItem} className="mt-6 max-w-xl text-base leading-7 text-slate-300 md:text-lg">
              {heroData.description}
            </motion.p>

            {/* Buttons */}
            <motion.div variants={revealItem} className="mt-9 flex flex-col gap-4 sm:flex-row">
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
            </motion.div>

            {/* Statistics */}
            <motion.div variants={revealItem} className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-4">
              {heroData.statistics.map((item) => (
                <div key={item.label} className="bg-slate-950/60 p-5 text-center">
                  <h3 className="text-3xl font-bold text-white">
                    <CountUp end={Number(item.value)} duration={2} suffix="+" enableScrollSpy scrollSpyOnce />
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">{item.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
