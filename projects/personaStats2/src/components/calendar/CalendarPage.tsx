"use client";

import { useCallback, useMemo, useState } from "react";

import { AllOutAttackOverlay } from "@/components/rewards/AllOutAttackOverlay";
import { LevelUpOverlay } from "@/components/rewards/LevelUpOverlay";
import { PersonaButton } from "@/components/ui/PersonaButton";
import { dateKeyFromDate } from "@/lib/dateKey";
import { useStore } from "@/store/useStore";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

function monthMatrix(year: number, monthIndex: number): (number | null)[][] {
  const first = new Date(year, monthIndex, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

function toDateKey(year: number, monthIndex: number, day: number): string {
  return dateKeyFromDate(new Date(year, monthIndex, day));
}

function weekdayColorClass(dayIndex: number): string {
  if (dayIndex === 0) return "text-persona-red";
  if (dayIndex === 6) return "text-cyan-300";
  return "text-paper";
}

function selectedDateBanner(year: number, monthIndex: number, day: number): string {
  const d = new Date(year, monthIndex, day);
  const short = d.toLocaleDateString(undefined, { weekday: "short" });
  return `${monthIndex + 1}/${day}/${year} (${short})`;
}

export function CalendarPage() {
  const today = new Date();
  const [cursor, setCursor] = useState(() => ({
    y: today.getFullYear(),
    m: today.getMonth(),
  }));
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const calendarEvents = useStore((s) => s.calendarEvents);
  const addCalendarEvent = useStore((s) => s.addCalendarEvent);
  const removeCalendarEvent = useStore((s) => s.removeCalendarEvent);

  const [title, setTitle] = useState("");

  const todayKey = dateKeyFromDate(today);
  const selectedKey =
    selectedDay != null ? toDateKey(cursor.y, cursor.m, selectedDay) : todayKey;

  const matrix = useMemo(() => monthMatrix(cursor.y, cursor.m), [cursor.y, cursor.m]);

  const monthShort = new Date(cursor.y, cursor.m, 1)
    .toLocaleString(undefined, { month: "short" })
    .toUpperCase();

  const eventsOnSelected = useMemo(
    () => calendarEvents.filter((e) => e.dateKey === selectedKey),
    [calendarEvents, selectedKey],
  );

  const goPrevMonth = useCallback(() => {
    setCursor((c) => {
      const d = new Date(c.y, c.m - 1, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }, []);

  const goNextMonth = useCallback(() => {
    setCursor((c) => {
      const d = new Date(c.y, c.m + 1, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }, []);

  const onAdd = () => {
    const t = title.trim();
    if (!t) return;
    addCalendarEvent({ title: t, dateKey: selectedKey });
    setTitle("");
  };

  const bannerLabel =
    selectedDay != null
      ? selectedDateBanner(cursor.y, cursor.m, selectedDay)
      : selectedDateBanner(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <>
      <div className="relative z-10 flex min-h-full flex-1 flex-col overflow-x-hidden bg-transparent text-paper">
        <header className="relative border-b-4 border-persona-red bg-black px-5 py-6 sm:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <h1 className="font-p5-display text-4xl tracking-[0.2em] text-paper sm:text-5xl">
                CALENDAR
              </h1>
              <p className="font-marker max-w-xl text-sm text-paper/60 sm:text-base">
                Sundays in red, Saturdays in blue — like the in-game planner. Your entries for the
                selected day appear in the daily log.
              </p>
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8 lg:flex-row lg:items-start lg:gap-10">
          {/* Left: calendar (P5-style) */}
          <section className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <PersonaButton
                  type="button"
                  variant="chip"
                  onClick={goPrevMonth}
                  className="font-p5-display text-[10px] tracking-widest"
                >
                  L1
                </PersonaButton>
                <p className="font-bebas text-3xl tracking-[0.2em] text-paper sm:text-4xl">
                  {monthShort}
                </p>
                <PersonaButton
                  type="button"
                  variant="chip"
                  onClick={goNextMonth}
                  className="font-p5-display text-[10px] tracking-widest"
                >
                  R1
                </PersonaButton>
              </div>
              <div className="border-2 border-paper/25 bg-black px-3 py-1.5 font-bebas text-sm tracking-wide text-paper sm:text-base">
                {bannerLabel}
              </div>
            </div>

            <div className="-skew-x-2 transform border-y border-paper/20 py-1 sm:-skew-x-3">
              <div className="skew-x-2 sm:skew-x-3">
                <div className="grid grid-cols-7 gap-0 border-2 border-paper/20 bg-black/60">
                  {WEEKDAYS.map((w, wi) => (
                    <div
                      key={w}
                      className={`border-b-2 border-paper/15 py-2 text-center font-bebas text-xs tracking-[0.2em] sm:text-sm ${weekdayColorClass(wi)}`}
                    >
                      {w}
                    </div>
                  ))}
                  {matrix.flatMap((row, ri) =>
                    row.map((day, ci) => {
                      const key = `${ri}-${ci}`;
                      if (day == null) {
                        return (
                          <div
                            key={key}
                            className="min-h-11 border-b border-paper/10 bg-black/30 sm:min-h-12"
                            aria-hidden
                          />
                        );
                      }
                      const dk = toDateKey(cursor.y, cursor.m, day);
                      const isToday = dk === todayKey;
                      const isSel = day === selectedDay;
                      const hasEvent = calendarEvents.some((e) => e.dateKey === dk);
                      const wd = new Date(cursor.y, cursor.m, day).getDay();
                      const numColor = weekdayColorClass(wd);

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedDay(day)}
                          className={`relative min-h-11 border-b border-l border-paper/10 bg-black/50 transition-colors hover:bg-paper/5 sm:min-h-12 ${
                            isSel ? "bg-persona-red/20 ring-1 ring-inset ring-persona-red/60" : ""
                          }`}
                        >
                          <span
                            className={`relative z-1 flex flex-col items-center justify-center gap-0.5 font-bebas text-lg leading-none sm:text-xl ${numColor}`}
                          >
                            <span
                              className={
                                isToday
                                  ? "rounded-full px-1.5 py-0.5 shadow-[0_0_0_3px_rgba(230,0,18,0.85),2px_2px_0_0_rgba(230,0,18,0.4)]"
                                  : undefined
                            }
                            >
                              {day}
                            </span>
                            {hasEvent ? (
                              <span className="h-1 w-1 rounded-full bg-persona-red shadow-[0_0_6px_rgba(230,0,18,0.9)]" />
                            ) : null}
                          </span>
                        </button>
                      );
                    }),
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Right: daily log */}
          <aside className="w-full shrink-0 lg:sticky lg:top-28 lg:w-[min(100%,22rem)]">
            <div
              className="rotate-[1.2deg] border-2 border-black/40 bg-[#ece8df] p-4 text-black shadow-[10px_10px_0_0_rgba(230,0,18,0.35)] sm:p-5"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(transparent 0 27px, rgba(0,0,0,0.08) 27px 28px)",
                backgroundPosition: "0 32px",
              }}
            >
              <h2 className="font-bebas text-2xl tracking-[0.15em] text-black">DAILY LOG</h2>
              <p className="mt-1 font-marker text-xs text-black/55">{selectedKey}</p>

              <ul className="mt-5 space-y-3">
                {eventsOnSelected.length === 0 ? (
                  <li className="font-marker text-sm text-black/50">Nothing logged for this day.</li>
                ) : (
                  eventsOnSelected.map((ev, i) => (
                    <li
                      key={ev.id}
                      className={`group flex items-start justify-between gap-2 font-marker text-sm leading-snug ${
                        i === 0
                          ? "text-persona-red underline decoration-persona-red decoration-2 underline-offset-4"
                          : "text-black/90"
                      }`}
                    >
                      <span className="min-w-0 flex-1">{ev.title}</span>
                      <PersonaButton
                        type="button"
                        variant="ghost"
                        onClick={() => removeCalendarEvent(ev.id)}
                        className="shrink-0 font-p5-display text-[9px] text-black/50 hover:text-persona-red"
                      >
                        DEL
                      </PersonaButton>
                    </li>
                  ))
                )}
              </ul>

              <div className="mt-8 border-t-2 border-dashed border-black/20 pt-4">
                <p className="font-p5-display text-[9px] tracking-[0.28em] text-black/45">
                  LOG ENTRY
                </p>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What happened today?"
                  className="mt-2 w-full border-2 border-black/25 bg-white/80 px-2 py-2 font-marker text-sm text-black outline-none placeholder:text-black/35 focus:border-persona-red"
                />
                <PersonaButton
                  type="button"
                  variant="primary"
                  onClick={onAdd}
                  className="mt-3 font-p5-display text-xs"
                >
                  ADD
                </PersonaButton>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <LevelUpOverlay />
      <AllOutAttackOverlay />
    </>
  );
}
