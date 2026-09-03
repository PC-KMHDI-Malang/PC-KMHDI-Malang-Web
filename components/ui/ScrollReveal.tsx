"use client";

import { motion, useInView } from "framer-motion";
import { ReactNode, useRef } from "react";
import CountUp from "react-countup";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  delay?: number;
  duration?: number;
  scale?: number;
  once?: boolean;
}

export function ScrollReveal({ children, className = "", direction = "up", distance = 32, delay = 0, duration = 0.65, scale = 1, once = true }: ScrollRevealProps) {
  const getOffset = () => {
    switch (direction) {
      case "up":
        return { y: distance, x: 0 };
      case "down":
        return { y: -distance, x: 0 };
      case "left":
        return { x: distance, y: 0 };
      case "right":
        return { x: -distance, y: 0 };
      case "none":
      default:
        return { x: 0, y: 0 };
    }
  };

  const offset = getOffset();

  return (
    <motion.div
      initial={{
        opacity: 0,
        scale,
        x: offset.x,
        y: offset.y,
      }}
      whileInView={{
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
      }}
      viewport={{ once, margin: "-60px" }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1], // cubic-bezier smooth easeOut
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface ScrollStaggerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
}

export function ScrollStagger({ children, className = "", staggerDelay = 0.12, once = true }: ScrollStaggerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-60px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScrollStaggerItem({
  children,
  className = "",
  direction = "up",
  distance = 30,
  duration = 0.6,
}: {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  duration?: number;
}) {
  const getOffset = () => {
    switch (direction) {
      case "up":
        return { y: distance, x: 0 };
      case "down":
        return { y: -distance, x: 0 };
      case "left":
        return { x: distance, y: 0 };
      case "right":
        return { x: -distance, y: 0 };
      default:
        return { x: 0, y: 0 };
    }
  };

  const offset = getOffset();

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: offset.x, y: offset.y },
        show: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: {
            duration,
            ease: [0.22, 1, 0.36, 1],
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface CountUpOnScrollProps {
  value: string;
  className?: string;
}

export function CountUpOnScroll({ value, className = "" }: CountUpOnScrollProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const match = value.match(/^([^\d]*)(\d+)([^\d]*)$/);
  if (!match) {
    return <span className={className}>{value}</span>;
  }

  const prefix = match[1] || "";
  const end = parseInt(match[2], 10);
  const suffix = match[3] || "";

  return (
    <span ref={ref} className={className}>
      {isInView ? <CountUp start={0} end={end} duration={2.2} prefix={prefix} suffix={suffix} separator="" /> : `${prefix}0${suffix}`}
    </span>
  );
}
