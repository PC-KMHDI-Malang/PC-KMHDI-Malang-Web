"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { ImageOff } from "lucide-react";

export function SafeImage(props: ImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600">
        <ImageOff size={28} />
      </div>
    );
  }

  return <Image {...props} unoptimized onError={() => setFailed(true)} />;
}
