"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useRouteWipe } from "@/components/providers/routeWipeContext";
import { PersonaButton } from "@/components/ui/PersonaButton";
import { findActivityById } from "@/data/activities";
import {
  BGM_TRACKS,
  DEFAULT_BGM_TRACK_ID,
  nextBgmTrackId,
  prevBgmTrackId,
} from "@/data/audioTracks";
import { clampVolume01, DEFAULT_BGM_VOLUME } from "@/lib/audioLevels";
import { formatCountdownMs, sessionRemainingMs } from "@/lib/sessionTimer";
import { useStore } from "@/store/useStore";

/**
 * Fixed bottom chrome: optional focus session row + always-visible mini BGM controls.
 */
export function PhantomBottomDock() {
  const pathname = usePathname();
  const pendingSession = useStore((s) => s.pendingSession);
  const bumpTakeActionModalRequest = useStore((s) => s.bumpTakeActionModalRequest);
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const bgmNowPlayingLabel = useStore((s) => s.bgmNowPlayingLabel);
  const { navigateWithWipe } = useRouteWipe();
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    if (!pendingSession) return;
    const id = window.setInterval(() => setNowTick(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [pendingSession]);

  const resolvedTrackId = BGM_TRACKS.some((t) => t.id === settings.bgmTrackId)
    ? settings.bgmTrackId
    : DEFAULT_BGM_TRACK_ID;
  const spinningLabel = settings.bgmShuffle
    ? bgmNowPlayingLabel || "TIME SHUFFLE…"
    : (BGM_TRACKS.find((t) => t.id === resolvedTrackId)?.label ?? "—");

  const volPct = Math.round(clampVolume01(settings.bgmVolume, DEFAULT_BGM_VOLUME) * 100);

  const onManage = () => {
    if (pathname !== "/" && pathname !== "/map") {
      navigateWithWipe("/");
    }
    queueMicrotask(() => {
      bumpTakeActionModalRequest();
    });
  };

  return (
    <div
      className="pointer-events-auto fixed bottom-0 left-0 right-0 z-[9998] flex flex-col border-t-2 border-persona-red/80 bg-black/94 shadow-[0_-8px_24px_rgba(0,0,0,0.55)] backdrop-blur-sm"
      aria-label="Bottom status and music"
    >
      {pendingSession ? (
        <div
          className="border-b border-paper/15 px-3 py-2 sm:px-6"
          role="status"
          aria-live="polite"
        >
          <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-2 sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-bebas text-[9px] tracking-[0.35em] text-paper/50">FOCUS SESSION</p>
              <p className="truncate font-bebas text-sm text-paper sm:text-base">
                {findActivityById(pendingSession.activityId)?.name ?? pendingSession.activityId}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <p
                className={`font-bebas text-xl tabular-nums sm:text-2xl ${
                  sessionRemainingMs(pendingSession.endsAtIso, nowTick) <= 0
                    ? "text-persona-red"
                    : "text-paper"
                }`}
              >
                {sessionRemainingMs(pendingSession.endsAtIso, nowTick) <= 0
                  ? "READY"
                  : formatCountdownMs(sessionRemainingMs(pendingSession.endsAtIso, nowTick))}
              </p>
              <PersonaButton
                type="button"
                variant="secondary"
                onClick={onManage}
                className="shrink-0 border-paper px-3 py-1.5 text-xs"
              >
                MANAGE
              </PersonaButton>
            </div>
          </div>
        </div>
      ) : null}

      <div className="px-3 py-2 sm:px-6">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-bebas text-[8px] tracking-[0.3em] text-paper/45">BGM</p>
            <p className="truncate font-bebas text-xs text-paper sm:text-sm" title={spinningLabel}>
              {spinningLabel}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <PersonaButton
              type="button"
              variant="chip"
              aria-label="Previous track"
              onClick={() =>
                setSettings({
                  bgmTrackId: prevBgmTrackId(resolvedTrackId),
                  bgmShuffle: false,
                })
              }
              className="font-p5-display !px-2 !py-1 !text-[10px]"
            >
              ◀
            </PersonaButton>
            <PersonaButton
              type="button"
              variant="primary"
              aria-label={settings.bgmEnabled ? "Pause background music" : "Play background music"}
              onClick={() => setSettings({ bgmEnabled: !settings.bgmEnabled })}
              className="font-p5-display !px-3 !py-1 !text-[10px] !tracking-widest"
            >
              {settings.bgmEnabled ? "PAUSE" : "PLAY"}
            </PersonaButton>
            <PersonaButton
              type="button"
              variant="chip"
              aria-label="Next track"
              onClick={() =>
                setSettings({
                  bgmTrackId: nextBgmTrackId(resolvedTrackId),
                  bgmShuffle: false,
                })
              }
              className="font-p5-display !px-2 !py-1 !text-[10px]"
            >
              ▶
            </PersonaButton>
            <label className="flex items-center gap-1.5 font-bebas text-[10px] text-paper/55">
              <span className="sr-only">Music volume</span>
              <input
                type="range"
                min={0}
                max={100}
                value={volPct}
                onChange={(e) => setSettings({ bgmVolume: Number(e.target.value) / 100 })}
                className="h-1.5 w-20 cursor-pointer accent-persona-red sm:w-28"
              />
              <span className="w-8 tabular-nums text-persona-red">{volPct}%</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
