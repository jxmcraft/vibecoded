"use client";

import { useState } from "react";

import { FocusSessionHud } from "@/components/actions/FocusSessionHud";
import { TakeActionModal } from "@/components/actions/TakeActionModal";
import { AllOutAttackOverlay } from "@/components/rewards/AllOutAttackOverlay";
import { LevelUpOverlay } from "@/components/rewards/LevelUpOverlay";
import { PersonaButton } from "@/components/ui/PersonaButton";
import { PersonaNavLink } from "@/components/ui/PersonaNavLink";

import { DailyMissionsPanel } from "./DailyMissionsPanel";
import { DevXpControls } from "./DevXpControls";
import { PersonaMusicPlayer } from "./PersonaMusicPlayer";
import { PentagramRadar } from "./PentagramRadar";
import { StatReadout } from "./StatReadout";
import { StreakCounter } from "./StreakCounter";

type DashboardProps = {
  showDevControls: boolean;
};

export function Dashboard({ showDevControls }: DashboardProps) {
  const [actionOpen, setActionOpen] = useState(false);

  return (
    <>
      <div className="relative z-10 flex min-h-full flex-1 flex-col overflow-x-hidden bg-transparent text-paper">
        <header className="relative border-b-4 border-persona-red bg-black px-5 py-6 sm:px-10">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
            <div className="flex min-w-0 max-w-2xl flex-col gap-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h1 className="font-p5-display text-4xl leading-tight tracking-[0.14em] text-paper sm:text-5xl">
                  PHANTOM TRACKER
                </h1>
                <PersonaNavLink
                  href="/settings"
                  className="shrink-0 border-2 border-paper/35 bg-black px-3 py-1.5 font-p5-display text-xs tracking-[0.2em] text-paper hover:border-persona-red hover:text-persona-red"
                >
                  HIDEOUT
                </PersonaNavLink>
              </div>
              <p className="font-marker text-sm leading-relaxed text-persona-red sm:text-base">
                Menu of the self — rank up before the day steals you.
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:max-w-md sm:items-stretch">
              <FocusSessionHud onOpenModal={() => setActionOpen(true)} />
              <PersonaButton
                type="button"
                variant="primary"
                onClick={() => setActionOpen(true)}
                className="font-p5-display shrink-0 self-start !border-4 px-6 py-3 text-lg tracking-[0.25em] !shadow-[6px_6px_0_0_#fff] sm:self-auto"
              >
                TAKE ACTION
              </PersonaButton>
            </div>
          </div>
        </header>

        <div className="border-b border-paper/10 px-4 pt-6 sm:px-10">
          <PersonaMusicPlayer />
        </div>

        <div className="grid flex-1 gap-10 px-4 py-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start lg:gap-14 lg:px-10">
          <section
            className="flex flex-col items-center justify-center lg:min-h-[420px]"
            aria-label="Radar"
          >
            <PentagramRadar />
          </section>

          <aside className="flex flex-col gap-8 lg:pt-2">
            <StreakCounter />
            <DailyMissionsPanel />
            <div>
              <h2 className="font-p5-display -rotate-1 mb-4 text-2xl tracking-[0.28em] text-paper">
                PARAMETERS
              </h2>
              <StatReadout />
            </div>
            {showDevControls ? <DevXpControls /> : null}
          </aside>
        </div>
      </div>

      <TakeActionModal open={actionOpen} onClose={() => setActionOpen(false)} />
      <LevelUpOverlay />
      <AllOutAttackOverlay />
    </>
  );
}
