"use client";

type PersonaVolumeSliderProps = {
  id: string;
  label: string;
  value01: number;
  onChange01: (value: number) => void;
};

export function PersonaVolumeSlider({
  id,
  label,
  value01,
  onChange01,
}: PersonaVolumeSliderProps) {
  const pct = Math.round(value01 * 100);

  return (
    <div className="flex min-w-[8rem] flex-1 flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={id}
          className="font-p5-display text-[10px] tracking-[0.28em] text-paper/55"
        >
          {label}
        </label>
        <span className="font-bebas tabular-nums text-[10px] text-persona-red">
          {pct}%
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={pct}
        onChange={(e) => onChange01(Number(e.target.value) / 100)}
        className="h-2 w-full cursor-pointer accent-persona-red"
      />
    </div>
  );
}
