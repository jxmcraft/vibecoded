"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type RouteWipePhase = "idle" | "covering" | "revealing" | "entryRevealing";

type RouteWipeContextValue = {
  navigateWithWipe: (href: string) => void;
  phase: RouteWipePhase;
  beginEntryReveal: () => void;
  /** Call before `router.push` when a custom transition (e.g. menu intro) replaces entry reveal. */
  skipNextEntryReveal: () => void;
  consumeSkipEntryReveal: () => boolean;
  onCoverComplete: () => void;
  onRevealComplete: () => void;
  onEntryRevealComplete: () => void;
};

const RouteWipeContext = createContext<RouteWipeContextValue | null>(null);

export function RouteWipeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [phase, setPhase] = useState<RouteWipePhase>("idle");
  const pendingHref = useRef<string | null>(null);
  const skipEntryRevealRef = useRef(false);

  const navigateWithWipe = useCallback((href: string) => {
    if (phase !== "idle") return;
    pendingHref.current = href;
    setPhase("covering");
  }, [phase]);

  const beginEntryReveal = useCallback(() => {
    setPhase((p) => (p === "idle" ? "entryRevealing" : p));
  }, []);

  const skipNextEntryReveal = useCallback(() => {
    skipEntryRevealRef.current = true;
  }, []);

  const consumeSkipEntryReveal = useCallback(() => {
    if (!skipEntryRevealRef.current) return false;
    skipEntryRevealRef.current = false;
    return true;
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
      skipNextEntryReveal,
      consumeSkipEntryReveal,
      onCoverComplete,
      onRevealComplete,
      onEntryRevealComplete,
    }),
    [
      navigateWithWipe,
      phase,
      beginEntryReveal,
      skipNextEntryReveal,
      consumeSkipEntryReveal,
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
