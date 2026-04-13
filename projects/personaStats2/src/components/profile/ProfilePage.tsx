"use client";

import { useEffect, useState } from "react";

import { PersonaNavLink } from "@/components/ui/PersonaNavLink";
import { dayNightPeriodAt } from "@/lib/dayNightPeriod";

import { ConfidantGuildPanel } from "./ConfidantGuildPanel";
import { CityscapeParallax } from "./CityscapeParallax";
import { ProfileBackdrop } from "./ProfileBackdrop";

type ProfileCommandMode = "idle" | "stats" | "settings" | "guild";

const copy: Record<ProfileCommandMode, { title: string; body: string }> = {
  idle: {
    title: "Lounging",
    body: "After-school quiet. Pick a menu — the city keeps moving either way.",
  },
  stats: {
    title: "Checking parameters",
    body: "Digits don’t lie. A quick glance at the phone before the next move.",
  },
  settings: {
    title: "Opening settings",
    body: "Audio, rain, SFX — tune the room before you dive back into the day.",
  },
  guild: {
    title: "Thieves Guild",
    body: "Pick who walks beside each stat. They’ll ping you when the bond ranks up.",
  },
};

/** Jagged P5-style tiles — each row gets a distinct clip so blocks feel “cut out.” */
const MENU_CLIPS = [
  "polygon(0 6%, 100% 0, 98% 94%, 3% 100%)",
  "polygon(2% 0, 100% 10%, 96% 100%, 0 88%)",
  "polygon(0 0, 97% 12%, 100% 100%, 5% 96%)",
  "polygon(3% 8%, 100% 0, 97% 92%, 0 100%)",
] as const;

export function ProfilePage() {
  const [period, setPeriod] = useState(() => dayNightPeriodAt());
  const [mode, setMode] = useState<ProfileCommandMode>("idle");

  useEffect(() => {
    const id = window.setInterval(() => setPeriod(dayNightPeriodAt()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative z-10 flex min-h-dvh flex-1 flex-col overflow-x-hidden bg-transparent text-paper">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.42]">
        <CityscapeParallax period={period} />
      </div>
      <div className="pointer-events-none absolute inset-0 z-1">
        <ProfileBackdrop />
      </div>

      <div className="relative z-10 flex min-h-full flex-1 flex-col">
        <header className="relative border-b-4 border-persona-red bg-black/82 px-4 py-6 backdrop-blur-[3px] sm:px-10 sm:py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <PersonaNavLink
                  href="/"
                  className="font-p5-display text-sm tracking-[0.28em] text-persona-red hover:underline sm:text-base"
                >
                  ← HOME
                </PersonaNavLink>
                <PersonaNavLink
                  href="/settings"
                  className="font-p5-display text-sm tracking-[0.28em] text-paper/85 hover:text-persona-red hover:underline sm:text-base"
                >
                  SETTINGS
                </PersonaNavLink>
              </div>
              <h1 className="font-p5-display text-5xl leading-none tracking-[0.14em] text-paper [text-shadow:3px_3px_0_#000] sm:text-6xl md:text-7xl">
                PROFILE
              </h1>
              <p className="max-w-xl font-marker text-base leading-snug text-paper/55 sm:text-lg">
                Phantom menu — tune the rig, then slip back to the city.
              </p>
            </div>
            <div className="shrink-0 text-right sm:pt-1">
              <p className="font-p5-display text-xs tracking-[0.35em] text-persona-red/95 sm:text-sm">
                {period.toUpperCase()}
              </p>
              <p className="font-p5-display mt-1 text-[10px] tracking-[0.45em] text-paper/50 sm:text-xs">
                LOCAL TIME
              </p>
            </div>
          </div>
        </header>

        <div className="relative flex flex-1 flex-col items-center px-4 py-10 sm:px-8">
          <aside className="flex w-full max-w-2xl flex-col justify-center gap-8 border-persona-red/40 bg-black/45 px-6 py-10 sm:border-l-4 sm:border-r-4 sm:px-10">
            <nav aria-label="Profile sections" className="flex flex-col gap-6">
              <div className="-rotate-1 pl-1">
                <p className="font-p5-display text-6xl leading-[0.9] tracking-[0.08em] text-paper [text-shadow:4px_4px_0_#000,-2px_-2px_0_rgba(230,0,18,0.35)] sm:text-7xl md:text-8xl">
                  MENU
                </p>
                <p className="font-p5-display mt-3 text-sm tracking-[0.5em] text-persona-red sm:text-base">
                  COMMAND
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => setMode("idle")}
                  style={{ clipPath: MENU_CLIPS[0] }}
                  className={`w-full border-4 py-5 pl-6 pr-5 text-left font-p5-display text-xl tracking-[0.18em] transition-transform duration-200 sm:text-2xl md:text-3xl ${
                    mode === "idle"
                      ? "border-paper bg-persona-red text-paper shadow-[6px_6px_0_0_#000]"
                      : "border-paper bg-black text-paper hover:-translate-x-0.5 hover:border-persona-red hover:shadow-[4px_4px_0_0_rgba(230,0,18,0.6)]"
                  }`}
                >
                  LOUNGE
                </button>
                <button
                  type="button"
                  onClick={() => setMode("stats")}
                  style={{ clipPath: MENU_CLIPS[1] }}
                  className={`w-full border-4 py-5 pl-6 pr-5 text-left font-p5-display text-xl tracking-[0.18em] transition-transform duration-200 sm:text-2xl md:text-3xl ${
                    mode === "stats"
                      ? "border-paper bg-persona-red text-paper shadow-[6px_6px_0_0_#000]"
                      : "border-paper bg-black text-paper hover:-translate-x-0.5 hover:border-persona-red hover:shadow-[4px_4px_0_0_rgba(230,0,18,0.6)]"
                  }`}
                >
                  PARAMETERS
                </button>
                <button
                  type="button"
                  onClick={() => setMode("guild")}
                  style={{ clipPath: MENU_CLIPS[2] }}
                  className={`w-full border-4 py-5 pl-6 pr-5 text-left font-p5-display text-xl tracking-[0.18em] transition-transform duration-200 sm:text-2xl md:text-3xl ${
                    mode === "guild"
                      ? "border-paper bg-persona-red text-paper shadow-[6px_6px_0_0_#000]"
                      : "border-paper bg-black text-paper hover:-translate-x-0.5 hover:border-persona-red hover:shadow-[4px_4px_0_0_rgba(230,0,18,0.6)]"
                  }`}
                >
                  THE GUILD
                </button>
                <PersonaNavLink
                  href="/settings"
                  onClick={() => setMode("settings")}
                  style={{ clipPath: MENU_CLIPS[3] }}
                  className={`inline-flex w-full items-center border-4 py-5 pl-6 pr-5 font-p5-display text-xl tracking-[0.14em] transition-transform duration-200 sm:text-2xl md:text-3xl ${
                    mode === "settings"
                      ? "border-paper bg-persona-red text-paper shadow-[6px_6px_0_0_#000]"
                      : "border-paper bg-black text-paper hover:-translate-x-0.5 hover:border-persona-red hover:shadow-[4px_4px_0_0_rgba(230,0,18,0.6)]"
                  }`}
                >
                  SETTINGS
                </PersonaNavLink>
              </div>
            </nav>

            <div
              className="w-full border-4 border-paper/25 bg-black/70 p-6 shadow-[8px_8px_0_0_rgba(0,0,0,0.65)]"
              style={{ clipPath: "polygon(0 0, 100% 4%, 98% 100%, 2% 96%)" }}
            >
              {mode === "guild" ? (
                <ConfidantGuildPanel />
              ) : (
                <>
                  <p className="font-p5-display text-lg tracking-[0.22em] text-persona-red sm:text-xl">
                    {copy[mode].title.toUpperCase()}
                  </p>
                  <p className="font-marker mt-4 text-base leading-relaxed text-paper/85 sm:text-lg">
                    {copy[mode].body}
                  </p>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
