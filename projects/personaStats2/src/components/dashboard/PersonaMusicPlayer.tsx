"use client";

import { PersonaButton } from "@/components/ui/PersonaButton";
import { PersonaVolumeSlider } from "@/components/ui/PersonaVolumeSlider";
import {
  BGM_TRACKS,
  DEFAULT_BGM_TRACK_ID,
  bgmTrackById,
  nextBgmTrackId,
  prevBgmTrackId,
} from "@/data/audioTracks";
import { playPhantomSfx } from "@/lib/sfx";
import { useStore } from "@/store/useStore";

export function PersonaMusicPlayer() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);

  const resolvedTrackId = BGM_TRACKS.some((t) => t.id === settings.bgmTrackId)
    ? settings.bgmTrackId
    : DEFAULT_BGM_TRACK_ID;
  const track = bgmTrackById(resolvedTrackId);

  return (
    <section
      className="relative -rotate-1 border-y-4 border-persona-red bg-black px-4 py-4 shadow-[10px_10px_0_0_rgba(255,255,255,0.06)] sm:px-6"
      aria-label="Music and sound"
    >
      <div className="absolute -left-1 top-0 h-full w-3 bg-persona-red" aria-hidden />
      <div className="pl-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-p5-display text-[10px] tracking-[0.45em] text-persona-red">
              NOW SPINNING
            </p>
            <p className="font-p5-display mt-1 max-w-[min(100%,28rem)] text-lg leading-snug text-paper sm:text-xl">
              {track?.label ?? "—"}
            </p>
          </div>
          <p className="font-p5-display text-[10px] tracking-[0.35em] text-paper/40">
            HIDEOUT FEED
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-4 sm:gap-6">
          <PersonaVolumeSlider
            id="dash-bgm-level"
            label="BGM LEVEL"
            value01={settings.bgmVolume}
            onChange01={(v) => setSettings({ bgmVolume: v })}
          />
          <PersonaVolumeSlider
            id="dash-sfx-level"
            label="SFX LEVEL"
            value01={settings.sfxVolume}
            onChange01={(v) => setSettings({ sfxVolume: v })}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
          <PersonaButton
            type="button"
            variant="chip"
            aria-label="Previous track"
            onClick={() =>
              setSettings({ bgmTrackId: prevBgmTrackId(resolvedTrackId) })
            }
            className="font-p5-display !px-3"
          >
            ◀◀
          </PersonaButton>
          <PersonaButton
            type="button"
            variant="primary"
            onClick={() => setSettings({ bgmEnabled: !settings.bgmEnabled })}
            className="font-p5-display !px-5 !tracking-[0.2em]"
          >
            {settings.bgmEnabled ? "PAUSE BGM" : "PLAY BGM"}
          </PersonaButton>
          <PersonaButton
            type="button"
            variant="chip"
            aria-label="Next track"
            onClick={() =>
              setSettings({ bgmTrackId: nextBgmTrackId(resolvedTrackId) })
            }
            className="font-p5-display !px-3"
          >
            ▶▶
          </PersonaButton>
        </div>

        <div className="mt-5 border border-dashed border-paper/20 bg-paper/[0.03] px-3 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-p5-display text-xs tracking-[0.28em] text-paper/70">
              SFX
            </p>
            <PersonaButton
              type="button"
              variant={settings.sfxEnabled ? "primary" : "secondary"}
              onClick={() => setSettings({ sfxEnabled: !settings.sfxEnabled })}
              className="font-p5-display !px-4 !py-1.5 !text-xs"
            >
              {settings.sfxEnabled ? "ON" : "OFF"}
            </PersonaButton>
            <PersonaButton
              type="button"
              variant="ghost"
              disabled={!settings.sfxEnabled}
              title={
                settings.sfxEnabled
                  ? "Play a sample stinger"
                  : "Turn SFX on to preview"
              }
              onClick={() => playPhantomSfx("claim")}
              className="font-p5-display !border-dashed !px-3 !py-1.5 !text-xs"
            >
              TEST HIT
            </PersonaButton>
          </div>
          <p className="font-marker mt-2 text-[11px] leading-relaxed text-paper/45">
            Short bleeps (Web Audio) fire when you: start a focus timer, claim XP, level
            up, or clear daily missions (All-Out). Tap{" "}
            <span className="text-persona-red/90">TEST HIT</span> after any click so the
            browser unlocks audio.
          </p>
        </div>
      </div>
    </section>
  );
}
