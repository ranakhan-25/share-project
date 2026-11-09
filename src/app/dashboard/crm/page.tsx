/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { StatGrid } from "@/components/crm/stat-grid";
import { TodoStrip } from "@/components/crm/todo-strip";
import { LiveFeed } from "@/components/crm/live-feed";
import { CalendarPanel, RANGES } from "@/components/crm/calender-panel";
import { ActivityChart } from "@/components/crm/activity-chart";
import { PropertyStatusChart } from "@/components/crm/property-status-chart";
import { type StatCardData, type TodoSummaryItem } from "@/lib/api";
import { crmFetch, API_ORIGIN } from "./crm-fetch";

export default function CrmModulePage() {
  const [stats, setStats] = useState<StatCardData[]>([]);
  const [todo, setTodo] = useState<TodoSummaryItem[]>([]);
  const [range, setRange] = useState<(typeof RANGES)[number]>("Today");

  useEffect(() => {
    // 1. Fetch live stat cards from pipeline funnel & leads
    async function loadStats() {
      try {
        const [funnelRes, leadsRes] = await Promise.all([
          crmFetch(`${API_ORIGIN}/realbizpro/api/v1/crm/reports/sales-pipeline-funnel`),
          crmFetch(`${API_ORIGIN}/realbizpro/api/v1/crm/leads?page=1&limit=1`),
        ]);

        const funnelJson = await funnelRes.json().catch(() => ({}));
        const leadsJson = await leadsRes.json().catch(() => ({}));

        const totalLeads = leadsJson?.data?.meta?.total ?? leadsJson?.data?.total ?? 0;
        const funnelData = funnelJson?.data || {};
        const stages = funnelData.stages || funnelData.stage_distribution || [];

        const cards: StatCardData[] = [
          { id: "total-leads", label: "Total Leads", value: totalLeads, tone: "accent" },
        ];

        if (Array.isArray(stages) && stages.length > 0) {
          stages.slice(0, 3).forEach((st: any) => {
            const name = st.name || st.stageName || "Stage";
            const count = Number(st.count || st.leadCount || 0);
            cards.push({
              id: String(st.id || name).toLowerCase().replace(/\s+/g, "-"),
              label: name,
              value: count,
              tone: "neutral",
            });
          });
        } else {
          cards.push(
            { id: "new-leads", label: "Active Leads", value: totalLeads, tone: "info" },
            { id: "in-pipeline", label: "In Pipeline", value: totalLeads, tone: "warning" },
            { id: "deals-won", label: "Deals Won", value: 0, tone: "success" }
          );
        }

        setStats(cards);
      } catch (err) {
        console.error("Error loading CRM overview stats:", err);
      }
    }

    // 2. Fetch live tasks summary
    async function loadTodos() {
      try {
        const res = await crmFetch(`${API_ORIGIN}/realbizpro/api/v1/crm/tasks?page=1&limit=100`);
        const json = await res.json().catch(() => ({}));
        const tasks = Array.isArray(json?.data) ? json.data : json?.data?.data || [];

        const pending = tasks.filter((t: any) => t.status === "pending" || t.status === "in_progress");
        const urgent = pending.filter((t: any) => t.priority === "urgent" || t.priority === "high");
        const completed = tasks.filter((t: any) => t.status === "completed");

        setTodo([
          { id: "all-tasks", label: "Active Follow-ups", value: pending.length },
          { id: "urgent-tasks", label: "Urgent Priority", value: urgent.length, emphasis: "danger" },
          { id: "completed-tasks", label: "Completed", value: completed.length },
        ]);
      } catch (err) {
        console.error("Error loading task summary:", err);
      }
    }

    loadStats();
    loadTodos();
  }, []);

  return (
    <div className="px-4 md:px-6 py-5 space-y-5 max-w-7xl mx-auto">
      {/* Header Overview */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h1 className="font-display text-[19px] font-semibold text-ink">
          CRM Overview
        </h1>
        <p className="text-[13px] text-ink-muted mt-0.5">
          Lead activity and pipeline status across all agents.
        </p>
      </motion.div>

      {/* 1. Stat Cards */}
      <StatGrid stats={stats} />

      {/* 2. Side-by-Side Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ActivityChart range={range} />
        <PropertyStatusChart />
      </div>

      {/* 3. Lead Followups & Todos */}
      <div className="space-y-5">
        <TodoStrip items={todo} />
        <LiveFeed />
      </div>

      {/* 4. Calendar Panel */}
      <CalendarPanel range={range} onRangeChange={setRange} />
    </div>
  );
}
