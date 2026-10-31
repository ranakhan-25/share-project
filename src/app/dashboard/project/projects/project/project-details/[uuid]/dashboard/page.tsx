/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export default function DashboardPage() {
  const { uuid } = useParams();
  const [loading, setLoading] = useState(true);

  // স্ট্যাট ডাটা
  const [stats, setStats] = useState({
    budget: 0,
    cost: 0,
    available: 0,
    revenue: 0,
    profit: 0,
  });

  // চার্ট ডাটা
  const [boqData, setBoqData] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [unsoldProperties, setUnsoldProperties] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // ১. BOQ লিস্ট (বাজেট এবং খরচের জন্য)
        const resBoq = await fetch(`${API_BASE}/realbizpro/api/v1/boq?page=1&limit=100`);
        const jsonBoq = await resBoq.json();
        let totalBudget = 0;
        let totalCost = 0;
        if (jsonBoq.success) {
          const boqs = (jsonBoq.data.data || []).filter((item: any) => !item.deletedAt);
          setBoqData(boqs);
          boqs.forEach((b: any) => {
            totalBudget += Number(b.budget) || 0;
            totalCost += Number(b.cost) || 0;
          });
        }

        // ২. Flat/Land (Revenue এবং Unsold Property)
        const resFlat = await fetch(`${API_BASE}/realbizpro/api/v1/flat-land?page=1&limit=100`);
        const jsonFlat = await resFlat.json();
        let totalRevenue = 0;
        
        // ✅ let এর জায়গায় const ব্যবহার করা হলো
        const unsold: any[] = []; 

        if (jsonFlat.success) {
          const flats = (jsonFlat.data.data || []).filter((item: any) => !item.deletedAt);
          flats.forEach((f: any) => {
            if (f.status === "Sold" || f.status === "Booked") {
              totalRevenue += Number(f.grandTotal) || 0;
            } else {
              unsold.push(f);
            }
          });
        }
        setUnsoldProperties(unsold);

        // ৩. খরচের লিস্ট (Expense - ডেমো ডাটা)
        const mockExpenses = [
          { name: "Cost of Goods Sold (COGS)", amount: 13650 },
          { name: "Rod Consumption", amount: 410 },
          { name: "Total Expense (-)", amount: 14260 },
        ];
        setExpenses(mockExpenses);

        // স্ট্যাট সেট করা
        setStats({
          budget: totalBudget,
          cost: totalCost,
          available: totalBudget - totalCost,
          revenue: totalRevenue,
          profit: totalRevenue - totalCost,
        });

      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    if (uuid) fetchDashboardData();
  }, [uuid]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  // Financial Progress এর জন্য Max Value বের করা
  const maxFinancialValue = Math.max(stats.budget, stats.cost, 1);

  return (
    <div className="space-y-6">
      
      {/* ১. Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SummaryCard title="Budget" value={stats.budget} icon="💵" color="text-green-600" bgColor="bg-green-50" />
        <SummaryCard title="Cost" value={stats.cost} icon="💳" color="text-purple-600" bgColor="bg-purple-50" />
        <SummaryCard title="Available" value={stats.available} icon="✅" color="text-teal-600" bgColor="bg-teal-50" />
        <SummaryCard title="Sales/Revenue" value={stats.revenue} icon="🛒" color="text-cyan-600" bgColor="bg-cyan-50" />
        <SummaryCard title="Profit/Loss" value={stats.profit} icon="📊" color="text-orange-500" bgColor="bg-orange-50" />
      </div>

      {/* ২. Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Working Progress (Mock Chart) */}
        <div className="bg-white rounded-lg border p-4 shadow-sm">
          <h3 className="text-center font-medium mb-6 text-gray-700">Working Progress</h3>
          <div className="h-48 flex items-center justify-center border-b border-l border-gray-200 relative">
            <div className="w-full px-4 flex items-end justify-around h-full">
               {boqData.slice(0, 5).map((b, i) => (
                 <div key={i} className="w-12 bg-green-500 text-white text-[10px] text-center pb-1 rounded-t" style={{ height: `${Math.random() * 80 + 20}%` }}>
                    {b.titleOfWork?.substring(0, 5)}
                 </div>
               ))}
               {boqData.length === 0 && <span className="text-gray-400">No Data</span>}
            </div>
          </div>

          {/* Financial Progress (Budget vs Cost Bar) */}
          <h3 className="text-center font-medium mt-6 mb-4 text-gray-700">Financial Progress</h3>
          <div className="h-48 border-b border-l border-gray-200 flex items-end justify-around px-4 pb-2">
            {boqData.slice(0, 6).map((b, i) => {
              const budgetHeight = (Number(b.budget) / maxFinancialValue) * 100;
              const costHeight = (Number(b.cost) / maxFinancialValue) * 100;
              return (
                <div key={i} className="flex flex-col items-center w-10 gap-1">
                  {/* Budget Bar (Blue) */}
                  <div className="w-full bg-blue-500 rounded-t relative" style={{ height: `${budgetHeight || 2}%` }}>
                    {Number(b.budget) > 0 && <span className="absolute -top-5 left-0 text-[9px] text-blue-600">{Number(b.budget).toLocaleString()}</span>}
                  </div>
                  {/* Cost Bar (Red) */}
                  <div className="w-1/2 bg-red-400 rounded-t" style={{ height: `${costHeight || 2}%` }}></div>
                  <span className="text-[10px] text-gray-500 truncate w-16 text-center">{b.titleOfWork}</span>
                </div>
              );
            })}
            {boqData.length === 0 && <span className="text-gray-400">No Data</span>}
          </div>
        </div>

        {/* Working Schedule & Unsold & Expenses */}
        <div className="space-y-6">
          
          {/* Working Schedule */}
          <div className="bg-white rounded-lg border p-4 shadow-sm">
            <h3 className="text-center font-medium mb-3 text-gray-700">Working Schedule</h3>
            <div className="h-32 flex flex-col justify-center text-sm overflow-y-auto">
              {boqData.length > 0 ? (
                boqData.slice(0, 4).map((task, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-1">
                    <span className="w-24 truncate text-[11px] text-gray-600">{task.titleOfWork}</span>
                    <div className="flex-1 bg-gray-100 h-4 rounded-sm relative">
                       <div className="absolute h-full bg-blue-400 rounded-sm" style={{ width: `${Math.random() * 80 + 10}%` }}></div>
                    </div>
                  </div>
                ))
              ) : (
                <span className="text-center text-gray-400">No schedule data</span>
              )}
            </div>
          </div>

          {/* Unsold Property */}
          <div className="bg-white rounded-lg border overflow-hidden shadow-sm">
            <div className="bg-red-500 text-white text-center py-2 text-sm font-medium">
              Unsold Property
            </div>
            <div className="p-2 text-sm max-h-32 overflow-y-auto">
              {unsoldProperties.length > 0 ? (
                <table className="w-full text-left">
                  <tbody>
                    {unsoldProperties.map((prop, idx) => (
                      <tr key={prop.uuid} className="border-b last:border-0">
                        <td className="py-1 text-gray-500">{idx + 1}</td>
                        <td className="py-1 text-indigo-600 font-medium">{prop.flatLandNo}</td>
                        <td className="py-1 text-gray-600">{prop.projectName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-4 text-gray-400 text-sm">No unsold property</div>
              )}
            </div>
            <div className="flex justify-end p-2 border-t">
              <button className="bg-indigo-600 text-white text-xs px-3 py-1 rounded hover:bg-indigo-700">More</button>
            </div>
          </div>

          {/* Most Expenses */}
          <div className="bg-white rounded-lg border overflow-hidden shadow-sm">
            <div className="bg-indigo-600 text-white px-4 py-2 text-xs font-medium flex justify-between">
              <span>ACCOUNTS DETAILS</span>
              <span>SUBTOTAL</span>
              <span>TOTAL</span>
            </div>
            <div className="p-3 text-sm">
              {expenses.map((exp, i) => (
                <div key={i} className="flex justify-between py-1 border-b last:border-0">
                  <span className="w-1/2 truncate text-gray-600">{exp.name}</span>
                  <span className="w-1/4 text-right text-gray-800">{exp.amount.toLocaleString()}</span>
                  <span className="w-1/4 text-right text-gray-500">-</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end p-2">
               <button className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded mr-2">Previous</button>
               <button className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================== SUMMARY CARD COMPONENT ======================
function SummaryCard({ title, value, icon, color, bgColor }: { title: string, value: number, icon: string, color: string, bgColor: string }) {
  return (
    <div className={`rounded-lg p-4 flex items-center gap-3 border bg-white shadow-sm`}>
      <div className={`p-3 rounded-full ${bgColor} ${color} text-xl`}>
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold text-gray-800">
          {value.toLocaleString()}
        </div>
        <div className="text-xs text-gray-500">{title}</div>
      </div>
    </div>
  );
}