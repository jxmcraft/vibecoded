"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  bgmSrcForTrackId,
  bgmTrackById,
  pickRandomShuffleTrack,
  shufflePoolFromDayNightPeriod,
} from "@/data/audioTracks";
import { clampVolume01, DEFAULT_BGM_VOLUME } from "@/lib/audioLevels";
import { dayNightPeriodAt } from "@/lib/dayNightPeriod";
import { useStore } from "@/store/useStore";

type ShufflePlayback = {
  src: string;
  label: string;
  trackId: string;
  key: number;
};

export function BgmPlayer() {
  const bgmEnabled = useStore((s) => s.settings.bgmEnabled);
  const bgmShuffle = useStore((s) => s.settings.bgmShuffle);
  const bgmTrackId = useStore((s) => s.settings.bgmTrackId);
  const bgmVolume = useStore((s) => s.settings.bgmVolume);
  const setBgmNowPlayingLabel = useStore((s) => s.setBgmNowPlayingLabel);

  const [shufflePlayback, setShufflePlayback] = useState<ShufflePlayback | null>(null);
  const shufflePoolRef = useRef<"morning" | "night">("morning");
  const shuffleTrackIdRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const manualSrc = bgmSrcForTrackId(bgmTrackId);
  const audioKey = bgmShuffle
    ? shufflePlayback != null
      ? `shuffle-${shufflePlayback.key}`
      : "shuffle-pending"
    : `manual-${bgmTrackId}`;
  const activeSrc = bgmShuffle ? (shufflePlayback?.src ?? "") : manualSrc;

  const pickAndSetShuffle = useCallback(
    (excludeId?: string | null) => {
      const period = dayNightPeriodAt();
      const pool = shufflePoolFromDayNightPeriod(period);
      shufflePoolRef.current = pool;
      const track = pickRandomShuffleTrack(pool, excludeId);
      setShufflePlayback((prev) => {
        const next = {
          src: track.src,
          label: track.label,
          trackId: track.id,
          key: (prev?.key ?? 0) + 1,
        };
        shuffleTrackIdRef.current = track.id;
        return next;
      });
      setBgmNowPlayingLabel(track.label);
    },
    [setBgmNowPlayingLabel],
  );

  useEffect(() => {
    if (bgmShuffle) return;
    setShufflePlayback(null);
    shuffleTrackIdRef.current = null;
    setBgmNowPlayingLabel(bgmTrackById(bgmTrackId)?.label ?? "");
  }, [bgmShuffle, bgmTrackId, setBgmNowPlayingLabel]);

  useEffect(() => {
    if (!bgmShuffle) return;
    pickAndSetShuffle(null);
  }, [bgmShuffle, pickAndSetShuffle]);

  useEffect(() => {
    if (!bgmShuffle) return;
    const id = window.setInterval(() => {
      const pool = shufflePoolFromDayNightPeriod(dayNightPeriodAt());
      if (pool !== shufflePoolRef.current) {
        pickAndSetShuffle(null);
      }
    }, 45_000);
    return () => window.clearInterval(id);
  }, [bgmShuffle, pickAndSetShuffle]);

  const onShuffleEnded = useCallback(() => {
    pickAndSetShuffle(shuffleTrackIdRef.current);
  }, [pickAndSetShuffle]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.loop = true;
  }, []);

  /** Remounting `<audio key=…>` resets `volume` to 1 — re-apply whenever the element or setting changes. */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = clampVolume01(bgmVolume, DEFAULT_BGM_VOLUME);
  }, [bgmVolume, audioKey]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.loop = !bgmShuffle;

    if (!bgmEnabled) {
      el.pause();
      return;
    }

    const tryPlay = () => {
      void el.play().catch(() => {});
    };

    tryPlay();

    const onPointer = () => {
      tryPlay();
    };
    document.addEventListener("pointerdown", onPointer, { passive: true });

    return () => {
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [bgmEnabled, bgmShuffle, activeSrc, audioKey]);

  if (bgmShuffle && shufflePlayback == null) {
    return <audio key={audioKey} ref={audioRef} className="hidden" preload="auto" />;
  }

  return (
    <audio
      key={audioKey}
      ref={audioRef}
      src={bgmShuffle ? shufflePlayback!.src : manualSrc}
      loop={!bgmShuffle}
      preload="auto"
      onEnded={bgmShuffle ? onShuffleEnded : undefined}
      className="hidden"
    />
  );
}
