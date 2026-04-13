"use client";

import { PersonaButton } from "@/components/ui/PersonaButton";
import { PersonaNavLink } from "@/components/ui/PersonaNavLink";
import { PersonaVolumeSlider } from "@/components/ui/PersonaVolumeSlider";
import { BGM_TRACKS, DEFAULT_BGM_TRACK_ID, nextBgmTrackId } from "@/data/audioTracks";
import { useStore } from "@/store/useStore";

export function HideoutSettings() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const resolvedBgmTrackId = BGM_TRACKS.some((t) => t.id === settings.bgmTrackId)
    ? settings.bgmTrackId
    : DEFAULT_BGM_TRACK_ID;

  return (
    <div className="relative z-10 mx-auto flex min-h-full max-w-lg flex-col gap-8 bg-transparent px-5 py-10 sm:px-8">
      <header className="space-y-4 border-b border-paper/15 pb-6">
        <div className="flex flex-wrap gap-4">
          <PersonaNavLink
            href="/"
            className="inline-block font-p5-display text-xs tracking-[0.35em] text-persona-red hover:underline"
          >
            ← BACK
          </PersonaNavLink>
          <PersonaNavLink
            href="/profile"
            className="inline-block font-p5-display text-xs tracking-[0.35em] text-paper/80 hover:text-persona-red hover:underline"
          >
            PROFILE
          </PersonaNavLink>
        </div>
        <h1 className="font-p5-display text-4xl tracking-[0.2em] text-paper">SETTINGS</h1>
        <p className="font-marker text-sm text-paper/60">
          Rain overlay, BGM, and UI hits. Register more tracks in{" "}
          <code className="text-persona-red/90">src/data/audioTracks.ts</code> after adding files to{" "}
          <code className="text-persona-red/90">public/audio/</code>.
        </p>
      </header>

      <ul className="flex flex-col gap-6">
        <li className="flex flex-col gap-4 border-2 border-paper/20 bg-black/40 px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-p5-display text-lg tracking-widest text-paper">SETTINGS BGM</p>
              <p className="font-marker mt-1 text-xs text-paper/50">
                Loops; use the track list or NEXT to alternate. First tap may be required for audio.
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <label className="font-p5-display text-[10px] tracking-widest text-paper/50">
              TRACK
            </label>
            <select
              value={resolvedBgmTrackId}
              onChange={(e) => setSettings({ bgmTrackId: e.target.value })}
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
                setSettings({ bgmTrackId: nextBgmTrackId(resolvedBgmTrackId) })
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
      </ul>
    </div>
  );
}
