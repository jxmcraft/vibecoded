"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { dateKeyFromDate } from "@/lib/dateKey";
import { dayNightPeriodAt, type DayNightPeriod } from "@/lib/dayNightPeriod";

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

function periodLabel(period: DayNightPeriod): string {
  if (period === "night") return "NIGHT";
  if (period === "dawn") return "DAWN";
  if (period === "dusk") return "DUSK";
  return "DAYTIME";
}

function formatDateParts(d: Date): { month: string; day: string; year: string } {
  return {
    month: MONTHS[d.getMonth()] ?? "—",
    day: String(d.getDate()),
    year: String(d.getFullYear()),
  };
}

export function TopLeftDateIndicator() {
  const reduceMotion = useReducedMotion();
  const lastDateKeyRef = useRef(dateKeyFromDate(new Date()));
  const [tick, setTick] = useState(0);
  const [displayDate, setDisplayDate] = useState(() => new Date());

  useEffect(() => {
    const check = () => {
      const n = new Date();
      const key = dateKeyFromDate(n);
      if (key !== lastDateKeyRef.current) {
        lastDateKeyRef.current = key;
        setDisplayDate(n);
        setTick((t) => t + 1);
      }
    };
    check();
    const id = window.setInterval(check, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const period = dayNightPeriodAt(displayDate);
  const parts = formatDateParts(displayDate);

  return (
    <div className="min-w-0 max-w-[14rem] shrink sm:max-w-[16rem]">
      <div className="relative border-2 border-persona-red bg-black/90 px-3 py-2.5 shadow-[4px_4px_0_0_rgba(230,0,18,0.35)] sm:px-3.5 sm:py-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={tick}
            initial={reduceMotion ? false : { x: 28, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduceMotion ? undefined : { x: -36, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-1"
          >
            <p className="font-p5-display text-[10px] tracking-[0.32em] text-persona-red sm:text-[11px]">
              DATE
            </p>
            <p className="font-bebas text-3xl leading-none tracking-widest text-paper sm:text-4xl">
              <span className="text-persona-red">{parts.month}</span>{" "}
              <span className="text-paper">{parts.day}</span>
              <span className="text-paper/65">, {parts.year}</span>
            </p>
            <p className="font-bebas text-xs tracking-[0.35em] text-paper/60 sm:text-sm">
              {periodLabel(period)}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
