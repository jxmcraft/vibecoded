"use client";

import { PersonaButton } from "@/components/ui/PersonaButton";
import { STAT_TYPES, type StatType } from "@/lib/models";
import { useStore } from "@/store/useStore";

function shortLabel(t: StatType) {
  return t.length <= 6 ? t : `${t.slice(0, 4)}.`;
}

export function DevXpControls() {
  const addStatXp = useStore((s) => s.addStatXp);

  return (
    <div className="rounded border border-dashed border-paper/30 bg-black/60 p-4 text-paper/80">
      <p className="font-marker text-center text-sm text-persona-red">DEV — ?dev=1</p>
      <p className="mt-1 text-center text-[10px] uppercase tracking-wider text-paper/50">
        Add XP until activity logging ships
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {STAT_TYPES.map((t) => (
          <PersonaButton
            key={t}
            type="button"
            variant="chip"
            onClick={() => addStatXp(t, 1)}
            className="bg-paper/5 uppercase tracking-wide"
          >
            +1 {shortLabel(t)}
          </PersonaButton>
        ))}
      </div>
    </div>
  );
}
