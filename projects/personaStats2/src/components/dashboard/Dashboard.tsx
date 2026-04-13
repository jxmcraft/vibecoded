"use client";

import { useCallback, useEffect, useState } from "react";

import { FocusSessionHud } from "@/components/actions/FocusSessionHud";
import { TakeActionModal } from "@/components/actions/TakeActionModal";
import { AllOutAttackOverlay } from "@/components/rewards/AllOutAttackOverlay";
import { LevelUpOverlay } from "@/components/rewards/LevelUpOverlay";
import { useMenuIntro } from "@/components/providers/menuIntroContext";
import { PersonaButton } from "@/components/ui/PersonaButton";
import { PersonaNavLink } from "@/components/ui/PersonaNavLink";

import { DevXpControls } from "./DevXpControls";
import { PersonaMusicPlayer } from "./PersonaMusicPlayer";
import { useStore } from "@/store/useStore";

type DashboardProps = {
  showDevControls: boolean;
};

export function Dashboard({ showDevControls }: DashboardProps) {
  const [actionOpen, setActionOpen] = useState(false);
  const [actionModalCycle, setActionModalCycle] = useState(0);
  const { startProfileMenuIntro } = useMenuIntro();
  const takeActionModalRequest = useStore((s) => s.takeActionModalRequest);
  const pendingSession = useStore((s) => s.pendingSession);

  const openActionModal = useCallback(() => {
    setActionModalCycle((c) => c + 1);
    setActionOpen(true);
  }, []);

  useEffect(() => {
    if (takeActionModalRequest > 0) {
      setActionModalCycle((c) => c + 1);
      setActionOpen(true);
    }
  }, [takeActionModalRequest]);

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
                <button
                  type="button"
                  onClick={() => startProfileMenuIntro()}
                  aria-label="Open fullscreen menu"
                  className="shrink-0 border-2 border-paper/35 bg-black px-3 py-1.5 font-p5-display text-xs tracking-[0.2em] text-paper outline-none hover:border-persona-red hover:text-persona-red focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  MENU
                </button>
              </div>
              <p className="font-marker text-sm leading-relaxed text-persona-red sm:text-base">
                Menu of the self — rank up before the day steals you.
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:max-w-md sm:items-stretch">
              <FocusSessionHud onOpenModal={openActionModal} />
              <PersonaButton
                type="button"
                variant="primary"
                onClick={openActionModal}
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

        <div className="flex flex-1 flex-col items-center gap-8 px-4 py-10 sm:px-10">
          <section
            className="flex w-full max-w-2xl flex-col items-center justify-center gap-6 border-2 border-paper/15 bg-black/50 px-8 py-12 text-center lg:min-h-[280px]"
            aria-label="Home hub"
          >
            <p className="font-p5-display text-lg tracking-[0.2em] text-paper sm:text-xl">
              THE CITY IS OPEN
            </p>
            <p className="font-marker max-w-md text-sm leading-relaxed text-paper/70 sm:text-base">
              Move between districts on the map — each stop paints a different sky behind you. Full pentagon
              readout on Stats; confidants live on Profile.
            </p>
            {pendingSession ? (
              <div className="w-full max-w-md border-2 border-cyan-500/40 bg-cyan-950/25 px-4 py-3 text-left">
                <p className="font-p5-display text-[10px] tracking-[0.3em] text-cyan-200/90">
                  SESSION IN PROGRESS
                </p>
                <p className="font-marker mt-1 text-sm text-paper/85">
                  Timer is running — use the bar at the bottom of the screen or{" "}
                  <button
                    type="button"
                    onClick={openActionModal}
                    className="text-persona-red underline decoration-persona-red/60 underline-offset-2 hover:text-paper"
                  >
                    open Take Action
                  </button>{" "}
                  to claim when it finishes.
                </p>
              </div>
            ) : null}
            <div className="flex w-full max-w-md flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
              <PersonaNavLink
                href="/map"
                className="font-p5-display inline-flex min-h-11 min-w-[200px] items-center justify-center border-2 border-persona-red bg-persona-red px-8 py-3 text-sm tracking-[0.25em] text-paper shadow-[6px_6px_0_0_rgba(255,255,255,0.2)] hover:bg-black hover:text-persona-red"
              >
                OPEN CITY MAP
              </PersonaNavLink>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-p5-display text-[10px] tracking-[0.28em] text-paper/55 sm:text-xs">
                <PersonaNavLink href="/stats" className="text-paper/80 hover:text-persona-red">
                  STATS
                </PersonaNavLink>
                <PersonaNavLink href="/missions" className="text-paper/80 hover:text-persona-red">
                  MISSIONS
                </PersonaNavLink>
                <PersonaNavLink href="/calendar" className="text-paper/80 hover:text-persona-red">
                  CALENDAR
                </PersonaNavLink>
                <PersonaNavLink href="/profile" className="text-paper/80 hover:text-persona-red">
                  PROFILE
                </PersonaNavLink>
              </div>
            </div>
          </section>
          {showDevControls ? (
            <div className="w-full max-w-3xl">
              <DevXpControls />
            </div>
          ) : null}
        </div>
      </div>

      <TakeActionModal
        key={actionModalCycle}
        open={actionOpen}
        onClose={() => setActionOpen(false)}
      />
      <LevelUpOverlay />
      <AllOutAttackOverlay />
    </>
  );
}
