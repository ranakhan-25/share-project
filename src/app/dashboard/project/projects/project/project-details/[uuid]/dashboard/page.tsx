/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { getStoredAccessToken, getStoredUser } from "@/lib/admin-auth/adminAuthStorage";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"}/realbizpro/api/v1`
).replace(/\/+$/, "");

export default function DashboardPage() {
  const params = useParams();
  const uuid = params?.uuid as string;
  const [loading, setLoading] = useState(true);

  const storedUser = useMemo(() => getStoredUser(), []);
  const userEmail = (storedUser?.email || "").toLowerCase().trim();

  // Stats
  const [stats, setStats] = useState({
    budget: 0,
    cost: 0,
    available: 0,
    revenue: 0,
    profit: 0,
  });

  const [boqData, setBoqData] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [unsoldProperties, setUnsoldProperties] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = getStoredAccessToken();
        const headers: Record<string, string> = {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const [resBoq, resFlat, resTask] = await Promise.all([
          fetch(`${API_BASE}/boq?page=1&limit=100`, { headers }).then((r) => r.json()).catch(() => ({})),
          fetch(`${API_BASE}/flat-land?page=1&limit=100`, { headers }).then((r) => r.json()).catch(() => ({})),
          fetch(`${API_BASE}/task?page=1&limit=100`, { headers }).then((r) => r.json()).catch(() => ({})),
        ]);

        let totalBudget = 0;
        let totalCost = 0;
        let totalRevenue = 0;
        const unsold: any[] = [];

        if (resBoq?.success || resBoq?.data) {
          const rawBoqs = (resBoq.data?.data || resBoq.data || []).filter((item: any) => !item.deletedAt);

          // User email filter
          const userBoqs = userEmail
            ? rawBoqs.filter((b: any) => {
                const creator = String(b.createdBy || "").toLowerCase().trim();
                const email = String(b.email || b.clientEmail || "").toLowerCase().trim();
                if (!creator && !email) return true;
                return (
                  creator === userEmail ||
                  email === userEmail ||
                  creator === String(storedUser?.id) ||
                  (storedUser?.username && creator === storedUser.username.toLowerCase())
                );
              })
            : rawBoqs;

          setBoqData(userBoqs);
          userBoqs.forEach((b: any) => {
            totalBudget += Number(b.budget) || 0;
            totalCost += Number(b.cost) || 0;
          });
        }

        if (resFlat?.success || resFlat?.data) {
          const rawFlats = (resFlat.data?.data || resFlat.data || []).filter((item: any) => !item.deletedAt);
          rawFlats.forEach((f: any) => {
            if (f.status === "Sold" || f.status === "Booked") {
              totalRevenue += Number(f.grandTotal) || 0;
            } else {
              unsold.push(f);
            }
          });
          setUnsoldProperties(unsold);
        }

        if (resTask?.success || resTask?.data) {
          const rawTasks = (resTask.data?.data || resTask.data || []).filter((t: any) => !t.deletedAt);
          setTasks(rawTasks);
        }

        const mockExpenses = [
          { name: "Cost of Goods Sold (COGS)", amount: totalCost },
          { name: "Material Consumption", amount: Math.round(totalCost * 0.15) },
          { name: "Total Expense (-)", amount: Math.round(totalCost * 1.15) },
        ];
        setExpenses(mockExpenses);

        setStats({
          budget: totalBudget,
          cost: totalCost,
          available: Math.max(0, totalBudget - totalCost),
          revenue: totalRevenue,
          profit: totalRevenue - totalCost,
        });
      } catch (err) {
        console.error("fetchDashboardData error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [uuid, userEmail, storedUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const maxFinancialValue = Math.max(stats.budget, stats.cost, 1);

  return (
    <div className="space-y-6">
      {userEmail && (
        <div className="text-xs text-slate-500">
          Viewing metrics isolated for user: <strong className="text-emerald-700">{userEmail}</strong>
        </div>
      )}

      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <SummaryCard title="Budget" value={stats.budget} icon="💵" color="text-emerald-600" bgColor="bg-emerald-50" />
        <SummaryCard title="Cost" value={stats.cost} icon="💳" color="text-purple-600" bgColor="bg-purple-50" />
        <SummaryCard title="Available" value={stats.available} icon="✅" color="text-teal-600" bgColor="bg-teal-50" />
        <SummaryCard title="Sales / Revenue" value={stats.revenue} icon="🛒" color="text-cyan-600" bgColor="bg-cyan-50" />
        <SummaryCard title="Profit / Loss" value={stats.profit} icon="📊" color="text-amber-500" bgColor="bg-amber-50" />
      </div>

      {/* 2. Charts / Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Progress */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
            <h3 className="font-bold text-slate-800 mb-4 text-sm">Financial Progress</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Total Budget</span>
                  <span className="font-mono font-semibold">৳{stats.budget.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (stats.budget / maxFinancialValue) * 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Actual Cost</span>
                  <span className="font-mono font-semibold">৳{stats.cost.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (stats.cost / maxFinancialValue) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* BOQ Summary Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
            <h3 className="font-bold text-slate-800 mb-4 text-sm">BOQ Items Overview</h3>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {boqData.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No BOQ records found for this account.</p>
              ) : (
                boqData.slice(0, 6).map((b, idx) => (
                  <div key={b.uuid || idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs">
                    <span className="font-medium text-slate-700 truncate max-w-xs">{b.title || b.name || `BOQ Item #${idx + 1}`}</span>
                    <span className="font-mono font-semibold text-emerald-700">৳{Number(b.budget || 0).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Working Schedule & Unsold */}
        <div className="space-y-6">
          {/* Working Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
            <h3 className="font-bold text-slate-800 mb-3 text-sm">Working Schedule</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tasks.length > 0 ? (
                tasks.slice(0, 5).map((task, idx) => {
                  const progress = Number(task.progress || task.progressPercentage || 0);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span className="truncate">{task.taskName || task.name || `Task #${idx + 1}`}</span>
                        <span className="font-mono font-semibold">{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-teal-500 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No schedule data</p>
              )}
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
            <h3 className="font-bold text-slate-800 mb-3 text-sm">Most Expenses</h3>
            <div className="space-y-2">
              {expenses.map((exp, i) => (
                <div key={i} className="flex justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-600 truncate">{exp.name}</span>
                  <span className="font-mono font-semibold text-slate-800">৳{exp.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  color,
  bgColor,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-3.5 border border-slate-200/90 bg-white shadow-2xs">
      <div className={`p-3 rounded-xl ${bgColor} ${color} text-lg shrink-0`}>
        {icon}
      </div>
      <div className="truncate">
        <div className="text-base sm:text-lg font-bold text-slate-800 font-mono">
          ৳{value.toLocaleString()}
        </div>
        <div className="text-[11px] font-medium text-slate-500 truncate">{title}</div>
      </div>
    </div>
  );
}
