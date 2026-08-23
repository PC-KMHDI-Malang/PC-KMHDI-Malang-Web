"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface AnimatedWordProps {
  words: string[];
  interval?: number;
}

export default function AnimatedWord({
  words,
  interval = 2500,
}: AnimatedWordProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, interval);

    return () => clearInterval(timer);
  }, [words.length, interval]);

  return (
    <div className="relative h-[1.2em] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -30, filter: "blur(8px)" }}
          transition={{
            duration: 0.1,
            ease: "easeInOut",
          }}
          className="absolute left-0 top-0 bg-gradient-to-r from-red-300 via-white to-red-200 bg-clip-text font-extrabold text-transparent"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}