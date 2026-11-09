"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  type TooltipContentProps,
} from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import { fetchActivityTrend, type ActivityPoint } from "@/lib/api";

const RANGE_MAP: Record<string, "today" | "weekly" | "monthly" | "yearly" | "all"> = {
  Today: "today",
  Weekly: "weekly",
  Monthly: "monthly",
  Yearly: "yearly",
  All: "all",
};

function ChartTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 shadow-sm shadow-black/6">
      <p className="mb-1 text-[11px] font-medium text-ink-muted">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey as string} className="flex items-center gap-1.5 text-[12px]">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: entry.color }} />
          <span className="capitalize text-ink-muted">
            {entry.dataKey === "followUps" ? "Follow-ups" : "Leads"}
          </span>
          <span className="ml-auto font-semibold text-ink tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ActivityChart({ range }: { range: string }) {
  const [data, setData] = useState<ActivityPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchActivityTrend(RANGE_MAP[range] ?? "weekly").then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [range]);

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-ink-muted" />
          <h3 className="font-display text-[13.5px] font-semibold text-ink">Activity</h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Leads
          </span>
          {/* Updated legend indicator to blue */}
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Follow-ups
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex h-36 items-center justify-center text-[12px] text-ink-faint">
          Loading…
        </div>
      ) : data.length > 0 ? (
        <div className="mt-2 -ml-2 h-36 [&_.recharts-wrapper]:outline-none">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                </linearGradient>
                {/* Updated gradient fill to blue */}
                <linearGradient id="followUpsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-ink-faint)", fontSize: 10.5 }}
                dy={4}
              />
              <YAxis hide domain={[0, "dataMax + 2"]} />
              <Tooltip
                content={ChartTooltip}
                cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1 }}
                wrapperStyle={{ outline: "none" }}
              />

              {/* Updated stroke color to blue */}
              <Area
                type="monotone"
                dataKey="followUps"
                stroke="#3b82f6"
                strokeWidth={1.5}
                fill="url(#followUpsFill)"
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                animationDuration={500}
              />
              <Area
                type="monotone"
                dataKey="leads"
                stroke="var(--color-accent)"
                strokeWidth={2}
                fill="url(#leadsFill)"
                dot={false}
                activeDot={{ r: 3.5, strokeWidth: 0 }}
                animationDuration={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-36 items-center justify-center text-[12px] text-ink-faint">
          No data available
        </div>
      )}
    </div>
  );
}
