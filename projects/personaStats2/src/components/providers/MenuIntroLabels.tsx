"use client";

import { motion, type Variants } from "framer-motion";

/** Full-screen menu destinations */
export const MENU_INTRO_DESTINATIONS = [
  { text: "PROFILE", href: "/profile" },
  { text: "SETTINGS", href: "/settings" },
  { text: "MISSIONS", href: "/missions" },
  { text: "STATS", href: "/stats" },
  { text: "MAP", href: "/map" },
  { text: "HOME", href: "/" },
] as const;

/**
 * Percent positions tuned to sit on / beside the white hand in `image_4` (similar read to image_1).
 */
const HAND_LAYOUT = [
  { top: "32%", left: "40%", rotate: -7 },
  { top: "40%", left: "37%", rotate: -5 },
  { top: "48%", left: "36%", rotate: -8 },
  { top: "56%", left: "38%", rotate: -6 },
  { top: "64%", left: "40%", rotate: -5 },
  { top: "71%", left: "37%", rotate: -6 },
] as const;

const CLIPS = [
  "polygon(0 4%, 100% 0, 98% 96%, 2% 100%)",
  "polygon(3% 0, 100% 8%, 97% 100%, 0 92%)",
  "polygon(0 0, 96% 6%, 100% 100%, 5% 98%)",
  "polygon(2% 10%, 100% 0, 100% 90%, 0 100%)",
  "polygon(0 8%, 100% 0, 100% 92%, 4% 100%)",
  "polygon(4% 0, 100% 6%, 96% 100%, 0 94%)",
] as const;

type MenuIntroLabelsProps = {
  reduceMotion: boolean;
  selectedIndex: number;
  onHoverIndex: (index: number) => void;
  onPick: (href: string) => void;
};

export function MenuIntroLabels({
  reduceMotion,
  selectedIndex,
  onHoverIndex,
  onPick,
}: MenuIntroLabelsProps) {
  const stagger = reduceMotion ? 0 : 0.09;
  const delayChildren = reduceMotion ? 0 : 0.18;

  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: stagger, delayChildren },
    },
  };

  const item: Variants = {
    hidden: {
      opacity: 0,
      scale: reduceMotion ? 1 : 0.82,
      x: reduceMotion ? 0 : -28,
      y: reduceMotion ? 0 : 12,
    },
    show: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      transition: reduceMotion
        ? { duration: 0.06 }
        : { type: "spring", stiffness: 420, damping: 22, mass: 0.85 },
    },
  };

  return (
    <motion.div
      className="absolute inset-0 z-20"
      variants={container}
      initial="hidden"
      animate="show"
      role="listbox"
      aria-label="Choose a destination"
    >
      {MENU_INTRO_DESTINATIONS.map((row, i) => {
        const clip = CLIPS[i % CLIPS.length];
        const pos = HAND_LAYOUT[i % HAND_LAYOUT.length];
        const onLight = i % 2 === 1;
        const selected = i === selectedIndex;

        return (
          <motion.div
            key={row.text}
            variants={item}
            className="absolute w-max max-w-[min(46vw,200px)] sm:max-w-[min(40vw,240px)] md:max-w-[260px]"
            style={{ top: pos.top, left: pos.left }}
          >
            <div
              style={{
                clipPath: clip,
                transform: `rotate(${pos.rotate}deg)`,
                transformOrigin: "left center",
              }}
            >
              <motion.button
                type="button"
                role="option"
                aria-selected={selected}
                onMouseEnter={() => onHoverIndex(i)}
                onFocus={() => onHoverIndex(i)}
                onClick={() => onPick(row.href)}
                whileHover={reduceMotion ? undefined : { scale: 1.04 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                className="relative cursor-pointer border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                {selected ? (
                  <span
                    className="absolute -left-1 bottom-1 top-1 w-1.5 bg-cyan-400 sm:w-2"
                    style={{ clipPath: "polygon(0 0, 100% 8%, 100% 92%, 0 100%)" }}
                    aria-hidden
                  />
                ) : null}
                <div
                  className={
                    onLight
                      ? `relative border-[3px] border-black px-2.5 py-1.5 sm:border-4 sm:px-4 sm:py-2 ${
                          selected ? "bg-persona-red" : "bg-paper"
                        }`
                      : `relative border-[3px] border-paper px-2.5 py-1.5 sm:border-4 sm:px-4 sm:py-2 ${
                          selected ? "bg-persona-red" : "bg-black"
                        }`
                  }
                >
                  <span
                    className={`font-p5-display text-sm tracking-[0.1em] sm:text-base md:text-lg ${
                      selected ? "text-paper" : onLight ? "text-black" : "text-paper"
                    }`}
                  >
                    {row.text}
                  </span>
                </div>
              </motion.button>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
