"use client";

import type { ReactNode } from "react";

import { BgmPlayer } from "@/components/providers/BgmPlayer";
import { RainOverlay } from "@/components/providers/RainOverlay";
import { RoutePathnameSync } from "@/components/providers/RoutePathnameSync";
import { RouteWipeLayer } from "@/components/providers/RouteWipeLayer";
import { RouteWipeProvider } from "@/components/providers/routeWipeContext";
import { StoreGate } from "@/components/providers/StoreGate";

type PhantomAppShellProps = {
  children: ReactNode;
};

export function PhantomAppShell({ children }: PhantomAppShellProps) {
  return (
    <StoreGate>
      <RouteWipeProvider>
        <RoutePathnameSync />
        <RainOverlay />
        <BgmPlayer />
        <RouteWipeLayer />
        {children}
      </RouteWipeProvider>
    </StoreGate>
  );
}
