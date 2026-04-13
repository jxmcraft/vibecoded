"use client";

import { useEffect, useMemo, useState } from "react";

import type { DayNightPeriod } from "@/lib/dayNightPeriod";

type CityscapeParallaxProps = {
  period: DayNightPeriod;
};

const skyByPeriod: Record<DayNightPeriod, string> = {
  dawn: "linear-gradient(180deg, #2d1538 0%, #8b2d3e 45%, #c45c3a 100%)",
  day: "linear-gradient(180deg, #0a1628 0%, #1a3a5c 40%, #4a6fa5 100%)",
  dusk: "linear-gradient(180deg, #1a0a20 0%, #5c1e38 50%, #c04020 100%)",
  night: "linear-gradient(180deg, #050510 0%, #12122a 55%, #1e1e48 100%)",
};

function clamp01(n: number) {
  return Math.min(1, Math.max(-1, n));
}

export function CityscapeParallax({ period }: CityscapeParallaxProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const nx = clamp01((e.clientX / window.innerWidth) * 2 - 1);
      const ny = clamp01((e.clientY / window.innerHeight) * 2 - 1);
      setTilt({ x: nx, y: ny });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const far = useMemo(
    () => ({ x: tilt.x * 8, y: tilt.y * 4 }),
    [tilt.x, tilt.y],
  );
  const mid = useMemo(
    () => ({ x: tilt.x * 16, y: tilt.y * 8 }),
    [tilt.x, tilt.y],
  );
  const near = useMemo(
    () => ({ x: tilt.x * 28, y: tilt.y * 12 }),
    [tilt.x, tilt.y],
  );

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 transition-[background] duration-[2s]"
        style={{ background: skyByPeriod[period] }}
      />
      {/* Far: skyline blocks */}
      <div
        className="absolute bottom-0 left-[-12%] right-[-12%] h-[42%] opacity-90"
        style={{
          transform: `translate3d(${far.x}px, ${far.y * 0.5}px, 0)`,
          transition: "transform 0.35s ease-out",
          background:
            "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.55) 12%, rgba(0,0,0,0.92) 100%)",
          clipPath:
            "polygon(0% 100%, 0% 38%, 8% 62%, 14% 28%, 22% 55%, 30% 22%, 38% 48%, 46% 18%, 54% 52%, 62% 26%, 70% 58%, 78% 20%, 86% 50%, 94% 32%, 100% 60%, 100% 100%)",
        }}
      />
      {/* Mid: “traffic” streaks */}
      <div
        className="absolute bottom-[8%] left-[-20%] right-[-20%] h-[28%]"
        style={{
          transform: `translate3d(${mid.x}px, ${mid.y}px, 0)`,
          transition: "transform 0.28s ease-out",
          background:
            "repeating-linear-gradient(90deg, transparent 0, transparent 40px, rgba(255,255,255,0.07) 40px, rgba(255,255,255,0.07) 44px)",
          maskImage: "linear-gradient(90deg, transparent, black 15%, black 85%, transparent)",
        }}
      />
      {/* Near: railing / foreground mass */}
      <div
        className="absolute inset-x-0 bottom-0 h-[22%] bg-linear-to-t from-black via-black/85 to-transparent"
        style={{
          transform: `translate3d(${near.x}px, ${near.y * 0.4}px, 0)`,
          transition: "transform 0.22s ease-out",
          boxShadow: "0 -12px 40px rgba(230,0,18,0.12)",
        }}
      />
    </div>
  );
}
