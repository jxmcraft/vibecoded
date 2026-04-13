"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { useRouteWipe } from "@/components/providers/routeWipeContext";

/**
 * When the URL changes outside the PersonaNavLink flow (e.g. browser back/forward),
 * plays the same diagonal reveal wipe so the new route doesn’t pop in without motion.
 */
export function RoutePathnameSync() {
  const pathname = usePathname();
  const prevPathname = useRef<string | null>(null);
  const { phase, beginEntryReveal, consumeSkipEntryReveal } = useRouteWipe();

  useEffect(() => {
    if (prevPathname.current === null) {
      prevPathname.current = pathname;
      return;
    }
    if (prevPathname.current === pathname) {
      return;
    }

    prevPathname.current = pathname;

    if (consumeSkipEntryReveal()) {
      return;
    }

    if (phase === "idle") {
      beginEntryReveal();
    }
  }, [pathname, phase, beginEntryReveal, consumeSkipEntryReveal]);

  return null;
}
