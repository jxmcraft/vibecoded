"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

import { TOKYO_MAP_SRC } from "@/data/locations";

/** Routes that share a subtle Tokyo-map wash behind the UI (not `/map`, which has per-station scenes). */
const BACKDROP_PATHS = new Set(["/", "/missions", "/stats", "/settings", "/calendar"]);

export function PhantomRouteBackdrop() {
  const pathname = usePathname();
  if (!BACKDROP_PATHS.has(pathname)) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      <Image
        src={TOKYO_MAP_SRC}
        alt=""
        fill
        className="scale-105 object-cover opacity-[0.14] blur-[2px]"
        sizes="100vw"
        priority={false}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/82 via-black/78 to-black/88" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(6,182,212,0.06),transparent_55%)]" />
    </div>
  );
}
