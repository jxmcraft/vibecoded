"use client";

import { AllOutAttackOverlay } from "@/components/rewards/AllOutAttackOverlay";
import { LevelUpOverlay } from "@/components/rewards/LevelUpOverlay";
import { CallingCardPanel } from "@/components/missions/CallingCardPanel";
import { DailyMissionsPanel } from "@/components/dashboard/DailyMissionsPanel";
import { StatReadout } from "@/components/dashboard/StatReadout";
import { StreakCounter } from "@/components/dashboard/StreakCounter";

export function MissionsPage() {
  return (
    <>
      <div className="relative z-10 flex min-h-full flex-1 flex-col overflow-x-hidden bg-transparent text-paper">
        <header className="relative border-b-4 border-persona-red bg-black px-5 py-6 sm:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <h1 className="font-p5-display text-4xl tracking-[0.2em] text-paper sm:text-5xl">
                MISSIONS
              </h1>
              <p className="font-marker max-w-xl text-sm text-paper/60 sm:text-base">
                Streaks, dailies, and raw parameters — keep the thieves guild on schedule.
              </p>
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-4 py-10 sm:px-8">
          <StreakCounter />
          <CallingCardPanel />
          <DailyMissionsPanel />
          <div>
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
