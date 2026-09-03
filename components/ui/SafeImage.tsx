"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { ImageOff } from "lucide-react";

// Keep in sync with images.remotePatterns in next.config.ts.
const OPTIMIZABLE_HOSTS = [/(^|\.)supabase\.co$/, /^images\.unsplash\.com$/];

// Content fields like a news cover image can hold any URL an admin pastes in (e.g. hotlinked
// from a Google Images result), not just our own storage. Next's image optimizer 400s on any
// host that isn't in remotePatterns, so those must render unoptimized instead of erroring.
function isUnoptimizableSrc(src: ImageProps["src"]) {
  if (typeof src !== "string" || !/^https?:\/\//.test(src)) return false;
  try {
    const { hostname } = new URL(src);
    return !OPTIMIZABLE_HOSTS.some((pattern) => pattern.test(hostname));
  } catch {
    return true;
  }
}

export function SafeImage(props: ImageProps) {
  const [failed, setFailed] = useState(false);
  const { alt = "", ...rest } = props;

  if (failed || !props.src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600">
        <ImageOff size={28} />
      </div>
    );
  }

  return (
    <Image
      alt={alt}
      {...rest}
      unoptimized={props.unoptimized ?? isUnoptimizableSrc(props.src)}
      onError={() => setFailed(true)}
    />
  );
}
