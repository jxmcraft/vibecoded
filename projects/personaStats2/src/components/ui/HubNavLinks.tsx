"use client";

import { PersonaNavLink } from "@/components/ui/PersonaNavLink";

export type HubNavCurrent =
  | "home"
  | "map"
  | "stats"
  | "missions"
  | "calendar"
  | "profile"
  | "settings";

const linkClass =
  "font-p5-display text-[11px] tracking-[0.3em] text-paper/85 hover:text-persona-red hover:underline sm:text-xs sm:tracking-[0.35em]";

const currentClass =
  "font-p5-display text-[11px] tracking-[0.3em] text-paper sm:text-xs sm:tracking-[0.35em]";

const homeLinkClass =
  "font-p5-display text-[11px] tracking-[0.3em] text-persona-red hover:underline sm:text-xs sm:tracking-[0.35em]";

type HubNavLinksProps = {
  current: HubNavCurrent;
  className?: string;
};

export function HubNavLinks({ current, className }: HubNavLinksProps) {
  const item = (id: HubNavCurrent, href: string, label: string) => {
    if (current === id) {
      const cls =
        id === "home" ? `${currentClass} text-persona-red` : currentClass;
      return (
        <span key={id} className={cls} aria-current="page">
          {label}
        </span>
      );
    }
    return (
      <PersonaNavLink
        key={id}
        href={href}
        className={id === "home" ? homeLinkClass : linkClass}
      >
        {label}
      </PersonaNavLink>
    );
  };

  return (
    <nav
      aria-label="Jump to district"
      className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:gap-x-4 ${className ?? ""}`}
    >
      {item("home", "/", "← HOME")}
      {item("map", "/map", "MAP")}
      {item("stats", "/stats", "STATS")}
      {item("missions", "/missions", "MISSIONS")}
      {item("calendar", "/calendar", "CALENDAR")}
      {item("profile", "/profile", "PROFILE")}
      {item("settings", "/settings", "SETTINGS")}
    </nav>
  );
}

export function hubCurrentFromPathname(pathname: string): HubNavCurrent {
  const p = pathname.split("?")[0] ?? "/";
  if (p === "/" || p === "") return "home";
  if (p.startsWith("/map")) return "map";
  if (p.startsWith("/stats")) return "stats";
  if (p.startsWith("/missions")) return "missions";
  if (p.startsWith("/calendar")) return "calendar";
  if (p.startsWith("/profile")) return "profile";
  if (p.startsWith("/settings")) return "settings";
  return "home";
}
