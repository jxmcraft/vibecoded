"use client";

import { useEffect, useState } from "react";

import { getNearestDeadline } from "@/lib/getNearestDeadline";
import { useStore } from "@/store/useStore";

export function TopRightDeadline() {
  const calendarEvents = useStore((s) => s.calendarEvents);
  const callingCard = useStore((s) => s.callingCard);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const nearest = getNearestDeadline(now, calendarEvents, callingCard);

  return (
    <div className="min-w-0 max-w-[min(20rem,calc(100vw-2rem))] shrink sm:max-w-[22rem]">
      <div className="relative ml-auto border-2 border-persona-red bg-black/90 px-3 py-3 text-left shadow-[-4px_4px_0_0_rgba(230,0,18,0.35)] sm:px-4 sm:py-3.5">
        <p className="font-p5-display text-[11px] tracking-[0.32em] text-persona-red sm:text-xs sm:tracking-[0.38em]">
          DAYS UNTIL
        </p>
        <p className="font-bebas text-5xl leading-none tracking-tight text-paper sm:text-6xl">
          {nearest != null ? nearest.daysUntil : "—"}
        </p>
        <p
          className="mt-2 line-clamp-3 font-marker text-sm leading-snug text-paper/85 sm:text-base"
          title={nearest?.label}
        >
          {nearest != null ? nearest.label : "No upcoming deadline"}
        </p>
        {nearest != null ? (
          <p className="mt-2 font-bebas text-[11px] tracking-[0.28em] text-paper/50 sm:text-xs sm:tracking-widest">
            {nearest.source === "callingCard" ? "CALLING CARD" : "CALENDAR"}
          </p>
        ) : (
          <p className="mt-2 font-marker text-xs text-paper/50 sm:text-sm">
            Add a calendar event or set this week&apos;s Calling Card.
          </p>
        )}
      </div>
    </div>
  );
}
