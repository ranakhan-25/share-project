"use client";

import { motion } from "motion/react";
import { useId, useState } from "react";
import { useLang } from "@/lib/i18n";
import { PALETTE, monotonePath, niceMax, useMeasure } from "./utils";

export type Series = { name: string; values: number[] };

export function AreaChart({ labels, series, height = 300 }: { labels: string[]; series: Series[]; height?: number }) {
  const { taka } = useLang();
  const id = useId().replace(/:/g, "");
  const [ref, width] = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const m = { t: 16, r: 16, b: 30, l: 54 };
  const w = Math.max(width - m.l - m.r, 10);
  const h = height - m.t - m.b;
  const max = niceMax(Math.max(...series.flatMap((s) => s.values)) * 1.05);
  const x = (i: number) => m.l + (i / Math.max(labels.length - 1, 1)) * w;
  const y = (v: number) => m.t + h - (v / max) * h;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const step = Math.ceil(labels.length / Math.max(Math.floor(width / 70), 1));

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left - m.l;
    setHover(Math.min(labels.length - 1, Math.max(0, Math.round((px / w) * (labels.length - 1)))));
  };

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <>
          <svg width={width} height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img" aria-label="Area chart">
            <defs>
              {series.map((_, si) => (
                <linearGradient key={si} id={`${id}-g${si}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={PALETTE[si]} stopOpacity={si === 0 ? 0.28 : 0.16} />
                  <stop offset="1" stopColor={PALETTE[si]} stopOpacity="0" />
                </linearGradient>
              ))}
            </defs>
            {ticks.map((tv, i) => (
              <g key={i}>
                <line x1={m.l} x2={m.l + w} y1={y(tv)} y2={y(tv)} stroke="#e2e8f0" strokeDasharray={i === 0 ? undefined : "3 5"} />
                <text x={m.l - 10} y={y(tv) + 4} textAnchor="end" className="fill-slate-400 text-[11px]">{taka(tv, true)}</text>
              </g>
            ))}
            {labels.map((l, i) => i % step === 0 && (
              <text key={i} x={x(i)} y={height - 8} textAnchor="middle" className="fill-slate-400 text-[11px]">{l}</text>
            ))}
            {series.map((s, si) => {
              const pts = s.values.map((v, i) => [x(i), y(v)] as [number, number]);
              const d = monotonePath(pts);
              return (
                <g key={`${s.name}-${width}`}>
                  <motion.path d={`${d}L${x(s.values.length - 1)},${m.t + h}L${x(0)},${m.t + h}Z`} fill={`url(#${id}-g${si})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }} />
                  <motion.path d={d} fill="none" stroke={PALETTE[si]} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: si * 0.2, ease: "easeInOut" }} />
                </g>
              );
            })}
            {hover !== null && (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={m.t + h} stroke="#94a3b8" strokeDasharray="4 4" />
                {series.map((s, si) => (
                  <circle key={si} cx={x(hover)} cy={y(s.values[hover])} r={5} fill={PALETTE[si]} stroke="#fff" strokeWidth={2} />
                ))}
              </g>
            )}
          </svg>
          {hover !== null && (
            <div
              className="pointer-events-none absolute z-10 min-w-[150px] rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-xl backdrop-blur"
              style={{ left: Math.min(Math.max(x(hover) + 14, 0), width - 170), top: 8 }}
            >
              <p className="mb-1.5 font-semibold text-slate-900">{labels[hover]}</p>
              {series.map((s, si) => (
                <p key={si} className="flex items-center justify-between gap-4 text-slate-600">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: PALETTE[si] }} />{s.name}</span>
                  <b className="text-slate-900">{taka(s.values[hover], true)}</b>
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
