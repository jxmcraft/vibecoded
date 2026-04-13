"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { useRouteWipe } from "@/components/providers/routeWipeContext";

type PersonaNavLinkProps = Omit<ComponentProps<typeof Link>, "href" | "onClick"> & {
  href: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

export function PersonaNavLink({ href, onClick, ...rest }: PersonaNavLinkProps) {
  const { navigateWithWipe, phase } = useRouteWipe();
  const dest = href;

  return (
    <Link
      href={href}
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
