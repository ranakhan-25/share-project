"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Phone,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { crmLeadApi } from "@/services/crmLeadApi";

interface TransferLeadRecord {
  id: string;
  leadCode: string;
  name: string;
  mobile: string;
  from: string;
  to: string;
  date: string;
  lastActivity?: string;
}

const mockTransferLeads: TransferLeadRecord[] = [
  { id: "1", leadCode: "L261008-117", name: "Gazi Nasir", mobile: "1711921550", from: "Admin", to: "Rowza", date: "14-10-2026", lastActivity: "" },
  { id: "2", leadCode: "L261008-116", name: "Mostakim", mobile: "1722519606", from: "Admin", to: "Rowza", date: "14-10-2026", lastActivity: "" },
];

export default function TransferLeadListPage() {
  const [transferLeads, setTransferLeads] = useState<TransferLeadRecord[]>([]);
  useEffect(() => {
    void crmLeadApi.listAllTransfers().then((result) => setTransferLeads(result.data.map((row: any) => ({
      id: row.uuid, leadCode: row.leadCode ?? "", name: row.name ?? "", mobile: row.mobile ?? "",
      from: row.sourceUser?.name ?? row.from ?? "", to: row.targetUser?.name ?? row.to ?? "",
      date: row.date ?? row.transferDate ?? "", lastActivity: row.lastActivity?.summary ?? row.lastActivity ?? "",
    })))).catch((error) => { console.error("Failed to load transfer history", error); setTransferLeads([]); });
  }, []);

  const [selectedDateRange, setSelectedDateRange] = useState("September 23, 2026 - October 22, 2026");
  const [selectedFrom, setSelectedFrom] = useState("");
  const [selectedTo, setSelectedTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter Logic
  const filteredData = transferLeads.filter((item) => {
    const search = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search) ||
      item.mobile.includes(search) ||
      item.leadCode.toLowerCase().includes(search);

    const matchesFrom = !selectedFrom || item.from.toLowerCase() === selectedFrom.toLowerCase();
    const matchesTo = !selectedTo || item.to.toLowerCase() === selectedTo.toLowerCase();

    return matchesSearch && matchesFrom && matchesTo;
  });

  const totalEntries = filteredData.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const currentTableData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const renderPaginationButtons = () => {
    const pages = [];
    for (let page = 1; page <= totalPages; page++) {
      const isActive = currentPage === page;
      pages.push(
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`w-9 h-9 rounded-xl font-extrabold text-xs transition cursor-pointer ${
            isActive
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-background border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground"
          }`}
        >
          {page}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="w-full space-y-6 p-4 md:p-6 bg-slate-50/50 dark:bg-background min-h-screen text-foreground font-sans animate-in fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          <Sparkles size={18} className="animate-pulse" /> Call Center Management
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
          Transfer Lead List
        </h1>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 md:p-5 rounded-2xl border border-border bg-card shadow-xs">
        <div>
          <label className="block font-bold text-muted-foreground mb-1.5 text-xs">Select Date</label>
          <input
            type="text"
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border text-sm font-semibold"
          />
        </div>

        <div>
          <label className="block font-bold text-muted-foreground mb-1.5 text-xs">From</label>
          <select
            value={selectedFrom}
            onChange={(e) => {
              setSelectedFrom(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border text-sm font-extrabold cursor-pointer"
          >
            <option value="">Select One Option</option>
            <option value="Admin">Admin</option>
            <option value="Mohin">Mohin</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-muted-foreground mb-1.5 text-xs">To</label>
          <select
            value={selectedTo}
            onChange={(e) => {
              setSelectedTo(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border text-sm font-extrabold cursor-pointer"
          >
            <option value="">Select One Option</option>
            <option value="Rowza">Rowza</option>
            <option value="Sarna11">Sarna11</option>
          </select>
        </div>
      </div>

      {/* SEARCH */}
      <div className="p-4 md:p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-extrabold text-muted-foreground">
          <span>Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border rounded-xl bg-background border-border text-foreground font-black text-sm cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search name, phone, lead ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none bg-background border-border text-sm font-bold"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-white font-black uppercase text-xs tracking-wider bg-gradient-to-r from-indigo-600 to-violet-600">
                <th className="py-5 px-4 w-12 text-center">SL</th>
                <th className="py-5 px-4 min-w-[140px]">ID</th>
                <th className="py-5 px-4 min-w-[200px]">NAME</th>
                <th className="py-5 px-4 min-w-[140px]">MOBILE</th>
                <th className="py-5 px-4 min-w-[120px]">FROM</th>
                <th className="py-5 px-4 min-w-[120px]">TO</th>
                <th className="py-5 px-4 min-w-[130px]">DATE</th>
                <th className="py-5 px-4 min-w-[160px]">LAST ACTIVITY</th>
                <th className="py-5 px-4 text-center min-w-[120px]">ACTION</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border font-semibold text-foreground text-sm">
              {currentTableData.length > 0 ? (
                currentTableData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-5 px-4 font-mono font-bold text-center text-muted-foreground">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="py-5 px-4 font-mono font-black text-indigo-600 dark:text-indigo-400">{item.leadCode}</td>
                    <td className="py-5 px-4 font-extrabold text-base">{item.name}</td>
                    <td className="py-5 px-4 font-mono font-black">+880{item.mobile}</td>
                    <td className="py-5 px-4">
                      <span className="px-3 py-1.5 rounded-full text-xs font-black uppercase border bg-amber-500/10 text-amber-600 border-amber-500/20">
                        {item.from}
                      </span>
                    </td>
                    <td className="py-5 px-4">
                      <span className="px-3 py-1.5 rounded-full text-xs font-black uppercase border bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
                        {item.to}
                      </span>
                    </td>
                    <td className="py-5 px-4 font-mono font-bold text-muted-foreground">{item.date}</td>
                    <td className="py-5 px-4 font-medium text-muted-foreground">{item.lastActivity || "—"}</td>
                    <td className="py-5 px-4 text-center">
                      <a
                        href={`tel:+880${item.mobile}`}
                        className="inline-flex items-center justify-center p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer shadow-md"
                        title="Call Direct"
                      >
                        <Phone size={16} />
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground font-bold text-sm">
                    No transfer leads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="p-4 md:p-5 border-t border-border bg-card/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-bold text-muted-foreground">
          <div>
            Showing <span className="text-foreground font-black">{totalEntries > 0 ? indexOfFirstItem + 1 : 0}</span> to{" "}
            <span className="text-foreground font-black">{Math.min(indexOfLastItem, totalEntries)}</span> of{" "}
            <span className="text-foreground font-black">{totalEntries}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-indigo-50 dark:hover:bg-slate-800 disabled:opacity-40 transition flex items-center gap-1.5 text-foreground cursor-pointer"
            >
              <ChevronLeft size={18} />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-1">
              {renderPaginationButtons()}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-indigo-50 dark:hover:bg-slate-800 disabled:opacity-40 transition flex items-center gap-1.5 text-foreground cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
