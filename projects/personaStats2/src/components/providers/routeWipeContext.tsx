"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type RouteWipePhase = "idle" | "covering" | "revealing" | "entryRevealing";

type RouteWipeContextValue = {
  navigateWithWipe: (href: string) => void;
  phase: RouteWipePhase;
  beginEntryReveal: () => void;
  onCoverComplete: () => void;
  onRevealComplete: () => void;
  onEntryRevealComplete: () => void;
};

const RouteWipeContext = createContext<RouteWipeContextValue | null>(null);

export function RouteWipeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [phase, setPhase] = useState<RouteWipePhase>("idle");
  const pendingHref = useRef<string | null>(null);

  const navigateWithWipe = useCallback((href: string) => {
    if (phase !== "idle") return;
    pendingHref.current = href;
    setPhase("covering");
  }, [phase]);

  const beginEntryReveal = useCallback(() => {
    setPhase((p) => (p === "idle" ? "entryRevealing" : p));
  }, []);

  const onCoverComplete = useCallback(() => {
    const href = pendingHref.current;
    if (!href) return;
    router.push(href);
    requestAnimationFrame(() => {
      setPhase("revealing");
    });
  }, [router]);

  const onRevealComplete = useCallback(() => {
    pendingHref.current = null;
    setPhase("idle");
  }, []);

  const onEntryRevealComplete = useCallback(() => {
    setPhase("idle");
  }, []);

  const value = useMemo(
    () => ({
      navigateWithWipe,
      phase,
      beginEntryReveal,
      onCoverComplete,
      onRevealComplete,
      onEntryRevealComplete,
    }),
    [
      navigateWithWipe,
      phase,
      beginEntryReveal,
      onCoverComplete,
      onRevealComplete,
      onEntryRevealComplete,
    ],
  );

  return <RouteWipeContext.Provider value={value}>{children}</RouteWipeContext.Provider>;
}

export function useRouteWipe() {
  const ctx = useContext(RouteWipeContext);
  if (!ctx) {
    throw new Error("useRouteWipe must be used within RouteWipeProvider");
  }
  return ctx;
}
