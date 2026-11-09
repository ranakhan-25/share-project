"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, CalendarDays, PhoneCall, MapPinned, Cake, PartyPopper } from "lucide-react";
import { fetchDayActivity, type DayActivity } from "@/lib/api";

function formatLongDate(dateISO: string) {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function EventTable({
  rows,
  dateColumnLabel,
}: {
  rows: { name: string; mobile: string; date: string }[];
  dateColumnLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-canvas">
            <th className="px-3 py-2 text-[11.5px] font-semibold text-ink-muted">Name</th>
            <th className="px-3 py-2 text-[11.5px] font-semibold text-ink-muted">Mobile</th>
            <th className="px-3 py-2 text-[11.5px] font-semibold text-ink-muted">
              {dateColumnLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.name}-${i}`} className="border-t border-border">
              <td className="px-3 py-2 text-[13px] text-ink">{row.name}</td>
              <td className="px-3 py-2 text-[13px] text-ink-muted">{row.mobile}</td>
              <td className="px-3 py-2 text-[13px] text-ink-muted">{row.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DayActivityModal({
  dateISO,
  onClose,
}: {
  dateISO: string | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<DayActivity | null>(null);

  useEffect(() => {
    if (!dateISO) {
      setData(null);
      return;
    }
    fetchDayActivity(dateISO).then(setData);
  }, [dateISO]);

  useEffect(() => {
    if (!dateISO) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dateISO, onClose]);

  return (
    <AnimatePresence>
      {dateISO && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop — click outside to close */}
          <motion.div
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full max-w-lg rounded-xl border border-border bg-surface shadow-xl shadow-black/10 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 bg-accent px-5 py-4">
              <div className="flex items-center gap-2 text-white">
                <CalendarDays size={16} />
                <h2 className="font-display text-[15px] font-semibold">Today&apos;s Activities</h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="h-7 w-7 flex items-center justify-center rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-5">
              {!data ? (
                <p className="text-[13px] text-ink-faint text-center py-6">Loading…</p>
              ) : (
                <>
                  <div className="rounded-lg border border-border bg-canvas px-4 py-3.5 space-y-2">
                    <p className="text-[13px] text-ink">
                      <span className="font-semibold">Date:</span> {formatLongDate(data.date)}
                    </p>
                    <p className="flex items-center gap-1.5 text-[13px] text-ink">
                      <MapPinned size={13} className="text-ink-muted" />
                      <span className="font-semibold">Visits:</span> {data.visits}
                    </p>
                    <p className="flex items-center gap-1.5 text-[13px] text-ink">
                      <PhoneCall size={13} className="text-ink-muted" />
                      <span className="font-semibold">Calls:</span> {data.calls}
                    </p>
                  </div>

                  {data.birthdays.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Cake size={14} className="text-accent-strong" />
                        <h3 className="font-display text-[13.5px] font-semibold text-ink">
                          Birthday Details
                        </h3>
                      </div>
                      <EventTable rows={data.birthdays} dateColumnLabel="Birth Date" />
                    </div>
                  )}

                  {data.anniversaries.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <PartyPopper size={14} className="text-warning" />
                        <h3 className="font-display text-[13.5px] font-semibold text-ink">
                          Anniversary Details
                        </h3>
                      </div>
                      <EventTable rows={data.anniversaries} dateColumnLabel="Anniversary Date" />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end border-t border-border px-5 py-3.5">
              <button
                onClick={onClose}
                className="rounded-md border border-border px-4 py-1.5 text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
