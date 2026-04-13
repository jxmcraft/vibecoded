"use client";

import { AllOutAttackOverlay } from "@/components/rewards/AllOutAttackOverlay";
import { LevelUpOverlay } from "@/components/rewards/LevelUpOverlay";
import { PentagramRadar } from "@/components/dashboard/PentagramRadar";
import { StatReadout } from "@/components/dashboard/StatReadout";

export function StatsPage() {
  return (
    <>
      <div className="relative z-10 flex min-h-full flex-1 flex-col overflow-x-hidden bg-transparent text-paper">
        <header className="relative border-b-4 border-persona-red bg-black px-5 py-6 sm:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <h1 className="font-p5-display text-4xl tracking-[0.2em] text-paper sm:text-5xl">
                STATS
              </h1>
              <p className="font-marker max-w-xl text-sm text-paper/60 sm:text-base">
                Pentagon readout and raw parameters — the shape of your day.
              </p>
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-10 px-4 py-10 sm:px-8">
          <section
            className="flex w-full flex-col items-center justify-center lg:min-h-[420px]"
            aria-label="Radar"
          >
            <PentagramRadar />
          </section>
          <div className="w-full">
            <h2 className="font-p5-display -rotate-1 mb-4 text-2xl tracking-[0.28em] text-paper">
              PARAMETERS
            </h2>
            <StatReadout />
          </div>
        </div>
      </div>

      <LevelUpOverlay />
      <AllOutAttackOverlay />
    </>
  );
}
