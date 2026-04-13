"use client";

import { useId } from "react";

import { confidantsForStat, findConfidantById } from "@/data/confidants";
import { rankFromBondXp } from "@/lib/confidantBond";
import { STAT_TYPES, type StatType } from "@/lib/models";
import { useStore } from "@/store/useStore";

export function ConfidantGuildPanel() {
  const idPrefix = useId();
  const confidantByStat = useStore((s) => s.confidantByStat);
  const bondXpByStat = useStore((s) => s.bondXpByStat);
  const setConfidantForStat = useStore((s) => s.setConfidantForStat);

  return (
    <div className="w-full space-y-8">
      <p className="font-p5-display text-xs tracking-[0.3em] text-persona-red">THIEVES GUILD</p>
      <p className="font-marker text-sm leading-relaxed text-paper/75">
        Link a confidant to each parameter. When you log activities in that stat, bond XP rises — rank
        ups fire after enough sessions together.
      </p>
      <ul className="flex flex-col gap-6">
        {STAT_TYPES.map((stat: StatType) => {
          const options = confidantsForStat(stat);
          const pick = confidantByStat[stat];
          const pickedDef = pick ? findConfidantById(pick) : undefined;
          const bond = bondXpByStat[stat] ?? 0;
          const rank = rankFromBondXp(bond);
          const selectId = `${idPrefix}-${stat}`;
          return (
            <li
              key={stat}
              className="border-2 border-paper/20 bg-black/60 px-4 py-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-bebas text-lg tracking-wide text-paper">{stat}</span>
                <span className="font-bebas text-sm text-paper/50">
                  BOND RANK {rank}
                </span>
              </div>
              <label
                htmlFor={selectId}
                className="mt-3 block font-bebas text-[10px] tracking-widest text-paper/45"
              >
                CONFIDANT
              </label>
              <select
                id={selectId}
                value={pick ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setConfidantForStat(stat, v === "" ? null : v);
                }}
                aria-label={`Confidant for ${stat}`}
                className="mt-1 w-full border-2 border-paper/30 bg-black px-3 py-2 font-bebas text-base text-paper outline-none focus:border-persona-red focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <option value="">— None —</option>
                {options.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName}
                  </option>
                ))}
              </select>
              {pickedDef ? (
                <p className="font-marker mt-2 text-xs text-persona-red/90">
                  Linked: {pickedDef.displayName}
                </p>
              ) : null}
              <p className="font-marker mt-1 text-xs text-paper/40">
                Bond XP: {bond}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
