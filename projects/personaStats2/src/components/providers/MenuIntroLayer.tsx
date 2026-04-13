"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";

import {
  MENU_INTRO_DESTINATIONS,
  MenuIntroLabels,
} from "@/components/providers/MenuIntroLabels";
import { useRouteWipe } from "@/components/providers/routeWipeContext";
import { playPhantomSfx } from "@/lib/sfx";

type MenuIntroLayerProps = {
  onFinished: () => void;
};

const N = MENU_INTRO_DESTINATIONS.length;

/**
 * Full-screen Persona menu: `image_4` + hand labels — pick a route; no auto-redirect.
 */
export function MenuIntroLayer({ onFinished }: MenuIntroLayerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { skipNextEntryReveal } = useRouteWipe();
  const reduceMotion = useReducedMotion();
  const pickingRef = useRef(false);

  const fadeDuration = reduceMotion ? 0.12 : 0.48;

  const [phase, setPhase] = useState<"open" | "fade">("open");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const beginDismiss = useCallback(() => {
    setPhase("fade");
  }, []);

  const navigateTo = useCallback(
    (href: string) => {
      if (pickingRef.current) return;
      pickingRef.current = true;
      playPhantomSfx("menuConfirm");
      if (href !== pathname) {
        skipNextEntryReveal();
        startTransition(() => {
          router.push(href);
        });
      }
      window.setTimeout(beginDismiss, 100);
    },
    [beginDismiss, pathname, router, skipNextEntryReveal],
  );

  const dismissOnly = useCallback(() => {
    if (pickingRef.current) return;
    pickingRef.current = true;
    playPhantomSfx("menuCancel");
    beginDismiss();
  }, [beginDismiss]);

  useEffect(() => {
    if (phase !== "fade") return;
    const done = window.setTimeout(onFinished, fadeDuration * 1000 + 100);
    return () => window.clearTimeout(done);
  }, [phase, fadeDuration, onFinished]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== "open") return;
      if (e.key === "Escape") {
        e.preventDefault();
        dismissOnly();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        playPhantomSfx("menuMove");
        setSelectedIndex((i) => (i + 1) % N);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        playPhantomSfx("menuMove");
        setSelectedIndex((i) => (i - 1 + N) % N);
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        navigateTo(MENU_INTRO_DESTINATIONS[selectedIndex].href);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismissOnly, navigateTo, phase, selectedIndex]);

  const shake = reduceMotion
    ? {}
    : {
        animate: {
          x: [0, -5, 5, -3, 3, 0],
          transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const, delay: 0.05 },
        },
      };

  return (
    <motion.div
      className="fixed inset-0 z-[10000] flex cursor-default flex-col items-center justify-center bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label="Phantom menu"
      initial={{ opacity: 1 }}
      animate={phase === "fade" ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: fadeDuration, ease: [0.22, 1, 0.36, 1] }}
      onClick={dismissOnly}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-linear-to-t from-black via-black/20 to-black/50"
        aria-hidden
      />

      {!reduceMotion ? (
        <motion.div
          className="pointer-events-none absolute inset-0 z-[5] bg-linear-to-br from-transparent via-persona-red/30 to-transparent"
          initial={{ opacity: 0, scale: 1.4 }}
          animate={{ opacity: [0, 0.9, 0], scale: [1.2, 1, 1] }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        />
      ) : null}

      <motion.div
        className="relative z-10 flex max-h-[100dvh] flex-col items-center px-3 py-6"
        onClick={(e) => e.stopPropagation()}
        {...(reduceMotion ? {} : shake)}
      >
        <motion.div
          className="relative h-[min(78vh,720px)] w-[min(92vw,860px)] sm:h-[min(88vh,820px)] sm:w-[min(96vw,920px)]"
          initial={{ opacity: 0, scale: 1.22, rotate: -3 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={
            reduceMotion
              ? { duration: 0.08 }
              : { type: "spring", stiffness: 260, damping: 24, mass: 0.9 }
          }
        >
          <Image
            src="/profile-ref/image_4.png"
            alt=""
            fill
            className="pointer-events-none object-contain object-center select-none drop-shadow-[0_0_48px_rgba(230,0,18,0.45)]"
            sizes="(max-width:768px) 96vw, 920px"
            priority
            draggable={false}
          />
          <MenuIntroLabels
            reduceMotion={!!reduceMotion}
            selectedIndex={selectedIndex}
            onHoverIndex={setSelectedIndex}
            onPick={navigateTo}
          />
        </motion.div>

        <p className="font-marker mt-4 max-w-md text-center text-xs text-paper/50 sm:mt-6 sm:text-sm">
          Click a command on the hand · ↑↓ + Enter · Esc or backdrop closes
        </p>
      </motion.div>
    </motion.div>
  );
}
