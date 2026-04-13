"use client";

import { useEffect, useState } from "react";

import { findActivityById } from "@/data/activities";
import { formatCountdownMs, sessionRemainingMs } from "@/lib/sessionTimer";
import { PersonaButton } from "@/components/ui/PersonaButton";
import { useStore } from "@/store/useStore";

type FocusSessionHudProps = {
  onOpenModal: () => void;
};

export function FocusSessionHud({ onOpenModal }: FocusSessionHudProps) {
  const pendingSession = useStore((s) => s.pendingSession);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    if (!pendingSession) return;
    const id = window.setInterval(() => setNowTick(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [pendingSession]);

  if (!pendingSession) return null;

  const act = findActivityById(pendingSession.activityId);
  const rem = sessionRemainingMs(pendingSession.endsAtIso, nowTick);
  const ready = rem <= 0;

  return (
    <div className="flex w-full max-w-md flex-col gap-2 border-2 border-persona-red/80 bg-black/80 px-4 py-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-bebas text-[10px] tracking-[0.35em] text-paper/50">FOCUS SESSION</p>
        <p className="font-bebas text-lg text-paper">{act?.name ?? pendingSession.activityId}</p>
      </div>
      <div className="flex items-center gap-3">
        <p
          className={`font-bebas text-2xl tabular-nums ${ready ? "text-persona-red" : "text-paper"}`}
          aria-live="polite"
          aria-label={
            ready
              ? "Focus timer finished — open session to claim XP"
              : `Focus time remaining ${formatCountdownMs(rem)}`
          }
        >
          {ready ? "READY" : formatCountdownMs(rem)}
        </p>
        <PersonaButton
          type="button"
          variant="secondary"
          onClick={onOpenModal}
          className="border-paper px-3 py-1.5 text-xs"
          aria-label={ready ? "Open modal to claim experience" : "Open focus session modal"}
        >
          OPEN
        </PersonaButton>
      </div>
    </div>
  );
}
