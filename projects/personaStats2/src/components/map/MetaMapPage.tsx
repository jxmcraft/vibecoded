"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FocusSessionHud } from "@/components/actions/FocusSessionHud";
import { TakeActionModal } from "@/components/actions/TakeActionModal";
import { AllOutAttackOverlay } from "@/components/rewards/AllOutAttackOverlay";
import { LevelUpOverlay } from "@/components/rewards/LevelUpOverlay";
import { PersonaButton } from "@/components/ui/PersonaButton";
import {
  META_LOCATIONS,
  TOKYO_MAP_HEIGHT,
  TOKYO_MAP_SRC,
  TOKYO_MAP_WIDTH,
  findMetaLocationById,
  mapRoutePathD,
} from "@/data/locations";
import { dayNightPeriodAt, type DayNightPeriod } from "@/lib/dayNightPeriod";
import { playPhantomSfx } from "@/lib/sfx";
import { useStore } from "@/store/useStore";

/** Matches `tokyo-map.png` (1500×982). */
const MAP_ASPECT_CLASS = "aspect-[1500/982]";

const MAP_PATH_D = mapRoutePathD(META_LOCATIONS);

function syncMapPageBgm(period: DayNightPeriod, mapAutoBgmSwitchRef: { current: boolean }): void {
  const s = useStore.getState();
  if (!s.settings.bgmEnabled) return;
  if (s.settings.bgmShuffle) return;
  const night = period === "night";
  const cur = s.settings.bgmTrackId;
  if (night) {
    if (cur === "beneath_the_mask") {
      mapAutoBgmSwitchRef.current = true;
      s.setSettings({ bgmTrackId: "beneath_the_mask_night" });
    }
  } else if (cur === "beneath_the_mask_night") {
    mapAutoBgmSwitchRef.current = true;
    s.setSettings({ bgmTrackId: "beneath_the_mask" });
  }
}

export function MetaMapPage() {
  const reduceMotion = useReducedMotion();
  const setSettings = useStore((st) => st.setSettings);
  const takeActionModalRequest = useStore((st) => st.takeActionModalRequest);
  const [hereId, setHereId] = useState<string>(META_LOCATIONS[0]?.id ?? "shinjuku-crossroads");
  const [actionOpen, setActionOpen] = useState(false);
  const [actionCycle, setActionCycle] = useState(0);
  const [mapPeriod, setMapPeriod] = useState<DayNightPeriod>(() => dayNightPeriodAt());
  const initialBgmTrackIdRef = useRef<string | null>(null);
  const mapAutoBgmSwitchRef = useRef(false);

  const here = useMemo(() => findMetaLocationById(hereId) ?? META_LOCATIONS[0], [hereId]);
  const isNight = mapPeriod === "night";

  const travelTo = useCallback((id: string) => {
    if (id === hereId) return;
    playPhantomSfx("menuMove");
    setHereId(id);
  }, [hereId]);

  const openActionModal = useCallback(() => {
    setActionCycle((c) => c + 1);
    setActionOpen(true);
  }, []);

  useEffect(() => {
    if (takeActionModalRequest > 0) {
      setActionCycle((c) => c + 1);
      setActionOpen(true);
    }
  }, [takeActionModalRequest]);

  useEffect(() => {
    mapAutoBgmSwitchRef.current = false;
    initialBgmTrackIdRef.current = useStore.getState().settings.bgmTrackId;
    syncMapPageBgm(dayNightPeriodAt(), mapAutoBgmSwitchRef);

    const interval = window.setInterval(() => {
      const p = dayNightPeriodAt();
      setMapPeriod(p);
      syncMapPageBgm(p, mapAutoBgmSwitchRef);
    }, 60_000);

    return () => {
      window.clearInterval(interval);
      const cur = useStore.getState().settings.bgmTrackId;
      const initial = initialBgmTrackIdRef.current;
      if (
        mapAutoBgmSwitchRef.current &&
        initial != null &&
        (cur === "beneath_the_mask" || cur === "beneath_the_mask_night")
      ) {
        setSettings({ bgmTrackId: initial });
      }
    };
  }, [setSettings]);

  return (
    <>
      <div className="relative z-10 flex min-h-full flex-1 flex-col overflow-hidden bg-transparent text-paper">
        <div className="pointer-events-none fixed inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={here.id}
              role="img"
              aria-label={`Scene: ${here.districtName}`}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.12 : 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                fill
                src={here.sceneImageSrc}
                alt=""
                className="object-cover"
                sizes="100vw"
                priority={false}
              />
              <div className={`absolute inset-0 ${here.sceneClass}`} />
            </motion.div>
          </AnimatePresence>
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.35)_72%,rgba(0,0,0,0.78)_100%)]"
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
              <h1 className="font-p5-display text-4xl tracking-[0.2em] text-paper sm:text-5xl">
                CITY MAP
              </h1>
              <p className="font-marker max-w-xl text-sm text-paper/70 sm:text-base">
                Tokyo subway map — tap a station or use travel chips. Local time drives day and night on the map
                and BGM (shuffle or Beneath the Mask variants when shuffle is off).
              </p>
              <p className="font-bebas text-xs tracking-[0.3em] text-paper/50">
                {isNight ? "LOCAL — NIGHT (NEON MAP)" : "LOCAL — DAY (URBAN MAP)"}
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:max-w-md sm:items-stretch">
              <FocusSessionHud onOpenModal={openActionModal} />
            </div>
          </div>
        </header>

        <div className="relative z-20 flex flex-1 flex-col items-center px-4 py-8 sm:px-8">
          <div className="mb-6 w-full max-w-2xl border-2 border-paper/20 bg-black/70 px-5 py-4 backdrop-blur-md">
            <p className="font-p5-display text-[10px] tracking-[0.35em] text-persona-red">YOU ARE HERE</p>
            <p className="font-p5-display mt-1 text-xl tracking-[0.15em] text-paper">{here.districtName}</p>
            <p className="font-bebas mt-1 text-sm tracking-widest text-paper/70">{here.venueName}</p>
            <p className="font-bebas mt-2 text-xs tracking-[0.3em] text-persona-red">{here.stat.toUpperCase()}</p>
            <div className="mt-4 space-y-2 border-t border-paper/15 pt-4">
              <p className="font-p5-display text-[10px] tracking-[0.28em] text-paper/45">WHY (IN-GAME)</p>
              <p className="font-marker text-sm text-paper/75">{here.whyText}</p>
            </div>
            <div className="mt-4 space-y-2">
              <p className="font-p5-display text-[10px] tracking-[0.28em] text-paper/45">APP USAGE</p>
              <p className="font-marker text-sm text-paper/75">{here.appUsageText}</p>
            </div>
            <PersonaButton
              type="button"
              variant="primary"
              className="mt-5 font-p5-display tracking-[0.2em]"
              onClick={openActionModal}
            >
              TAKE ACTION HERE
            </PersonaButton>
          </div>

          <div className="w-full max-w-2xl border-4 border-paper/25 bg-black/80 p-4 shadow-[8px_8px_0_0_rgba(230,0,18,0.25)] backdrop-blur-sm sm:p-6">
            <p className="font-p5-display mb-4 text-center text-xs tracking-[0.3em] text-paper/50">
              TRAVEL
            </p>
            <div
              className={`relative mx-auto w-full max-w-lg overflow-hidden rounded-sm border border-paper/20 ${MAP_ASPECT_CLASS}`}
            >
              <Image
                fill
                src={TOKYO_MAP_SRC}
                alt="Tokyo rail map with metro lines"
                className={`object-cover transition-[filter] duration-700 ${
                  isNight
                    ? "brightness-[0.88] contrast-125 saturate-[1.35]"
                    : "brightness-105 saturate-[1.08]"
                }`}
                sizes="(max-width: 768px) 100vw, 32rem"
                draggable={false}
                priority={false}
              />

              {isNight ? (
                <>
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-400/15 via-persona-red/25 to-black/80 mix-blend-overlay"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(230,0,18,0.22),transparent_55%)]"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.65),inset_0_0_24px_rgba(230,0,18,0.2)]"
                    aria-hidden
                  />
                  {!reduceMotion ? (
                    <motion.div
                      className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen"
                      aria-hidden
                      animate={{ opacity: [0.25, 0.45, 0.3] }}
                      transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                      style={{
                        background:
                          "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(250,204,21,0.04) 2px, rgba(250,204,21,0.04) 3px)",
                      }}
                    />
                  ) : null}
                </>
              ) : (
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/5"
                  aria-hidden
                />
              )}

              <svg
                viewBox={`0 0 ${TOKYO_MAP_WIDTH} ${TOKYO_MAP_HEIGHT}`}
                className="pointer-events-none absolute inset-0 h-full w-full text-paper/30"
                preserveAspectRatio="xMidYMid meet"
                aria-hidden
              >
                <path
                  d={MAP_PATH_D}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={isNight ? 11 : 8}
                  strokeDasharray="18 14"
                  className={isNight ? "text-cyan-300/45" : undefined}
                />
              </svg>

              <div className="pointer-events-none absolute inset-0 z-[8]" aria-hidden>
                {META_LOCATIONS.map((loc) => {
                  const active = loc.id === here.id;
                  return (
                    <div
                      key={`pin-${loc.id}`}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${
                        active
                          ? isNight
                            ? "h-4 w-4 bg-cyan-200/25 shadow-[0_0_22px_rgba(34,211,238,0.35)] ring-2 ring-cyan-300/50"
                            : "h-4 w-4 bg-cyan-300/22 shadow-[0_0_20px_rgba(34,211,238,0.28)] ring-2 ring-cyan-400/40"
                          : isNight
                            ? "h-2.5 w-2.5 bg-cyan-200/20 ring-1 ring-cyan-100/25"
                            : "h-2.5 w-2.5 bg-cyan-400/28 ring-1 ring-cyan-200/22"
                      }`}
                      style={{ left: `${loc.mapX}%`, top: `${loc.mapY}%` }}
                    />
                  );
                })}
              </div>

              {META_LOCATIONS.map((loc) => {
                const active = loc.id === here.id;
                const label = `Travel to ${loc.districtName}, ${loc.venueName} (${loc.stat})`;
                return (
                  <button
                    key={`hit-${loc.id}`}
                    type="button"
                    onClick={() => travelTo(loc.id)}
                    aria-label={active ? `${label}, current` : label}
                    aria-current={active ? "true" : undefined}
                    className={`absolute z-10 min-h-14 min-w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-transparent bg-transparent outline-none transition-colors hover:bg-white/10 focus-visible:bg-white/15 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black/80 ${
                      active ? "ring-2 ring-cyan-400/35 ring-offset-2 ring-offset-black/55" : ""
                    }`}
                    style={{ left: `${loc.mapX}%`, top: `${loc.mapY}%` }}
                  />
                );
              })}
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
                      aria-current={active ? "true" : undefined}
                      aria-label={
                        active
                          ? `${loc.name}, ${loc.venueName}, current location`
                          : `Travel to ${loc.name}, ${loc.venueName}`
                      }
                      className={`max-w-[11rem] min-h-10 border-2 px-3 py-2 text-left font-p5-display text-[10px] tracking-[0.12em] outline-none transition-colors sm:max-w-none sm:text-xs ${
                        active
                          ? "cursor-default border-cyan-400/45 bg-cyan-950/35 text-cyan-50"
                          : "border-paper/35 bg-black/80 text-paper hover:border-persona-red hover:text-persona-red focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                      }`}
                    >
                      {loc.name}
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="font-marker mt-4 text-center text-xs text-paper/45">
              Tap the map or a chip — the city backdrop matches your station.
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
