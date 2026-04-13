"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { MenuIntroLayer } from "@/components/providers/MenuIntroLayer";
import { useRouteWipe } from "@/components/providers/routeWipeContext";
import { playPhantomSfx } from "@/lib/sfx";

type MenuIntroContextValue = {
  startProfileMenuIntro: () => void;
  isProfileMenuIntroActive: boolean;
};

const MenuIntroContext = createContext<MenuIntroContextValue | null>(null);

export function MenuIntroProvider({ children }: { children: ReactNode }) {
  const { phase } = useRouteWipe();
  const [active, setActive] = useState(false);

  const startProfileMenuIntro = useCallback(() => {
    if (phase !== "idle" || active) return;
    playPhantomSfx("menuOpen");
    setActive(true);
  }, [phase, active]);

  const finish = useCallback(() => setActive(false), []);

  const value = useMemo(
    () => ({
      startProfileMenuIntro,
      isProfileMenuIntroActive: active,
    }),
    [active, startProfileMenuIntro],
  );

  return (
    <MenuIntroContext.Provider value={value}>
      {children}
      {active ? <MenuIntroLayer onFinished={finish} /> : null}
    </MenuIntroContext.Provider>
  );
}

export function useMenuIntro() {
  const ctx = useContext(MenuIntroContext);
  if (!ctx) {
    throw new Error("useMenuIntro must be used within MenuIntroProvider");
  }
  return ctx;
}
