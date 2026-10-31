"use client";

import {
  CreditCard,
  FileText,
  CheckCircle2,
  ShoppingCart,
  TrendingDown,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconClass: string;
  valueClass?: string;
}

function StatCard({
  title,
  value,
  icon,
  iconClass,
  valueClass = "text-slate-900",
}: StatCardProps) {
  return (
    <div className="flex h-[74px] items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
    
      <div
        className={`flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-lg ${iconClass}`}
      >
        {icon}
      </div>

      <div>
        <div className={`text-[18px] font-bold ${valueClass}`}>
          {value}
        </div>

        <div className="mt-0.5 text-[10px] font-semibold tracking-wide text-slate-400">
          {title}
        </div>
      </div>

    </div>
  );
}


export default function RifatDashboardPage() {
  return (
    <div className="p-5">

      {/* =================================================
          STAT CARDS
      ================================================== */}

      <div className="grid grid-cols-5 gap-4">

        <StatCard
          title="BUDGET"
          value="15,000,000"
          icon={<CreditCard size={20} />}
          iconClass="bg-emerald-500 text-white"
        />
     
        <StatCard
          title="COST"
          value="65,538"
          icon={<FileText size={20} />}
          iconClass="bg-violet-600 text-white"
        />

        <StatCard
          title="AVAILABLE"
          value="14,934,462"
          valueClass="text-emerald-600"
          icon={<CheckCircle2 size={21} />}
          iconClass="bg-emerald-500 text-white"
        />

        <StatCard
          title="SALES/REVENUE"
          value="0"
          icon={<ShoppingCart size={20} />}
          iconClass="bg-sky-500 text-white"
        />

        <StatCard
          title="PROFIT/LOSS"
          value="-65,538"
          valueClass="text-red-500"
          icon={<TrendingDown size={20} />}
          iconClass="bg-orange-500 text-white"
        />

      </div>


      {/* =================================================
          DASHBOARD BODY
      ================================================== */}

      <div className="mt-5 grid grid-cols-[1.7fr_1fr] gap-5">


        {/* ===============================================
            FINANCIAL PROGRESS
        ================================================ */}

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="flex h-[55px] items-center justify-center border-b border-slate-100">
            <h2 className="text-[13px] font-bold">
              Working Progress
            </h2>
          </div>

          <div className="relative h-[480px] p-8">

            <div className="text-center text-[12px] font-semibold text-blue-900">
              FINANCIAL PROGRESS
            </div>


            {/* Chart */}
            <div className="absolute bottom-10 left-20 right-8 top-28">

              {/* Y axis */}
              <div className="absolute bottom-0 left-0 top-0 flex flex-col justify-between text-[10px] text-slate-500">
                <span>5</span>
                <span>4</span>
                <span>3</span>
                <span>2</span>
                <span>1</span>
                <span>0</span>
              </div>


              {/* Grid */}
              <div className="absolute bottom-0 left-5 right-0 top-0">

                {[0, 1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={item}
                    className="absolute left-0 right-0 border-t border-dashed border-slate-200"
                    style={{
                      top: `${item * 20}%`,
                    }}
                  />
                ))}


                {/* X Axis */}
                <div className="absolute bottom-0 left-0 right-0 border-b border-slate-300" />

                <div className="absolute -bottom-5 left-0 right-0 flex justify-between text-[10px] text-slate-500">
                  <span>0</span>
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>

              </div>

            </div>

          </div>

        </div>


        {/* ===============================================
            RIGHT SIDE
        ================================================ */}

        <div className="space-y-5">


          {/* Unsold Property */}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="flex h-[42px] items-center justify-center bg-[#f5223b] text-[11px] font-bold text-white">
              UNSOLD PROPERTY
            </div>

            <div className="h-[220px]" />

            <div className="flex justify-end border-t border-slate-100 p-3">

              <button className="rounded-lg bg-[#5542ed] px-5 py-2 text-[11px] font-semibold text-white">
                More
              </button>

            </div>

          </div>


          {/* Most Expenses */}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="px-4 py-3 text-[13px] font-bold">
              Most Expenses
            </div>


            <table className="w-full text-[11px]">

              <thead>

                <tr className="bg-[#6259f5] text-white">

                  <th className="px-4 py-3 text-left">
                    ACCOUNTS DETAILS
                  </th>

                  <th className="px-4 py-3 text-right">
                    SUBTOTAL
                  </th>

                  <th className="px-4 py-3 text-right">
                    TOTAL
                  </th>

                </tr>

              </thead>


              <tbody>

                <tr className="border-b border-slate-100">

                  <td className="px-4 py-3">
                    Bricks Consumption
                  </td>

                  <td className="px-4 py-3 text-right">
                    45,000.00
                  </td>

                  <td className="px-4 py-3 text-right">
                    -
                  </td>

                </tr>


                <tr className="border-b border-slate-100">

                  <td className="px-4 py-3">
                    Rod Consumption
                  </td>

                  <td className="px-4 py-3 text-right">
                    17,760.00
                  </td>

                  <td className="px-4 py-3 text-right">
                    -
                  </td>

                </tr>


                <tr className="border-b border-slate-100">

                  <td className="px-4 py-3">
                    Sand Consumption
                  </td>

                  <td className="px-4 py-3 text-right">
                    1,602.00
                  </td>

                  <td className="px-4 py-3 text-right">
                    -
                  </td>

                </tr>


                <tr>

                  <td className="px-4 py-3 font-semibold">
                    Total Expense (-)
                  </td>

                  <td className="px-4 py-3 text-right font-semibold">
                    64,362.00
                  </td>

                  <td className="px-4 py-3 text-right">
                    -
                  </td>

                </tr>

              </tbody>

            </table>


            {/* Pagination */}

            <div className="flex items-center justify-end gap-1 border-t border-slate-100 p-3">

              <button className="rounded bg-slate-100 px-3 py-1.5 text-[10px] text-slate-400">
                Previous
              </button>

              <button className="rounded bg-[#5542ed] px-3 py-1.5 text-[10px] text-white">
                1
              </button>

              <button className="rounded bg-slate-100 px-3 py-1.5 text-[10px]">
                Next
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
