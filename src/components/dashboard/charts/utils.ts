"use client";

import { useEffect, useRef, useState } from "react";

/** Validated categorical palette (fixed order, never cycled). */
export const PALETTE = ["#059669", "#0284c7", "#7c3aed", "#d97706", "#e11d48"] as const;

export function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Monotone cubic path through points (no overshoot). */
export function monotonePath(pts: [number, number][]): string {
  const n = pts.length;
  if (n < 2) return "";
  const dx: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i];
  }
  const t: number[] = new Array(n);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
    } else {
      const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
      if (s > 9) {
        const k = 3 / Math.sqrt(s);
        t[i] = k * a * m[i];
        t[i + 1] = k * b * m[i];
      }
    }
  }
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i];
    d += `C${pts[i][0] + h / 3},${pts[i][1] + (t[i] * h) / 3} ${pts[i + 1][0] - h / 3},${pts[i + 1][1] - (t[i + 1] * h) / 3} ${pts[i + 1][0]},${pts[i + 1][1]}`;
  }
  return d;
}

export function niceMax(v: number) {
  const p = Math.pow(10, Math.floor(Math.log10(v || 1)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}
