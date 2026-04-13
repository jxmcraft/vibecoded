"use client";

import type { ReactNode } from "react";

import { BgmPlayer } from "@/components/providers/BgmPlayer";
import { MenuIntroProvider } from "@/components/providers/menuIntroContext";
import { RainOverlay } from "@/components/providers/RainOverlay";
import { RoutePathnameSync } from "@/components/providers/RoutePathnameSync";
import { RouteWipeLayer } from "@/components/providers/RouteWipeLayer";
import { RouteWipeProvider } from "@/components/providers/routeWipeContext";
import { ConfidantRankUpOverlay } from "@/components/rewards/ConfidantRankUpOverlay";
import { DateTransitionOverlay } from "@/components/rewards/DateTransitionOverlay";
import { StoreGate } from "@/components/providers/StoreGate";

type PhantomAppShellProps = {
  children: ReactNode;
};

export function PhantomAppShell({ children }: PhantomAppShellProps) {
  return (
    <StoreGate>
      <RouteWipeProvider>
        <RoutePathnameSync />
        <MenuIntroProvider>
          <RainOverlay />
          <BgmPlayer />
          <RouteWipeLayer />
          <DateTransitionOverlay />
          <ConfidantRankUpOverlay />
          {children}
        </MenuIntroProvider>
      </RouteWipeProvider>
    </StoreGate>
  );
}
