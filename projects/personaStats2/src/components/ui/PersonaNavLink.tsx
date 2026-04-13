"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { useRouteWipe } from "@/components/providers/routeWipeContext";

type PersonaNavLinkProps = Omit<ComponentProps<typeof Link>, "href" | "onClick"> & {
  href: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

export function PersonaNavLink({ href, onClick, className, ...rest }: PersonaNavLinkProps) {
  const { navigateWithWipe, phase } = useRouteWipe();
  const dest = href;

  const mergedClass = [
    "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link
      href={href}
      className={mergedClass}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (phase !== "idle") {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        navigateWithWipe(dest);
      }}
      {...rest}
    />
  );
}
