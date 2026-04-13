"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { TopLeftDateIndicator } from "@/components/providers/TopLeftDateIndicator";
import { TopRightDeadline } from "@/components/providers/TopRightDeadline";
import { HubNavLinks, hubCurrentFromPathname } from "@/components/ui/HubNavLinks";
import { useStore } from "@/store/useStore";

const COLLAPSE_LS_KEY = "phantom-top-hud-date-collapsed";

/**
 * In-flow top strip: shared hub links + collapsible date / deadline row.
 */
export function PhantomTopHud() {
  const monitored = useStore((s) => s.monitoredMode);
  const pathname = usePathname();
  const current = hubCurrentFromPathname(pathname);
  const reduceMotion = useReducedMotion();

  const [dateRowCollapsed, setDateRowCollapsed] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(COLLAPSE_LS_KEY);
      if (v === "1") setDateRowCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleDateRow = useCallback(() => {
    setDateRowCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(COLLAPSE_LS_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <header
      className={`sticky z-40 w-full shrink-0 border-b-4 border-persona-red bg-black/95 backdrop-blur-sm ${
        monitored ? "top-9" : "top-0"
      }`}
      aria-label="Navigation, date, and deadlines"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-persona-red/35 px-3 py-2 sm:px-5 sm:py-2.5">
        <HubNavLinks current={current} className="pointer-events-auto min-w-0 flex-1" />
        <button
          type="button"
          onClick={toggleDateRow}
          className="pointer-events-auto shrink-0 border border-paper/25 bg-black/80 px-2.5 py-1.5 font-p5-display text-[10px] tracking-[0.2em] text-paper/80 outline-none hover:border-persona-red hover:text-persona-red focus-visible:ring-2 focus-visible:ring-cyan-400 sm:text-[11px] sm:tracking-[0.28em]"
          aria-expanded={!dateRowCollapsed}
        >
          {dateRowCollapsed ? "DATE · DUE ▼" : "DATE · DUE ▲"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {!dateRowCollapsed ? (
          <motion.div
            key="date-due-row"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:px-5 sm:py-3">
              <TopLeftDateIndicator />
              <TopRightDeadline />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
