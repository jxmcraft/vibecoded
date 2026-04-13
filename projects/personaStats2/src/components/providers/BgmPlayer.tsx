"use client";

import { useEffect, useRef } from "react";

import { bgmSrcForTrackId } from "@/data/audioTracks";
import { useStore } from "@/store/useStore";

export function BgmPlayer() {
  const bgmEnabled = useStore((s) => s.settings.bgmEnabled);
  const bgmTrackId = useStore((s) => s.settings.bgmTrackId);
  const bgmVolume = useStore((s) => s.settings.bgmVolume);
  const src = bgmSrcForTrackId(bgmTrackId);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.loop = true;
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = bgmVolume;
  }, [bgmVolume]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

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
  }, [bgmEnabled, src]);

  return (
    <audio
      key={src}
      ref={audioRef}
      src={src}
      loop
      preload="auto"
      className="hidden"
    />
  );
}
