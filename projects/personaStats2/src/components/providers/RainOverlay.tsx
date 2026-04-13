"use client";

import { useStore } from "@/store/useStore";

const DROP_COUNT = 64;

export function RainOverlay() {
  const rainEnabled = useStore((s) => s.settings.rainEnabled);

  if (!rainEnabled) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[5] overflow-hidden"
      aria-hidden
    >
      {Array.from({ length: DROP_COUNT }, (_, i) => (
        <span
          key={i}
          className="rain-drop absolute rounded-full bg-paper"
          style={{
            left: `${(i * 1.47) % 101}%`,
            width: i % 4 === 0 ? 2 : 1,
            height: i % 5 === 0 ? "18%" : "14%",
            top: "-22%",
            animationDelay: `${(i * 0.06) % 3.5}s`,
            animationDuration: `${1.25 + (i % 6) * 0.16}s`,
          }}
        />
      ))}
    </div>
  );
}
