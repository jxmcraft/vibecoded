"use client";

import type { ReactNode } from "react";

import { BgmPlayer } from "@/components/providers/BgmPlayer";
import { PhantomBottomDock } from "@/components/providers/PhantomBottomDock";
import { PhantomRouteBackdrop } from "@/components/providers/PhantomRouteBackdrop";
import { MenuIntroProvider } from "@/components/providers/menuIntroContext";
import { RainOverlay } from "@/components/providers/RainOverlay";
import { RoutePathnameSync } from "@/components/providers/RoutePathnameSync";
import { RouteWipeLayer } from "@/components/providers/RouteWipeLayer";
import { RouteWipeProvider } from "@/components/providers/routeWipeContext";
import { MonitoredChrome } from "@/components/providers/MonitoredChrome";
import { ConfidantRankUpOverlay } from "@/components/rewards/ConfidantRankUpOverlay";
import { DateTransitionOverlay } from "@/components/rewards/DateTransitionOverlay";
import { WeeklyCallingCardOverlay } from "@/components/rewards/WeeklyCallingCardOverlay";
import { StoreGate } from "@/components/providers/StoreGate";
import { PhantomTopHud } from "@/components/providers/PhantomTopHud";

type PhantomAppShellProps = {
  children: ReactNode;
};

export function PhantomAppShell({ children }: PhantomAppShellProps) {
  return (
    <StoreGate>
      <RouteWipeProvider>
        <div className="flex min-h-0 w-full flex-1 flex-col">
          <PhantomRouteBackdrop />
          <RoutePathnameSync />
          <MenuIntroProvider>
            <RainOverlay />
            <BgmPlayer />
            <RouteWipeLayer />
            <MonitoredChrome />
            <DateTransitionOverlay />
            <ConfidantRankUpOverlay />
            <WeeklyCallingCardOverlay />
            <div className="flex min-h-0 flex-1 flex-col">
              <PhantomTopHud />
              {children}
            </div>
            <PhantomBottomDock />
          </MenuIntroProvider>
        </div>
      </RouteWipeProvider>
    </StoreGate>
  );
}
