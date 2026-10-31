"use client";

import { useId } from "react";

/** Original generated skyline illustration (no external images needed). */
export function SkylineArt({
  hue = 160,
  variant = 0,
  className = "",
}: {
  hue?: number;
  variant?: number;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const sets = [
    [
      [20, 70, 36], [62, 40, 44], [112, 90, 30], [148, 55, 40], [194, 30, 50], [250, 75, 34], [290, 50, 38],
    ],
    [
      [10, 55, 40], [56, 85, 28], [90, 35, 46], [142, 70, 36], [184, 48, 42], [232, 95, 30], [270, 60, 44],
    ],
    [
      [16, 45, 50], [72, 80, 32], [110, 30, 48], [164, 65, 38], [208, 40, 44], [258, 88, 30], [296, 52, 36],
    ],
  ][variant % 3];
  return (
    <svg viewBox="0 0 340 220" className={className} preserveAspectRatio="xMidYMax slice" aria-hidden>
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`hsl(${hue} 70% 20%)`} />
          <stop offset="1" stopColor={`hsl(${hue + 30} 80% 38%)`} />
        </linearGradient>
        <linearGradient id={`bld-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`hsl(${hue} 60% 60%)`} stopOpacity=".95" />
          <stop offset="1" stopColor={`hsl(${hue + 20} 70% 30%)`} />
        </linearGradient>
        <radialGradient id={`sun-${id}`} cx=".75" cy=".28" r=".5">
          <stop offset="0" stopColor="#fde68a" stopOpacity=".95" />
          <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="340" height="220" fill={`url(#sky-${id})`} />
      <rect width="340" height="220" fill={`url(#sun-${id})`} />
      <circle cx="262" cy="62" r="18" fill="#fde68a" opacity=".9" />
      {sets.map(([x, h, w], i) => (
        <g key={i}>
          <rect x={x} y={220 - h - 40} width={w} height={h + 40} rx="3" fill={`url(#bld-${id})`} opacity={0.55 + (i % 3) * 0.15} />
          {Array.from({ length: Math.floor((h + 20) / 14) }).map((_, r) =>
            Array.from({ length: Math.floor(w / 12) }).map((__, c) => (
              <rect
                key={`${r}-${c}`}
                x={x + 6 + c * 12}
                y={220 - h - 30 + r * 14}
                width="5"
                height="7"
                rx="1"
                fill="#fff"
                opacity={(r * 7 + c * 3 + i) % 4 === 0 ? 0.85 : 0.18}
              />
            )),
          )}
        </g>
      ))}
      <rect y="196" width="340" height="24" fill={`hsl(${hue} 60% 12%)`} opacity=".7" />
    </svg>
  );
}
