import { DEFAULT_SFX_VOLUME, clampVolume01 } from "@/lib/audioLevels";
import { useStore } from "@/store/useStore";

/**
 * UI stingers (Web Audio). Triggered from:
 * - `TakeActionModal` — startSession, claim
 * - `LevelUpOverlay` — levelUp
 * - `AllOutAttackOverlay` — allOut
 * - `PersonaMusicPlayer` — test hit (claim sample)
 * - Fullscreen MENU — menuOpen / menuMove / menuConfirm / menuCancel
 * - `DateTransitionOverlay` — dateReveal (first log of local day)
 * - `ConfidantRankUpOverlay` — confidantRankUp
 * - `HideoutSettings` — executionFuse (Velvet Room)
 * - `CallingCardPanel` — callingCardSend
 * - `WeeklyCallingCardOverlay` — callingCardVictory
 */
export type PhantomSfxKind =
  | "claim"
  | "levelUp"
  | "allOut"
  | "startSession"
  | "menuOpen"
  | "menuMove"
  | "menuConfirm"
  | "menuCancel"
  | "dateReveal"
  | "confidantRankUp"
  | "executionFuse"
  | "callingCardSend"
  | "callingCardVictory";

/** ±5% frequency jitter for Web Audio beeps (good-to-have #3). */
export function jitterHz(hz: number): number {
  return hz * (1 + (Math.random() * 0.1 - 0.05));
}

let sharedCtx: AudioContext | null = null;
let gestureResumeInstalled = false;

function installGestureResumeForSfx() {
  if (gestureResumeInstalled || typeof window === "undefined") return;
  gestureResumeInstalled = true;
  const kick = () => {
    const c = sharedCtx;
    if (c && c.state === "suspended") void c.resume().catch(() => {});
  };
  document.addEventListener("pointerdown", kick, { capture: true, passive: true });
  document.addEventListener("keydown", kick, { capture: true, passive: true });
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedCtx) {
    sharedCtx = new Ctx();
    installGestureResumeForSfx();
  }
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
  const peak = Math.max(0.0001, Math.min(1, gain * master * 1.35));
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(jitterHz(frequency), start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.linearRampToValueAtTime(peak, start + 0.012);
  g.gain.linearRampToValueAtTime(0.0001, start + duration);
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
    case "menuOpen":
      beep(ctx, 380, t, 0.04, 0.055, master);
      beep(ctx, 520, t + 0.05, 0.05, 0.06, master);
      beep(ctx, 660, t + 0.11, 0.08, 0.065, master);
      break;
    case "menuMove":
      beep(ctx, 620, t, 0.028, 0.045, master);
      break;
    case "menuConfirm":
      beep(ctx, 480, t, 0.045, 0.06, master);
      beep(ctx, 720, t + 0.06, 0.07, 0.055, master);
      break;
    case "menuCancel":
      beep(ctx, 280, t, 0.06, 0.05, master);
      beep(ctx, 200, t + 0.07, 0.08, 0.04, master);
      break;
    case "dateReveal":
      beep(ctx, 392, t, 0.06, 0.055, master);
      beep(ctx, 523, t + 0.08, 0.08, 0.06, master);
      beep(ctx, 659, t + 0.17, 0.1, 0.05, master);
      break;
    case "confidantRankUp":
      beep(ctx, 415, t, 0.05, 0.05, master);
      beep(ctx, 523, t + 0.06, 0.06, 0.055, master);
      beep(ctx, 622, t + 0.14, 0.1, 0.06, master);
      break;
    case "executionFuse":
      beep(ctx, 180, t, 0.08, 0.07, master);
      beep(ctx, 880, t + 0.09, 0.1, 0.05, master);
      break;
    case "callingCardSend":
      beep(ctx, 350, t, 0.045, 0.055, master);
      beep(ctx, 698, t + 0.06, 0.07, 0.06, master);
      break;
    case "callingCardVictory":
      beep(ctx, 262, t, 0.07, 0.065, master);
      beep(ctx, 523, t + 0.08, 0.09, 0.07, master);
      beep(ctx, 784, t + 0.19, 0.14, 0.06, master);
      break;
  }
}
