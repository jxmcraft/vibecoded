"use client";

import { useEffect, useState, type ReactNode } from "react";

import { useStore } from "@/store/useStore";

type StoreGateProps = {
  children: ReactNode;
};

/**
 * Runs Zustand persist rehydration once before showing dashboard UI.
 */
export function StoreGate({ children }: StoreGateProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void Promise.resolve(useStore.persist.rehydrate()).finally(() => {
      useStore.getState().syncCallingCard();
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-ink text-paper">
        <p className="font-bebas text-xl tracking-widest text-persona-red">LOADING…</p>
      </div>
    );
  }

  return <>{children}</>;
}
