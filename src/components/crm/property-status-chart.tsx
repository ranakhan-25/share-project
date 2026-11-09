"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  type TooltipContentProps,
} from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import { fetchPropertyStatusCounts, type PropertyStatusCount } from "@/lib/api";

function ChartTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 shadow-sm shadow-black/6">
      <p className="text-[11px] font-medium text-ink-muted mb-1">{label}</p>
      <div className="flex items-center gap-1.5 text-[12px]">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="text-ink-muted">Properties</span>
        <span className="font-semibold text-ink ml-auto tabular-nums">{entry.value}</span>
      </div>
    </div>
  );
}

export function PropertyStatusChart() {
  const [data, setData] = useState<PropertyStatusCount[]>([]);

  useEffect(() => {
    fetchPropertyStatusCounts().then(setData);
  }, []);

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-2 mb-1">
        <Building2 size={14} className="text-ink-muted" />
        <h3 className="font-display text-[13.5px] font-semibold text-ink">Properties by Status</h3>
      </div>

      {data.length > 0 ? (
        <div className="mt-3 -ml-2 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="status"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-ink-faint)", fontSize: 11 }}
                dy={6}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-ink-faint)", fontSize: 10.5 }}
                width={28}
              />
              <Tooltip
                content={(props) => <ChartTooltip {...props} />}
                cursor={{ fill: "var(--color-canvas)" }}
              />
              <Bar
                dataKey="count"
                fill="var(--color-accent)"
                radius={[4, 4, 0, 0]}
                maxBarSize={44}
                animationDuration={500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-56 flex items-center justify-center text-[12px] text-ink-faint">
          Loading…
        </div>
      )}
    </div>
  );
}
