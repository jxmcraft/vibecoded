"use client";

import { PersonaButton } from "@/components/ui/PersonaButton";
import { PersonaVolumeSlider } from "@/components/ui/PersonaVolumeSlider";
import { BGM_TRACKS, DEFAULT_BGM_TRACK_ID, nextBgmTrackId } from "@/data/audioTracks";
import { levelFromTotalXp } from "@/lib/leveling";
import { playPhantomSfx } from "@/lib/sfx";
import { STAT_TYPES, type StatType } from "@/lib/models";
import { useStore } from "@/store/useStore";

export function HideoutSettings() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const stats = useStore((s) => s.stats);
  const globalXpMultiplier = useStore((s) => s.globalXpMultiplier ?? 1);
  const executionFuse = useStore((s) => s.executionFuse);
  const resolvedBgmTrackId = BGM_TRACKS.some((t) => t.id === settings.bgmTrackId)
    ? settings.bgmTrackId
    : DEFAULT_BGM_TRACK_ID;

  return (
    <div className="relative z-10 flex min-h-full flex-1 flex-col overflow-x-hidden bg-transparent text-paper">
      <header className="relative border-b-4 border-persona-red bg-black px-5 py-6 sm:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <h1 className="font-p5-display text-4xl tracking-[0.2em] text-paper sm:text-5xl">SETTINGS</h1>
            <p className="font-marker max-w-xl text-sm text-paper/60 sm:text-base">
              Rain overlay, BGM, and UI hits. Register more tracks in{" "}
              <code className="text-persona-red/90">src/data/audioTracks.ts</code> after adding files to{" "}
              <code className="text-persona-red/90">public/audio/</code>.
            </p>
          </div>
        </div>
      </header>

      <ul className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-8">
        <li className="flex flex-col gap-4 border-2 border-paper/20 bg-black/40 px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-p5-display text-lg tracking-widest text-paper">SETTINGS BGM</p>
              <p className="font-marker mt-1 text-xs text-paper/50">
                Time-based shuffle picks from morning or night folders; pick a track manually to lock that song
                and turn shuffle off. First tap may be required for audio.
              </p>
            </div>
            <PersonaButton
              type="button"
              role="switch"
              aria-checked={settings.bgmEnabled}
              variant={settings.bgmEnabled ? "primary" : "secondary"}
              onClick={() => setSettings({ bgmEnabled: !settings.bgmEnabled })}
              className="font-p5-display !h-9 !w-16 shrink-0 !border-2 !px-0 !py-0 !text-[10px] !tracking-widest !shadow-none"
            >
              <span className="sr-only">Toggle background music</span>
              {settings.bgmEnabled ? "ON" : "OFF"}
            </PersonaButton>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border border-paper/15 bg-black/30 px-3 py-3">
            <div>
              <p className="font-p5-display text-[10px] tracking-widest text-paper/50">TIME SHUFFLE</p>
              <p className="font-marker mt-1 text-xs text-paper/45">
                Random track from morning (dawn–dusk) or night pools.
              </p>
            </div>
            <PersonaButton
              type="button"
              role="switch"
              aria-checked={settings.bgmShuffle}
              variant={settings.bgmShuffle ? "primary" : "secondary"}
              onClick={() => setSettings({ bgmShuffle: !settings.bgmShuffle })}
              className="font-p5-display !h-9 !w-16 shrink-0 !border-2 !px-0 !py-0 !text-[10px] !tracking-widest !shadow-none"
            >
              <span className="sr-only">Toggle time-based BGM shuffle</span>
              {settings.bgmShuffle ? "ON" : "OFF"}
            </PersonaButton>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <label className="font-p5-display text-[10px] tracking-widest text-paper/50">
              TRACK
            </label>
            <select
              value={resolvedBgmTrackId}
              onChange={(e) => setSettings({ bgmTrackId: e.target.value, bgmShuffle: false })}
              className="font-p5-display min-w-0 flex-1 border-2 border-paper/30 bg-black px-3 py-2 text-sm tracking-wide text-paper outline-none focus:border-persona-red"
            >
              {BGM_TRACKS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <PersonaButton
              type="button"
              variant="chip"
              onClick={() =>
                setSettings({
                  bgmTrackId: nextBgmTrackId(resolvedBgmTrackId),
                  bgmShuffle: false,
                })
              }
              className="font-p5-display shrink-0"
            >
              NEXT TRACK
            </PersonaButton>
          </div>
          <PersonaVolumeSlider
            id="hideout-bgm-level"
            label="BGM LEVEL"
            value01={settings.bgmVolume}
            onChange01={(v) => setSettings({ bgmVolume: v })}
          />
        </li>

        <li className="flex items-center justify-between gap-4 border-2 border-paper/20 bg-black/40 px-4 py-4">
          <div>
            <p className="font-p5-display text-lg tracking-widest text-paper">RAIN</p>
            <p className="font-marker mt-1 text-xs text-paper/50">
              Subtle diagonal drops behind the UI (pointer events pass through).
            </p>
          </div>
          <PersonaButton
            type="button"
            role="switch"
            aria-checked={settings.rainEnabled}
            variant={settings.rainEnabled ? "primary" : "secondary"}
            onClick={() => setSettings({ rainEnabled: !settings.rainEnabled })}
            className="font-p5-display !h-9 !w-16 shrink-0 !border-2 !px-0 !py-0 !text-[10px] !tracking-widest !shadow-none"
          >
            <span className="sr-only">Toggle rain overlay</span>
            {settings.rainEnabled ? "ON" : "OFF"}
          </PersonaButton>
        </li>

        <li className="flex flex-col gap-4 border-2 border-paper/20 bg-black/40 px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-p5-display text-lg tracking-widest text-paper">SOUND FX</p>
              <p className="font-marker mt-1 text-xs text-paper/50">
                Short synth hits: claim XP, level up, All-Out, start timer.
              </p>
            </div>
            <PersonaButton
              type="button"
              role="switch"
              aria-checked={settings.sfxEnabled}
              variant={settings.sfxEnabled ? "primary" : "secondary"}
              onClick={() => setSettings({ sfxEnabled: !settings.sfxEnabled })}
              className="font-p5-display !h-9 !w-16 shrink-0 !border-2 !px-0 !py-0 !text-[10px] !tracking-widest !shadow-none"
            >
              <span className="sr-only">Toggle sound effects</span>
              {settings.sfxEnabled ? "ON" : "OFF"}
            </PersonaButton>
          </div>
          <PersonaVolumeSlider
            id="hideout-sfx-level"
            label="SFX LEVEL"
            value01={settings.sfxVolume}
            onChange01={(v) => setSettings({ sfxVolume: v })}
          />
        </li>

        <li className="flex flex-col gap-4 border-2 border-paper/20 bg-black/40 px-4 py-4">
          <div>
            <p className="font-p5-display text-lg tracking-widest text-paper">VELVET ROOM</p>
            <p className="font-marker mt-1 text-xs text-paper/50">
              At rank 99, Execution Fuse resets that parameter to 0 and raises your global XP rate for
              all stats (caps at ×2.00). New Game Plus loop.
            </p>
          </div>
          <p className="font-bebas text-sm tracking-widest text-persona-red">
            GLOBAL XP ×{globalXpMultiplier.toFixed(2)}
          </p>
          <ul className="flex flex-col gap-2">
            {STAT_TYPES.map((st: StatType) => {
              const L = levelFromTotalXp(stats[st].totalXP);
              const canFuse = L >= 99;
              return (
                <li
                  key={st}
                  className="flex flex-wrap items-center justify-between gap-2 border border-paper/15 bg-black/30 px-3 py-2"
                >
                  <span className="font-bebas text-xs tracking-widest text-paper/80">
                    {st.toUpperCase()} — L{L}
                  </span>
                  <PersonaButton
                    type="button"
                    variant={canFuse ? "primary" : "secondary"}
                    disabled={!canFuse}
                    className="font-p5-display !text-[10px] !tracking-widest"
                    onClick={() => {
                      if (!canFuse) return;
                      const ok = window.confirm(
                        `Execution Fuse ${st}? That stat resets to L0. Global XP multiplier steps up (max ×2).`,
                      );
                      if (!ok) return;
                      if (executionFuse(st)) playPhantomSfx("executionFuse");
                    }}
                  >
                    EXECUTION FUSE
                  </PersonaButton>
                </li>
              );
            })}
          </ul>
        </li>
      </ul>
    </div>
  );
}
