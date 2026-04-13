"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

export const personaButtonJolt = {
  hover: { rotate: -2.5, scale: 1.02 },
  tap: { rotate: 1.5, scale: 0.98 },
} as const;

export type PersonaButtonVariant = "primary" | "secondary" | "ghost" | "chip";

const variantClass: Record<PersonaButtonVariant, string> = {
  primary:
    "border-2 border-persona-red bg-persona-red px-6 py-2 font-bebas tracking-widest text-paper shadow-[4px_4px_0_0_#fff] hover:brightness-110 disabled:opacity-40",
  secondary:
    "border border-paper/30 px-5 py-2 font-bebas tracking-wider text-paper hover:bg-paper/10 disabled:opacity-40",
  ghost:
    "border border-persona-red/60 px-5 py-2 font-bebas tracking-wider text-persona-red hover:bg-persona-red/10 disabled:opacity-40",
  chip:
    "border border-paper/25 px-3 py-1 font-bebas text-xs text-paper hover:border-persona-red hover:text-persona-red disabled:opacity-40",
};

export type PersonaButtonProps = HTMLMotionProps<"button"> & {
  variant?: PersonaButtonVariant;
};

export function PersonaButton({
  variant = "primary",
  className = "",
  disabled,
  type = "button",
  ...rest
}: PersonaButtonProps) {
  const reduceMotion = useReducedMotion();
  const motionOff = !!reduceMotion || !!disabled;

  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={motionOff ? undefined : personaButtonJolt.hover}
      whileTap={motionOff ? undefined : personaButtonJolt.tap}
      transition={{ type: "spring", stiffness: 520, damping: 28 }}
      className={`${variantClass[variant]} ${className}`.trim()}
      {...rest}
    />
  );
}
