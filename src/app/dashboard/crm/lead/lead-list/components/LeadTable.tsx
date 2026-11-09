import { 
  Search, 
  CheckSquare, 
  Square, 
  MapPin, 
  Building, 
  Edit, 
  PhoneCall, 
  Trash2, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";

interface LeadTableProps {
  currentTableData: any[];
  selectedLeads: string[];
  handleSelectAll: () => void;
  handleSelectOne: (id: string) => void;
  handleOpenEditModal: (item: any) => void;
  handleOpenCallActivityPage: (item: any) => void;
  handleOpenDeleteModal: (item: any) => void;
  entriesPerPage: number;
  setEntriesPerPage: (val: number) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  currentPage: number;
  setCurrentPage: (val: number) => void;
  totalPages: number;
  totalEntries: number;
  indexOfFirstItem: number;
  indexOfLastItem: number;
  handlePageChange: (page: number) => void;
}

export default function LeadTable({
  currentTableData,
  selectedLeads,
  handleSelectAll,
  handleSelectOne,
  handleOpenEditModal,
  handleOpenCallActivityPage,
  handleOpenDeleteModal,
  entriesPerPage,
  setEntriesPerPage,
  searchQuery,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  totalPages,
  totalEntries,
  indexOfFirstItem,
  indexOfLastItem,
  handlePageChange,
}: LeadTableProps) {

  // Professional Pagination Helper
  const renderPaginationButtons = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="w-10 h-10 rounded-xl font-bold text-sm bg-background border border-border/80 hover:bg-indigo-50 dark:hover:bg-slate-800 text-foreground transition cursor-pointer"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="dots1" className="px-1 text-muted-foreground font-bold text-sm">
            ...
          </span>
        );
      }
    }

    for (let page = startPage; page <= endPage; page++) {
      const isActive = currentPage === page;
      pages.push(
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`w-10 h-10 rounded-xl font-extrabold text-sm transition cursor-pointer ${
            isActive
              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 scale-105"
              : "bg-background border border-border/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground"
          }`}
        >
          {page}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="dots2" className="px-1 text-muted-foreground font-bold text-sm">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="w-10 h-10 rounded-xl font-bold text-sm bg-background border border-border/80 hover:bg-indigo-50 dark:hover:bg-slate-800 text-foreground transition cursor-pointer"
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <>
      {/* Top Filter & Search Bar */}
      <div className="p-4 md:p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-extrabold text-muted-foreground">
          <span>Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border rounded-xl bg-background border-border text-foreground font-black text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>

        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search by Name, Mobile, or ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none bg-background border-border text-sm font-bold focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/80 text-white font-black uppercase text-xs tracking-wider bg-gradient-to-r from-indigo-600 to-violet-600">
                <th className="p-4 w-12 text-center">SL</th>
                <th className="p-4 w-12 text-center">
                  <button type="button" onClick={handleSelectAll} className="cursor-pointer">
                    {selectedLeads.length === currentTableData.length && currentTableData.length > 0 ? (
                      <CheckSquare size={18} />
                    ) : (
                      <Square size={18} className="text-white/70" />
                    )}
                  </button>
                </th>
                <th className="p-4 min-w-[300px]">NAME & DETAILS</th>
                <th className="p-4 font-black">MOBILE</th>
                <th className="p-4 font-black">SR / OFFICER</th>
                <th className="p-4 font-black">CR</th>
                <th className="p-4 min-w-[180px]">LAST ACTIVITY</th>
                <th className="p-4 min-w-[150px]">NEXT ACTIVITY</th>
                <th className="p-4 text-center font-black">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-semibold text-foreground text-sm">
              {currentTableData.length > 0 ? (
                currentTableData.map((item, index) => (
                  <tr 
                    key={item.id} 
                    onClick={() => handleOpenCallActivityPage(item)}
                    className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="p-4 font-mono font-bold text-center text-muted-foreground">
                      {indexOfFirstItem + index + 1}
                    </td>
                    
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => handleSelectOne(item.id)} className="cursor-pointer">
                        {selectedLeads.includes(item.id) ? (
                          <CheckSquare size={18} className="text-indigo-600" />
                        ) : (
                          <Square size={18} className="text-muted-foreground/60" />
                        )}
                      </button>
                    </td>

                    <td className="p-4 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                          ID: {item.leadId}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          {item.badge}
                        </span>
                      </div>

                      <div className="font-black text-base text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.name}
                      </div>

                      {item.address && (
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground font-medium">
                          <MapPin size={14} className="mt-0.5 shrink-0 text-indigo-500" />
                          <span>{item.address}</span>
                        </div>
                      )}

                      {item.organization && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <Building size={14} className="shrink-0 text-indigo-500" />
                          <span>{item.organization}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-4 font-mono font-black text-base text-foreground">+880{item.phone}</td>
                    <td className="p-4 font-bold text-muted-foreground">{item.srOfficer}</td>
                    <td className="p-4 font-bold text-muted-foreground">{item.cr}</td>
                    <td className="p-4 text-xs font-semibold text-muted-foreground whitespace-pre-line">{item.lastActivity || "—"}</td>
                    <td className="p-4 text-xs font-semibold text-muted-foreground whitespace-pre-line">{item.nextActivity || "—"}</td>

                    {/* Action Buttons */}
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200/80 dark:border-cyan-800/60 hover:bg-cyan-500 hover:text-white dark:hover:bg-cyan-500 dark:hover:text-white transition-all duration-200 active:scale-95 cursor-pointer"
                          title="Edit Lead"
                        >
                          <Edit size={16} />
                        </button>

                        {/* Call Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenCallActivityPage(item)}
                          title="Call Activity & Lead Log Page"
                          className="group/btn relative inline-flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full bg-indigo-50/90 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 shadow-sm hover:shadow-md hover:shadow-indigo-500/15 hover:bg-indigo-100/90 dark:hover:bg-indigo-900/60 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        >
                          <span className="relative flex w-8 h-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20">
                            <span className="absolute inset-0 rounded-full bg-indigo-500/40 animate-ping [animation-duration:2s] motion-reduce:animate-none pointer-events-none" />
                            <PhoneCall
                              size={15}
                              className="relative text-white transition-transform duration-300 group-hover/btn:rotate-12 group-hover/btn:scale-110"
                            />
                          </span>

                          <span className="text-xs md:text-sm font-extrabold tracking-wide whitespace-nowrap">
                            Call
                          </span>

                          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 pointer-events-none" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(item)}
                          className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white dark:text-rose-400 dark:hover:text-white border border-rose-500/20 transition-all duration-200 active:scale-95 cursor-pointer"
                          title="Delete Lead"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground font-bold">
                    No leads found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modern Pagination Footer */}
        <div className="p-4 md:p-5 border-t border-border/80 bg-card/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-bold text-muted-foreground">
          <div>
            Showing <span className="text-foreground font-black">{totalEntries > 0 ? indexOfFirstItem + 1 : 0}</span> to{" "}
            <span className="text-foreground font-black">{Math.min(indexOfLastItem, totalEntries)}</span> of{" "}
            <span className="text-foreground font-black">{totalEntries}</span> entries
          </div>

          <div className="flex items-center gap-2">
            {/* Previous Page Button */}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3.5 py-2 rounded-xl border border-border/80 bg-background hover:bg-indigo-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5 text-foreground cursor-pointer font-extrabold text-xs md:text-sm"
            >
              <ChevronLeft size={18} />
              <span>Previous</span>
            </button>

            {/* Dynamic Page Numbers */}
            <div className="flex items-center gap-1">
              {renderPaginationButtons()}
            </div>

            {/* Next Page Button */}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3.5 py-2 rounded-xl border border-border/80 bg-background hover:bg-indigo-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5 text-foreground cursor-pointer font-extrabold text-xs md:text-sm"
            >
              <span>Next</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}