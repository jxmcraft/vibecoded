import { DEFAULT_SFX_VOLUME, clampVolume01 } from "@/lib/audioLevels";
import { useStore } from "@/store/useStore";

/**
 * UI stingers (Web Audio). Triggered from:
 * - `TakeActionModal` — startSession, claim
 * - `LevelUpOverlay` — levelUp
 * - `AllOutAttackOverlay` — allOut
 * - `PersonaMusicPlayer` — test hit (claim sample)
 */
export type PhantomSfxKind = "claim" | "levelUp" | "allOut" | "startSession";

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedCtx) sharedCtx = new Ctx();
  void sharedCtx.resume().catch(() => {});
  return sharedCtx;
}

function beep(
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  gain: number,
  master: number,
) {
  const peak = Math.max(0.0001, gain * master);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(frequency, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/**
 * Short UI hits (Web Audio). Respects `settings.sfxEnabled`. Safe to call from event handlers.
 */
export function playPhantomSfx(kind: PhantomSfxKind) {
  if (!useStore.getState().settings.sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const master = clampVolume01(
    useStore.getState().settings.sfxVolume,
    DEFAULT_SFX_VOLUME,
  );
  const t = ctx.currentTime;
  switch (kind) {
    case "claim":
      beep(ctx, 520, t, 0.06, 0.07, master);
      beep(ctx, 780, t + 0.07, 0.08, 0.06, master);
      break;
    case "levelUp":
      beep(ctx, 440, t, 0.07, 0.07, master);
      beep(ctx, 554, t + 0.08, 0.07, 0.07, master);
      beep(ctx, 659, t + 0.16, 0.12, 0.08, master);
      break;
    case "allOut":
      beep(ctx, 220, t, 0.12, 0.1, master);
      beep(ctx, 880, t + 0.1, 0.15, 0.06, master);
      break;
    case "startSession":
      beep(ctx, 330, t, 0.05, 0.05, master);
      break;
  }
}
