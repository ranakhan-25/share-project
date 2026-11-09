"use client";

import { motion } from "motion/react";
import { ClipboardList } from "lucide-react";
import clsx from "clsx";
import type { TodoSummaryItem } from "@/lib/api";

export function TodoStrip({ items }: { items: TodoSummaryItem[] }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-2 mb-3.5">
        <ClipboardList size={15} className="text-ink-muted" />
        <h2 className="font-display text-[13.5px] font-semibold text-ink">
          To-Do List
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: i * 0.03 }}
            className={clsx(
              "rounded-md border px-3 py-2.5 flex items-center justify-between gap-2",
              item.emphasis === "danger"
                ? "border-danger/25 bg-danger-soft"
                : "border-border bg-canvas",
            )}
          >
            <span
              className={clsx(
                "text-[12px] leading-tight",
                item.emphasis === "danger" ? "text-danger" : "text-ink-muted",
              )}
            >
              {item.label}
            </span>
            <span
              className={clsx(
                "font-[family-name:var(--font-display)] text-[15px] font-semibold shrink-0",
                item.emphasis === "danger" ? "text-danger" : "text-ink",
              )}
            >
              {item.value}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
