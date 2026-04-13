"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";

import { STAT_TYPES, type StatType } from "@/lib/models";
import {
  labelAnchor,
  pentagonRing,
  radarPolygonPointsString,
} from "@/lib/radarGeometry";
import { useStore } from "@/store/useStore";

function statsFingerprint(stats: Record<StatType, { level: number; totalXP: number }>) {
  return STAT_TYPES.map((t) => `${stats[t].level}:${stats[t].totalXP}`).join("|");
}

const ringScales = [0.35, 0.65, 1] as const;

const labelFont = "var(--font-bebas), Impact, Haettenschweiler, sans-serif";

export function PentagramRadar() {
  const stats = useStore((s) => s.stats);
  const reduceMotion = useReducedMotion();
  const prevFp = useRef<string | null>(null);
  const pulse = useAnimationControls();
  const motionOn = !reduceMotion;

  const cx = 120;
  const cy = 120;
  const outer = 90;
  const levels = STAT_TYPES.map((t) => stats[t].level);
  const points = radarPolygonPointsString(cx, cy, outer, levels);

  const ringPolylines = ringScales.map((s) =>
    pentagonRing(cx, cy, outer * s)
      .map((p) => `${p.x},${p.y}`)
      .join(" "),
  );

  useEffect(() => {
    void pulse.set({ scale: 1 });
  }, [pulse]);

  useEffect(() => {
    const fp = statsFingerprint(stats);
    if (prevFp.current !== null && prevFp.current !== fp && motionOn) {
      void pulse.start({
        scale: [1, 1.07, 1],
        transition: { duration: 0.5, ease: "easeInOut" },
      });
    }
    prevFp.current = fp;
  }, [stats, pulse, motionOn]);

  return (
    <div className="-rotate-6 select-none sm:-rotate-3">
      <motion.svg
        viewBox="0 0 240 240"
        className="mx-auto h-auto w-full max-w-[min(92vw,440px)] drop-shadow-[0_0_1px_rgba(230,0,18,0.35)]"
        initial={motionOn ? { opacity: 0, scale: 0.94 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        role="img"
        aria-label="Social stats pentagon radar"
      >
        {ringPolylines.map((pts, i) => (
          <motion.polygon
            key={i}
            points={pts}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1}
            strokeLinejoin="miter"
            initial={motionOn ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.04 * i, duration: 0.4, ease: "easeOut" }}
          />
        ))}

        <motion.g
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          animate={pulse}
        >
          <motion.polygon
            key={points}
            points={points}
            fill="rgba(230,0,18,0.22)"
            stroke="#E60012"
            strokeWidth={2.5}
            initial={motionOn ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </motion.g>

        {STAT_TYPES.map((label, i) => {
          const { x, y } = labelAnchor(cx, cy, outer, i);
          return (
            <motion.text
              key={label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              style={{ fontFamily: labelFont, fontSize: 11 }}
              initial={motionOn ? { opacity: 0, y: y + 8 } : false}
              animate={{ opacity: 1, y }}
              transition={{ delay: 0.18 + i * 0.06, duration: 0.35, ease: "easeOut" }}
            >
              {label.toUpperCase()}
            </motion.text>
          );
        })}
      </motion.svg>
    </div>
  );
}
