import { Sparkles, Plus, PhoneCall, Upload, MessageSquare, UserPlus, ArrowRightLeft, Gift, Filter } from "lucide-react";

interface LeadHeaderProps {
  selectedCount: number;
  onOpenNewModal: () => void;
  onCallAssign: () => void;
  onBulkImport: () => void;
  onSendSms: () => void;
  onConvertCustomer: () => void;
  onTransfer: () => void;
  onWishSms: () => void;
  isFilterPanelOpen: boolean;
  setIsFilterPanelOpen: (val: boolean) => void;
}

export default function LeadHeader({
  selectedCount,
  onOpenNewModal,
  onCallAssign,
  onBulkImport,
  onSendSms,
  onConvertCustomer,
  onTransfer,
  onWishSms,
  isFilterPanelOpen,
  setIsFilterPanelOpen,
}: LeadHeaderProps) {
  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-border/85 bg-card/70 backdrop-blur-2xl p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Sparkles size={18} /> CRM Lead Management
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mt-1">
            Lead Directory
          </h1>
        </div>

        <div className="flex items-center gap-2.5 font-mono text-xs md:text-sm font-bold text-muted-foreground bg-muted/40 px-4 py-2.5 rounded-2xl border border-border/60 w-fit">
          <span>Selected Leads:</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-black text-sm md:text-base">{selectedCount}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border/60">
        <button
          type="button"
          onClick={onOpenNewModal}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-black rounded-xl transition flex items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
        >
          <Plus size={18} /> +New Lead
        </button>
<button
  type="button"
  onClick={onCallAssign}
  className="group px-4.5 py-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs md:text-sm font-extrabold rounded-xl transition flex items-center gap-2 active:scale-95 cursor-pointer"
>
  <PhoneCall size={16} className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 animate-bounce" /> 
  Call Assign
</button>

        <button
          type="button"
          onClick={onBulkImport}
          className="px-4.5 py-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs md:text-sm font-extrabold rounded-xl transition flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          <Upload size={16} /> Bulk Import
        </button>

        <button
          type="button"
          onClick={onSendSms}
          className="px-4.5 py-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs md:text-sm font-extrabold rounded-xl transition flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          <MessageSquare size={16} /> Send SMS
        </button>

        <button
          type="button"
          onClick={onConvertCustomer}
          className="px-4.5 py-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs md:text-sm font-extrabold rounded-xl transition flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          <UserPlus size={16} /> Convert To Customer
        </button>

        <button
          type="button"
          onClick={onTransfer}
          className="px-4.5 py-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs md:text-sm font-extrabold rounded-xl transition flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          <ArrowRightLeft size={16} /> Transfer
        </button>

        <button
          type="button"
          onClick={onWishSms}
          className="px-4.5 py-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs md:text-sm font-extrabold rounded-xl transition flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          <Gift size={16} /> Wish SMS
        </button>

        <button
          type="button"
          onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
          className={`px-4.5 py-3 text-xs md:text-sm font-extrabold rounded-xl transition flex items-center gap-2 active:scale-95 cursor-pointer ${
            isFilterPanelOpen 
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
              : "bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white"
          }`}
        >
          <Filter size={16} /> Filter
        </button>
      </div>
    </div>
  );
}