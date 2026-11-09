"use client";

import { useState } from "react";
import Link from "next/link";
import { Circle, ChevronDown, LayoutGrid, Layers } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";
import { groupStatCards, type StatCardData, } from "@/lib/api";

const TONE_DOT: Record<StatCardData["tone"], string> = {
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
  neutral: "text-ink-faint",
};

export function StatGrid({ stats }: { stats: StatCardData[] }) {
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [showAllRaw, setShowAllRaw] = useState(false);

  const groups = groupStatCards(stats);
  const activeGroup = groups.find((g) => g.id === activeGroupId);

  const handleGroupClick = (groupId: string) => {
    setShowAllRaw(false);
    setActiveGroupId((prev) => (prev === groupId ? null : groupId));
  };

  const handleToggleShowAll = () => {
    setActiveGroupId(null);
    setShowAllRaw((prev) => !prev);
  };

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
          Pipeline Overview
        </h3>
        <button
          type="button"
          onClick={handleToggleShowAll}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors focus:outline-none"
        >
          {showAllRaw ? <LayoutGrid size={13} /> : <Layers size={13} />}
          {showAllRaw ? "Group View" : "View All 24 Stages"}
        </button>
      </div>

      {/* 5 Primary Clean Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {groups.map((group) => {
          const isSelected = activeGroupId === group.id;
          return (
            <motion.button
              key={group.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleGroupClick(group.id)}
              className={clsx(
                "relative rounded-xl border px-4 py-3.5 text-left transition-colors flex flex-col justify-between overflow-hidden",
                isSelected
                  ? "border-accent bg-surface shadow-md ring-2 ring-accent/10"
                  : "border-border bg-surface hover:border-border-hover"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 truncate">
                  <Circle
                    size={7}
                    strokeWidth={0}
                    fill="currentColor"
                    className={TONE_DOT[group.tone]}
                  />
                  <span className="text-xs font-medium text-ink-muted truncate">
                    {group.label}
                  </span>
                </div>
                {group.items.length > 0 && (
                  <motion.div
                    animate={{ rotate: isSelected ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={14} className="text-ink-faint" />
                  </motion.div>
                )}
              </div>

              <div>
                <p className="font-display text-2xl font-semibold text-ink tabular-nums">
                  {group.totalValue}
                </p>
                <p className="text-[11px] text-ink-faint mt-0.5">
                  {group.items.length} sub-stage{group.items.length > 1 ? "s" : ""}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Expandable Section (Category Sub-stages OR All Stages) */}
      <AnimatePresence mode="wait">
        {/* Scenario 1: Active Group Expanded */}
        {activeGroup && !showAllRaw && (
          <motion.div
            key={activeGroup.id}
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pt-2 pb-1">
              <div className="text-xs font-medium text-ink-muted mb-2 px-1">
                Sub-stages in <span className="text-ink font-semibold">{activeGroup.label}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
                {activeGroup.items.map((stat, idx) => (
                  <SubStageCard key={stat.id} stat={stat} index={idx} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Scenario 2: Show All 24 Stages Toggle */}
        {showAllRaw && (
          <motion.div
            key="all-stages"
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pt-2 pb-1">
              <div className="text-xs font-medium text-ink-muted mb-2 px-1">
                All 24 Pipeline Stages
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
                {stats.map((stat, idx) => (
                  <SubStageCard key={stat.id} stat={stat} index={idx} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

{/* Shared Sub-Stage Card Component with staggered entrance animation */}
function SubStageCard({ stat, index }: { stat: StatCardData; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15, delay: index * 0.02 }}
    >
      <Link
        href={
          stat.leadStageId == null
            ? "/dashboard/crm/lead/lead-list"
            : `/dashboard/crm/lead/lead-list?stage_id=${stat.leadStageId}`
        }
        className={clsx(
          "flex flex-col justify-between rounded-lg border border-border bg-surface px-3 py-2.5",
          "transition-all duration-150 ease-out hover:border-accent hover:shadow-xs",
          "active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
        )}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <Circle
            size={6}
            strokeWidth={0}
            fill="currentColor"
            className={TONE_DOT[stat.tone]}
          />
          <span className="text-[11px] text-ink-muted truncate font-medium">
            {stat.label}
          </span>
        </div>
        <p className="font-display text-lg font-semibold text-ink tabular-nums">
          {stat.value}
        </p>
      </Link>
    </motion.div>
  );
}
