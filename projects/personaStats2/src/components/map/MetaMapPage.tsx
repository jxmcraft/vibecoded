"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";

import { TakeActionModal } from "@/components/actions/TakeActionModal";
import { AllOutAttackOverlay } from "@/components/rewards/AllOutAttackOverlay";
import { LevelUpOverlay } from "@/components/rewards/LevelUpOverlay";
import { PersonaNavLink } from "@/components/ui/PersonaNavLink";
import { PersonaButton } from "@/components/ui/PersonaButton";
import { META_LOCATIONS, findMetaLocationById } from "@/data/locations";
import { playPhantomSfx } from "@/lib/sfx";

/** SVG path through pins in display order — “streets” between spots */
const MAP_PATH_D =
  "M 22 28 L 78 32 L 50 52 L 28 72 L 72 68";

export function MetaMapPage() {
  const reduceMotion = useReducedMotion();
  const [hereId, setHereId] = useState<string>(META_LOCATIONS[0]?.id ?? "study-nook");
  const [actionOpen, setActionOpen] = useState(false);
  const [actionCycle, setActionCycle] = useState(0);

  const here = useMemo(() => findMetaLocationById(hereId) ?? META_LOCATIONS[0], [hereId]);

  const travelTo = useCallback((id: string) => {
    if (id === hereId) return;
    playPhantomSfx("menuMove");
    setHereId(id);
  }, [hereId]);

  const openActionHere = useCallback(() => {
    setActionCycle((c) => c + 1);
    setActionOpen(true);
  }, []);

  return (
    <>
      <div className="relative z-10 flex min-h-full flex-1 flex-col overflow-hidden bg-transparent text-paper">
        <div className="pointer-events-none fixed inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={here.id}
              role="img"
              aria-label={`Scene: ${here.name}`}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.12 : 0.5, ease: [0.22, 1, 0.36, 1] }}
              className={`absolute inset-0 ${here.sceneClass}`}
            />
          </AnimatePresence>
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_70%,rgba(0,0,0,0.92)_100%)]"
            aria-hidden
          />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -18deg,
                transparent,
                transparent 12px,
                rgba(255,255,255,0.06) 12px,
                rgba(255,255,255,0.06) 13px
              )`,
            }}
            aria-hidden
          />
        </div>

        <header className="relative z-20 border-b-4 border-persona-red bg-black/85 px-5 py-6 backdrop-blur-sm sm:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-4">
                <PersonaNavLink
                  href="/"
                  className="font-p5-display text-xs tracking-[0.35em] text-persona-red hover:underline sm:text-sm"
                >
                  ← HOME
                </PersonaNavLink>
                <PersonaNavLink
                  href="/stats"
                  className="font-p5-display text-xs tracking-[0.35em] text-paper/80 hover:text-persona-red hover:underline sm:text-sm"
                >
                  STATS
                </PersonaNavLink>
                <PersonaNavLink
                  href="/missions"
                  className="font-p5-display text-xs tracking-[0.35em] text-paper/80 hover:text-persona-red hover:underline sm:text-sm"
                >
                  MISSIONS
                </PersonaNavLink>
              </div>
              <h1 className="font-p5-display text-4xl tracking-[0.2em] text-paper sm:text-5xl">
                CITY MAP
              </h1>
              <p className="font-marker max-w-xl text-sm text-paper/70 sm:text-base">
                Move between spots — the city shifts behind you. Start a focus session from wherever
                you’re standing.
              </p>
            </div>
          </div>
        </header>

        <div className="relative z-20 flex flex-1 flex-col items-center px-4 py-8 sm:px-8">
          <div className="mb-6 w-full max-w-2xl border-2 border-paper/20 bg-black/70 px-5 py-4 backdrop-blur-md">
            <p className="font-p5-display text-[10px] tracking-[0.35em] text-persona-red">YOU ARE HERE</p>
            <p className="font-p5-display mt-1 text-xl tracking-[0.15em] text-paper">{here.name}</p>
            <p className="font-marker mt-1 text-sm text-paper/60">{here.tagline}</p>
            <p className="font-bebas mt-2 text-xs tracking-[0.3em] text-paper/45">
              {here.stat.toUpperCase()}
            </p>
            <PersonaButton
              type="button"
              variant="primary"
              className="mt-5 font-p5-display tracking-[0.2em]"
              onClick={openActionHere}
            >
              TAKE ACTION HERE
            </PersonaButton>
          </div>

          <div className="w-full max-w-2xl border-4 border-paper/25 bg-black/80 p-4 shadow-[8px_8px_0_0_rgba(230,0,18,0.25)] backdrop-blur-sm sm:p-6">
            <p className="font-p5-display mb-4 text-center text-xs tracking-[0.3em] text-paper/50">
              TRAVEL
            </p>
            <div className="relative mx-auto aspect-[4/3] w-full max-w-lg">
              <svg
                viewBox="0 0 100 100"
                className="h-full w-full text-paper/25"
                aria-hidden
              >
                <path
                  d={MAP_PATH_D}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.6"
                  strokeDasharray="2 1.5"
                  vectorEffect="non-scaling-stroke"
                />
                {META_LOCATIONS.map((loc) => {
                  const active = loc.id === here.id;
                  return (
                    <g key={loc.id}>
                      <circle
                        cx={loc.mapX}
                        cy={loc.mapY}
                        r={active ? 4.2 : 3}
                        className={active ? "fill-persona-red" : "fill-paper/35"}
                      />
                      <circle
                        cx={loc.mapX}
                        cy={loc.mapY}
                        r={active ? 5.5 : 4.2}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.35"
                        className={active ? "text-persona-red" : "text-paper/40"}
                      />
                    </g>
                  );
                })}
              </svg>

            </div>
            <ul
              className="mt-5 flex flex-wrap justify-center gap-2"
              aria-label="Places you can travel to"
            >
              {META_LOCATIONS.map((loc) => {
                const active = loc.id === here.id;
                return (
                  <li key={loc.id}>
                    <button
                      type="button"
                      onClick={() => travelTo(loc.id)}
                      disabled={active}
                      className={`border-2 px-3 py-2 font-p5-display text-[10px] tracking-[0.12em] transition-colors sm:text-xs ${
                        active
                          ? "cursor-default border-persona-red bg-persona-red text-paper"
                          : "border-paper/35 bg-black/80 text-paper hover:border-persona-red hover:text-persona-red"
                      }`}
                    >
                      {loc.name}
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="font-marker mt-4 text-center text-xs text-paper/45">
              Choose a district to move — the background follows where you stand.
            </p>
          </div>
        </div>
      </div>

      <TakeActionModal
        key={actionCycle}
        open={actionOpen}
        onClose={() => setActionOpen(false)}
        statFilter={here.stat}
      />
      <LevelUpOverlay />
      <AllOutAttackOverlay />
    </>
  );
}
