"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { fetchCalendarEvents, type CalendarEvent } from "@/lib/api";
import { DayActivityModal } from "@/components/crm/day-activity-modal";

const RANGES = ["Today", "Weekly", "Monthly", "Yearly", "All"] as const;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarPanel({
  range,
  onRangeChange,
}: {
  range: (typeof RANGES)[number];
  onRangeChange: (r: (typeof RANGES)[number]) => void;
}) {
  const [cursor, setCursor] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const today = new Date();

  const monthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;

  useEffect(() => {
    fetchCalendarEvents(monthKey).then(setEvents);
  }, [monthKey]);

  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: { day: number; current: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ day: daysInPrevMonth - i, current: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, current: true });
    }
    while (cells.length % 7 !== 0 || cells.length < 42) {
      const nextDay = cells.length - (firstDay + daysInMonth) + 1;
      cells.push({ day: nextDay, current: false });
      if (cells.length >= 42) break;
    }
    return cells;
  }, [cursor]);

  const monthLabel = cursor.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const eventDates = new Set(events.map((e) => Number(e.date.split("-")[2])));

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex gap-1 rounded-md bg-canvas p-0.5 border border-border">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={clsx(
                "relative px-2.5 py-1 text-[12px] font-medium rounded-[6px] transition-colors",
                range === r ? "text-white" : "text-ink-muted hover:text-ink",
              )}
            >
              {range === r && (
                <motion.span
                  layoutId="range-pill"
                  className="absolute inset-0 rounded-[6px] bg-accent"
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                />
              )}
              <span className="relative">{r}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setCursor(new Date())}
          className="text-[12px] font-medium text-accent-strong hover:underline"
        >
          Today
        </button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-[14px] font-semibold text-ink">{monthLabel}</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="h-6 w-6 flex items-center justify-center rounded text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="h-6 w-6 flex items-center justify-center rounded text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((wd) => (
          <span key={wd} className="text-[11px] text-ink-faint font-medium py-1">
            {wd}
          </span>
        ))}
        {grid.map((cell, i) => {
          const isToday =
            cell.current &&
            cell.day === today.getDate() &&
            cursor.getMonth() === today.getMonth() &&
            cursor.getFullYear() === today.getFullYear();
          const hasEvent = cell.current && eventDates.has(cell.day);
          return (
            <div key={i} className="flex justify-center py-0.5">
              <button
                onClick={() =>
                  cell.current &&
                  setSelectedDate(
                    `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`,
                  )
                }
                disabled={!cell.current}
                className={clsx(
                  "relative h-7 w-7 rounded-md text-[12px] transition-colors",
                  !cell.current && "text-ink-faint/50 cursor-default",
                  cell.current && !isToday && "text-ink hover:bg-canvas cursor-pointer",
                  isToday && "bg-accent text-white font-semibold cursor-pointer",
                )}
              >
                {cell.day}
                {hasEvent && !isToday && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-accent" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      <DayActivityModal dateISO={selectedDate} onClose={() => setSelectedDate(null)} />
    </div>
  );
}

export { RANGES };
