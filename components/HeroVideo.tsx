"use client";

import { useEffect, useRef } from "react";

/**
 * Silent looping background video for the home hero. React does not render
 * the `muted` attribute into server HTML, which makes some browsers refuse to
 * autoplay — so we set it on the element and call play() after mount. The
 * poster (same scene as the first frame) shows until the video can play, and
 * the video is hidden entirely for visitors who prefer reduced motion.
 */
export function HeroVideo({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {
      /* autoplay blocked — the poster stays, which is fine */
    });
  }, []);

  return (
    <video
      ref={ref}
      className="hero-video absolute inset-0 h-full w-full object-cover"
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
    />
  );
}
