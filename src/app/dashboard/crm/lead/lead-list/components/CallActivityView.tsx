import { 
  ChevronLeft, 
  CheckCircle2, 
  MessageCircle, 
  Phone, 
  MessageSquare, 
  Paperclip, 
  ChevronDown,
  User,
  Calendar,
  Tag,
  Building2,
  Clock,
  Sparkles,
  Save,
  Check,
  Activity,
  Layers,
  FileSpreadsheet,
  XCircle,
  FileText
} from "lucide-react";
import type { ReactNode } from "react";

interface CallActivityViewProps {
  activeLead: any;
  setActiveLead: (lead: any) => void;
  setIsCallActivityPageOpen: (val: boolean) => void;
  handleSaveCallPageChanges: () => void;
  isJunk: boolean;
  setIsJunk: (val: boolean) => void;
  fileInputRef: any;
  attachmentInputRef: any;
  handleImageUpload: (e: any) => void;
  handleAttachmentUpload: (e: any) => void;
  setIsSmsOpen: (val: boolean) => void;
  tabs: any[];
  activeTab: string;
  setActiveTab: (val: string) => void;
  handleMarkAsSold: () => void;
  currentActivity: string;
  setCurrentActivity: (val: string) => void;
  followupStatus: string;
  setFollowupStatus: (val: string) => void;
  followupComment: string;
  setFollowupComment: (val: string) => void;
  nextActivityType: string;
  setNextActivityType: (val: string) => void;
  nextFollowupDate: string;
  setNextFollowupDate: (val: string) => void;
  nextFollowupNote: string;
  setNextFollowupNote: (val: string) => void;
  reqPrice: string;
  setReqPrice: (val: string) => void;
  reqSize: string;
  setReqSize: (val: string) => void;
  reqArea: string;
  setReqArea: (val: string) => void;
  reqType: string;
  setReqType: (val: string) => void;
  reqDesc: string;
  setReqDesc: (val: string) => void;
  propProject: string;
  setPropProject: (val: string) => void;
  noteInput: string;
  setNoteInput: (val: string) => void;
  detailTabs?: Record<string, any[]>;
}

/* ---------- Balanced Professional Tokens ---------- */
const card =
  "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm";
const accentCard = `${card} border-l-4 border-l-indigo-600`;

const field =
  "w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm md:text-base font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none transition focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20";
const fieldReadOnly =
  "w-full px-4 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-sm md:text-base font-semibold text-slate-500 outline-none cursor-not-allowed";
const label = "block mb-1.5 text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300";

const heroGhostBtn =
  "px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs md:text-sm font-bold backdrop-blur transition active:scale-95 inline-flex items-center gap-2 cursor-pointer";
const btnSolid =
  "px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs md:text-sm font-extrabold shadow-md shadow-indigo-600/20 transition active:scale-95 inline-flex items-center justify-center gap-2 cursor-pointer";
const btnMuted =
  "px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs md:text-sm font-bold transition cursor-pointer";

const thead = "bg-gradient-to-r from-indigo-600 to-violet-600 text-white";
const th = "px-4 py-3.5 text-xs md:text-sm font-bold whitespace-nowrap uppercase tracking-wider";
const tbody = "divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200";
const td = "px-4 py-3.5 text-xs md:text-sm font-medium";
const tableWrap = `${card} overflow-x-auto`;

const toggleWrap = "inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700";
const toggleItem = (active: boolean) =>
  `px-4 md:px-5 py-2 rounded-lg text-xs md:text-sm font-bold cursor-pointer select-none transition-all duration-200 ${
    active
      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-[1.02]"
      : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
  }`;

const addonGroup =
  "flex items-stretch rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 overflow-hidden transition focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-indigo-600";
const addonLabel =
  "px-4 flex items-center bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs md:text-sm font-extrabold whitespace-nowrap border-r border-slate-200 dark:border-slate-800";
const addonInput =
  "w-full px-3.5 py-2.5 outline-none bg-transparent text-sm md:text-base font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400";

const cardTitle = "font-extrabold text-sm md:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2";

/* ---------- Layout Helpers ---------- */
function InfoGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs md:text-sm font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 uppercase tracking-wide">
        <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-indigo-600 to-violet-500" />
        <span>{title}</span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </p>
      {children}
    </div>
  );
}

function Step({ icon, last, children }: { icon: ReactNode; last?: boolean; children: ReactNode }) {
  return (
    <div className="flex gap-3.5 md:gap-4">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-600 text-white shadow-md flex items-center justify-center">
          {icon}
        </div>
        {!last && (
          <div className="w-0.5 flex-1 mt-1 rounded-full bg-slate-200 dark:bg-slate-800" />
        )}
      </div>
      <div className={`flex-1 min-w-0 ${last ? "" : "pb-4 md:pb-5"}`}>{children}</div>
    </div>
  );
}

function EmptyRow({ colSpan, icon, text }: { colSpan: number; icon: ReactNode; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        <div className="flex flex-col items-center gap-2.5 text-slate-400 dark:text-slate-500">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center">
            {icon}
          </div>
          <span className="text-xs md:text-sm font-semibold">{text}</span>
        </div>
      </td>
    </tr>
  );
}

export default function CallActivityView({
  activeLead,
  setActiveLead,
  setIsCallActivityPageOpen,
  handleSaveCallPageChanges,
  isJunk,
  setIsJunk,
  fileInputRef,
  attachmentInputRef,
  handleImageUpload,
  handleAttachmentUpload,
  setIsSmsOpen,
  tabs,
  activeTab,
  setActiveTab,
  handleMarkAsSold,
  currentActivity,
  setCurrentActivity,
  followupStatus,
  setFollowupStatus,
  followupComment,
  setFollowupComment,
  nextActivityType,
  setNextActivityType,
  nextFollowupDate,
  setNextFollowupDate,
  nextFollowupNote,
  setNextFollowupNote,
  reqPrice,
  setReqPrice,
  reqSize,
  setReqSize,
  reqArea,
  setReqArea,
  reqType,
  setReqType,
  reqDesc,
  setReqDesc,
  propProject,
  setPropProject,
  noteInput,
  setNoteInput,
  detailTabs = {},
}: CallActivityViewProps) {

  const handleStopNextActivity = () => {
    setNextFollowupDate("");
    setNextFollowupNote("");
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/80 dark:bg-slate-950 px-2 sm:px-3 md:px-4 py-5 text-slate-800 dark:text-slate-100 font-sans antialiased text-xs md:text-sm">
      <div className="w-full space-y-6">

        {/* ===== Profile Hero Banner ===== */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 text-white shadow-lg">
          <div className="relative p-5 md:p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <button onClick={() => setIsCallActivityPageOpen(false)} className={heroGhostBtn}>
                <ChevronLeft size={18} /> Back
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCallActivityPageOpen(false)}
                  className={heroGhostBtn}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveCallPageChanges}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 text-xs md:text-sm font-extrabold shadow-md transition active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Save size={18} /> Save Changes
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div className="relative group w-24 h-24 shrink-0">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full rounded-2xl bg-white/15 backdrop-blur text-white font-black text-3xl flex items-center justify-center cursor-pointer overflow-hidden ring-2 ring-white/50 group-hover:ring-white transition"
                >
                  {activeLead.avatarUrl ? (
                    <img src={activeLead.avatarUrl} alt={activeLead.name} className="w-full h-full object-cover" />
                  ) : (
                    activeLead.name.substring(0, 2).toUpperCase()
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl md:text-4xl font-black tracking-tight">
                      {activeLead.name}
                    </h1>
                    <CheckCircle2 size={24} className="text-emerald-300" />
                  </div>

                  <span className={`px-3 py-1 rounded-full font-bold text-xs md:text-sm backdrop-blur ${
                    isJunk 
                      ? "bg-rose-500/90 text-white" 
                      : "bg-white/20 text-white"
                  }`}>
                    {isJunk ? "JUNK" : activeLead.badge}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-mono">
                  <span className="px-3 py-1 rounded-lg bg-black/20 text-indigo-100">
                    Lead ID: <span className="font-bold text-white">{activeLead.leadId}</span>
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-black/20 text-indigo-100">
                    Added By: <span className="font-bold text-white">{activeLead.srOfficer}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <a
                href={`https://wa.me/880${activeLead.phone}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur font-bold transition text-xs md:text-sm"
              >
                <span className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <MessageCircle size={18} />
                </span>
                <span>WhatsApp</span>
              </a>

              <a
                href={`tel:+880${activeLead.phone}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur font-bold transition text-xs md:text-sm"
              >
                <span className="w-8 h-8 rounded-lg bg-white text-indigo-600 flex items-center justify-center shadow-xs">
                  <Phone size={18} />
                </span>
                <span>Call</span>
              </a>

              <button
                type="button"
                onClick={() => setIsSmsOpen(true)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur font-bold transition cursor-pointer text-left text-xs md:text-sm"
              >
                <span className="w-8 h-8 rounded-lg bg-amber-400 text-white flex items-center justify-center shadow-xs">
                  <MessageSquare size={18} />
                </span>
                <span>SMS</span>
              </button>

              <input
                type="file"
                ref={attachmentInputRef}
                onChange={handleAttachmentUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => attachmentInputRef.current?.click()}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur font-bold transition cursor-pointer text-left text-xs md:text-sm"
              >
                <span className="w-8 h-8 rounded-lg bg-violet-400 text-white flex items-center justify-center shadow-xs">
                  <Paperclip size={18} />
                </span>
                <span>Attach</span>
              </button>
            </div>
          </div>
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ===== Left Column - Lead Information ===== */}
          <div className="lg:col-span-4 lg:sticky lg:top-6">
            <div className={`${card} p-5 space-y-5`}>
              <h3 className="font-black text-base md:text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <User size={20} className="text-indigo-600" /> Lead Information
              </h3>

              <InfoGroup title="Contact">
                <div>
                  <label className={label}>Name</label>
                  <input
                    type="text"
                    value={activeLead.name}
                    onChange={(e) => setActiveLead({ ...activeLead, name: e.target.value })}
                    className={field}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Phone</label>
                    <input
                      type="text"
                      value={`+880${activeLead.phone}`}
                      onChange={(e) => setActiveLead({ ...activeLead, phone: e.target.value.replace("+880", "") })}
                      className={`${field} font-mono`}
                    />
                  </div>
                  <div>
                    <label className={label}>Email</label>
                    <input
                      type="email"
                      value={activeLead.email || ""}
                      placeholder="Email"
                      onChange={(e) => setActiveLead({ ...activeLead, email: e.target.value })}
                      className={field}
                    />
                  </div>
                </div>
                <div>
                  <label className={label}>Address</label>
                  <textarea
                    rows={2}
                    value={activeLead.address || ""}
                    onChange={(e) => setActiveLead({ ...activeLead, address: e.target.value })}
                    className={`${field} resize-none`}
                  />
                </div>
              </InfoGroup>

              <InfoGroup title="Work">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Organization</label>
                    <input
                      type="text"
                      value={activeLead.organization || ""}
                      onChange={(e) => setActiveLead({ ...activeLead, organization: e.target.value })}
                      className={field}
                    />
                  </div>
                  <div>
                    <label className={label}>Designation</label>
                    <input
                      type="text"
                      value={activeLead.designation || ""}
                      onChange={(e) => setActiveLead({ ...activeLead, designation: e.target.value })}
                      className={field}
                    />
                  </div>
                </div>
                <div>
                  <label className={label}>Profession</label>
                  <select
                    value={activeLead.profession || "Engineer"}
                    onChange={(e) => setActiveLead({ ...activeLead, profession: e.target.value })}
                    className={field}
                  >
                    <option value="Engineer">Engineer</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Business">Business</option>
                  </select>
                </div>
              </InfoGroup>

              <InfoGroup title="Interest">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Category</label>
                    <select
                      value={activeLead.leadCategory || "Ready Flat"}
                      onChange={(e) => setActiveLead({ ...activeLead, leadCategory: e.target.value })}
                      className={field}
                    >
                      <option value="Ready Flat">Ready Flat</option>
                      <option value="Ongoing">Ongoing</option>
                    </select>
                  </div>
                  <div>
                    <label className={label}>Source</label>
                    <input
                      type="text"
                      value={activeLead.leadSource || ""}
                      onChange={(e) => setActiveLead({ ...activeLead, leadSource: e.target.value })}
                      className={field}
                    />
                  </div>
                </div>
                <div>
                  <label className={label}>Project</label>
                  <select
                    value={activeLead.interestedProject || "Mustain Villa"}
                    onChange={(e) => setActiveLead({ ...activeLead, interestedProject: e.target.value })}
                    className={field}
                  >
                    <option value="Mustain Villa">Mustain Villa</option>
                    <option value="Royal City">Royal City</option>
                  </select>
                </div>
              </InfoGroup>

              <InfoGroup title="Assignment">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>CR</label>
                    <select
                      value={activeLead.cr || "Select CR"}
                      onChange={(e) => setActiveLead({ ...activeLead, cr: e.target.value })}
                      className={field}
                    >
                      <option value="Select CR">Select CR</option>
                      <option value="Tazmul Reza">Tazmul Reza</option>
                    </select>
                  </div>
                  <div>
                    <label className={label}>SR</label>
                    <input
                      type="text"
                      value={activeLead.srOfficer}
                      readOnly
                      className={fieldReadOnly}
                    />
                  </div>
                </div>
                <div>
                  <label className={label}>Remark</label>
                  <textarea
                    rows={2}
                    value={activeLead.remark || ""}
                    onChange={(e) => setActiveLead({ ...activeLead, remark: e.target.value })}
                    className={`${field} resize-none`}
                  />
                </div>
              </InfoGroup>
            </div>
          </div>

          {/* ===== Right Column - Dynamic Tabs & Professional Next Activity Controls ===== */}
          <div className="lg:col-span-8 space-y-5 min-w-0">
            
            {/* Top Navigation Tabs */}
            <div className={`${card} p-2 flex gap-2 overflow-x-auto`}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.name;
                return (
                  <button
                    key={tab.name}
                    type="button"
                    onClick={() => setActiveTab(tab.name)}
                    className={`flex-1 min-w-fit px-4 py-2.5 rounded-xl text-xs md:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-[1.01]"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{tab.name}</span>
                    {tab.count !== null && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          isActive
                            ? "bg-white text-indigo-700"
                            : "bg-rose-500 text-white"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Upcoming/Pending */}
            {activeTab === "Upcoming/Pending" && (
              <div className="space-y-4 animate-in fade-in">
                
                {/* Lead Stage */}
                <Step icon={<Tag size={20} />}>
                  <div className={`${accentCard} p-4 md:p-5 space-y-3`}>
                    <h4 className={cardTitle}>Lead Stage</h4>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="flex-1">
                        <select
                          value={activeLead.badge}
                          onChange={(e) => setActiveLead({ ...activeLead, badge: e.target.value })}
                          className={`${field} !text-indigo-600 dark:!text-indigo-400 font-extrabold`}
                        >
                          <option value="New Assignment">New Assignment</option>
                          <option value="Priority">Priority</option>
                          <option value="Prospect">Prospect</option>
                        </select>
                      </div>

                      <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isJunk}
                          onChange={(e) => setIsJunk(e.target.checked)}
                          className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                        />
                        <span>Move to junk</span>
                      </label>

                      <button
                        type="button"
                        onClick={handleMarkAsSold}
                        className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold transition active:scale-95 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Check size={18} />
                        <span>Mark as Sold</span>
                      </button>
                    </div>
                  </div>
                </Step>

                {/* Current Activity Toggle */}
                <Step icon={<Activity size={20} />}>
                  <div className={`${accentCard} p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                    <h4 className={cardTitle}>Current Activity:</h4>

                    <div className={toggleWrap}>
                      <button
                        type="button"
                        onClick={() => setCurrentActivity("Followup")}
                        className={toggleItem(currentActivity === "Followup")}
                      >
                        Followup
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentActivity("Task/Visit")}
                        className={toggleItem(currentActivity === "Task/Visit")}
                      >
                        Task/Visit
                      </button>
                    </div>
                  </div>
                </Step>

                {/* Dynamic Form: Followup or Task/Visit */}
                <Step icon={<Sparkles size={20} />}>
                  <div className={`${accentCard} p-4 md:p-5 space-y-3.5`}>
                    <h4 className={cardTitle}>
                      {currentActivity === "Followup" ? "Add Followup" : "Task / Visit Details"}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={label}>
                          {currentActivity === "Followup" ? "Status" : "Task / Visit Type"} <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={followupStatus}
                          onChange={(e) => setFollowupStatus(e.target.value)}
                          className={field}
                        >
                          <option value="">{currentActivity === "Followup" ? "Select Communication" : "Select Task/Visit Type"}</option>
                          {currentActivity === "Followup" ? (
                            <>
                              <option value="Call Connected">Call Connected</option>
                              <option value="Follow Up">Follow Up</option>
                              <option value="No Answer">No Answer</option>
                            </>
                          ) : (
                            <>
                              <option value="Site Visit">Site Visit</option>
                              <option value="Office Meeting">Office Meeting</option>
                              <option value="Document Delivery">Document Delivery</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className={label}>
                          Comment / Note <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={followupComment}
                          onChange={(e) => setFollowupComment(e.target.value)}
                          placeholder="Enter comment..."
                          className={`${field} resize-none`}
                        />
                      </div>
                    </div>
                  </div>
                </Step>

                {/* Property & Pricing Accordion */}
                <Step icon={<Building2 size={20} />}>
                  <div className={`${accentCard} px-4 md:px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition`}>
                    <span className={cardTitle}>
                      Property & Pricing
                    </span>
                    <ChevronDown size={20} className="text-slate-400" />
                  </div>
                </Step>

                {/* Next Activity Section */}
                <Step icon={<Clock size={20} />}>
                  <div className={`${accentCard} p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                    <h4 className={cardTitle}>Next Activity:</h4>

                    <div className="flex items-center gap-3">
                      <div className={toggleWrap}>
                        <button
                          type="button"
                          onClick={() => setNextActivityType("Followup")}
                          className={toggleItem(nextActivityType === "Followup")}
                        >
                          Followup
                        </button>
                        <button
                          type="button"
                          onClick={() => setNextActivityType("Task/Visit")}
                          className={toggleItem(nextActivityType === "Task/Visit")}
                        >
                          Task/Visit
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleStopNextActivity}
                        className="px-3.5 py-2 text-xs md:text-sm font-bold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                      >
                        <XCircle size={16} />
                        <span>Stop Followup/Visit</span>
                      </button>
                    </div>
                  </div>
                </Step>

                {/* Next Followup Details Section */}
                <Step icon={<Calendar size={20} />} last>
                  <div className={`${accentCard} p-4 md:p-5 space-y-3.5`}>
                    <h4 className={cardTitle}>
                      Next {nextActivityType === "Task/Visit" ? "Task / Visit" : "Followup"} Details
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className={label}>Date</label>
                        <input
                          type="datetime-local"
                          value={nextFollowupDate}
                          onChange={(e) => setNextFollowupDate(e.target.value)}
                          className={`${field} font-mono`}
                        />
                      </div>

                      <div>
                        <label className={label}>Assigned SR</label>
                        <input
                          type="text"
                          value={activeLead.srOfficer}
                          readOnly
                          className={fieldReadOnly}
                        />
                      </div>

                      <div>
                        <label className={label}>Note</label>
                        <input
                          type="text"
                          value={nextFollowupNote}
                          onChange={(e) => setNextFollowupNote(e.target.value)}
                          placeholder="Enter note..."
                          className={field}
                        />
                      </div>
                    </div>
                  </div>
                </Step>

                {/* Bottom Save & Close Buttons */}
                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsCallActivityPageOpen(false)}
                    className={btnMuted}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCallPageChanges}
                    className={btnSolid}
                  >
                    <Save size={18} /> Save Changes
                  </button>
                </div>

              </div>
            )}

            {/* Tab 2: Requirements */}
            {activeTab === "Requirements" && (
              <div className="space-y-4 animate-in fade-in">
                <div className={`${card} p-4 md:p-5 space-y-4`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className={addonGroup}>
                      <span className={addonLabel}>Price</span>
                      <input
                        type="text"
                        placeholder="Select Range"
                        value={reqPrice}
                        onChange={(e) => setReqPrice(e.target.value)}
                        className={addonInput}
                      />
                    </div>

                    <div className={addonGroup}>
                      <span className={addonLabel}>Size</span>
                      <input
                        type="text"
                        placeholder="Size"
                        value={reqSize}
                        onChange={(e) => setReqSize(e.target.value)}
                        className={addonInput}
                      />
                    </div>

                    <div className={addonGroup}>
                      <span className={addonLabel}>Area</span>
                      <input
                        type="text"
                        placeholder="Select User"
                        value={reqArea}
                        onChange={(e) => setReqArea(e.target.value)}
                        className={addonInput}
                      />
                    </div>

                    <div className={addonGroup}>
                      <span className={addonLabel}>Type</span>
                      <input
                        type="text"
                        placeholder="Select Type"
                        value={reqType}
                        onChange={(e) => setReqType(e.target.value)}
                        className={addonInput}
                      />
                    </div>
                  </div>

                  <div className={addonGroup}>
                    <span className={addonLabel}>Description</span>
                    <textarea
                      rows={2}
                      value={reqDesc}
                      onChange={(e) => setReqDesc(e.target.value)}
                      className={`${addonInput} resize-none`}
                    />
                  </div>
                </div>

                <div className={tableWrap}>
                  <table className="w-full text-left">
                    <thead className={thead}>
                      <tr>
                        <th className={th}>PRICE</th>
                        <th className={th}>DESCRIPTION</th>
                        <th className={th}>SIZE</th>
                        <th className={th}>AREA</th>
                        <th className={th}>TYPE</th>
                      </tr>
                    </thead>
                    <tbody className={tbody}>
                      {(detailTabs.requirements ?? []).length ? (detailTabs.requirements ?? []).map((row: any) => <tr key={row.uuid ?? row.id}><td className={td}>{row.budgetMin ?? row.budgetMax ?? "—"}</td><td className={td}>{row.remarks ?? "—"}</td><td className={td}>{row.sizeSqft ?? "—"}</td><td className={td}>{row.preferredArea ?? "—"}</td><td className={td}>{row.propertyType ?? row.requirementType?.name ?? "—"}</td></tr>) : <EmptyRow colSpan={5} icon={<FileSpreadsheet size={24} />} text="No Requirements Logged Yet." />}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: Deal Negotiation */}
            {activeTab === "Deal Negotiation" && (
              <div className="space-y-3 animate-in fade-in">
                <div className={tableWrap}>
                  <table className="w-full text-left min-w-[850px]">
                    <thead className={thead}>
                      <tr>
                        <th className={th}>#</th>
                        <th className={th}>PROJECT</th>
                        <th className={th}>FLAT/LAND/SHARE</th>
                        <th className={th}>ACTIVITY TYPE</th>
                        <th className={th}>CLIENT OFFER PRICE</th>
                        <th className={th}>COUNTER PRICE</th>
                        <th className={th}>LISTED PRICE</th>
                        <th className={th}>FINAL PRICE</th>
                        <th className={th}>STATUS</th>
                        <th className={th}>ROUND</th>
                        <th className={th}>CREATED BY</th>
                      </tr>
                    </thead>
                    <tbody className={tbody}>
                      {(detailTabs.negotiations ?? []).length ? (detailTabs.negotiations ?? []).map((row: any, index: number) => <tr key={row.uuid ?? row.id}><td className={td}>{index + 1}</td><td className={td}>{row.project?.name ?? "—"}</td><td className={td}>{row.flatLand?.flatLandNo ?? row.flatLandId ?? "—"}</td><td className={td}>{row.activityType ?? "offer"}</td><td className={td}>{row.clientOfferedPrice ?? "—"}</td><td className={td}>{row.counterPrice ?? "—"}</td><td className={td}>{row.listedPrice ?? "—"}</td><td className={td}>{row.finalAgreedPrice ?? "—"}</td><td className={td}>{row.status ?? "—"}</td><td className={td}>{row.roundNo ?? index + 1}</td><td className={td}>{row.creator?.name ?? "—"}</td></tr>) : <EmptyRow colSpan={11} icon={<Layers size={24} />} text="No Deal Negotiation Records Found." />}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 4: Property */}
            {activeTab === "Property" && (
              <div className="space-y-4 animate-in fade-in">
                <div className={`${card} p-4 flex items-center justify-between gap-3`}>
                  <div className={`${addonGroup} flex-1 max-w-sm`}>
                    <span className={addonLabel}>Project</span>
                    <select
                      value={propProject}
                      onChange={(e) => setPropProject(e.target.value)}
                      className={addonInput}
                    >
                      <option value="">Select Project</option>
                      <option value="Mustain Villa">Mustain Villa</option>
                      <option value="Royal City">Royal City</option>
                    </select>
                  </div>

                  <button className={btnSolid}>
                    See Flat/Land
                  </button>
                </div>

                <div className={tableWrap}>
                  <table className="w-full text-left min-w-[700px]">
                    <thead className={thead}>
                      <tr>
                        <th className={th}>ID</th>
                        <th className={th}>PROJECT</th>
                        <th className={th}>FLAT NO</th>
                        <th className={th}>SIZE</th>
                        <th className={th}>BEDROOMS</th>
                        <th className={th}>BATHROOMS</th>
                        <th className={th}>FACING</th>
                        <th className={th}>SALE STATUS</th>
                      </tr>
                    </thead>
                    <tbody className={tbody}>
                      {(detailTabs.property ?? []).length ? (detailTabs.property ?? []).map((row: any) => <tr key={row.uuid ?? row.id}><td className={td}>{row.uuid ?? row.id}</td><td className={td}>{row.project?.name ?? row.projectName ?? "—"}</td><td className={td}>{row.plotFlatNo ?? "—"}</td><td className={td}>{row.size ?? "—"}</td><td className={td}>—</td><td className={td}>—</td><td className={td}>—</td><td className={td}>{row.status ?? "—"}</td></tr>) : <EmptyRow colSpan={8} icon={<Building2 size={24} />} text="No Property Listed Yet." />}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 5: Follow-up */}
            {activeTab === "Follow-up" && (
              <div className={`${tableWrap} animate-in fade-in`}>
                <table className="w-full text-left min-w-[650px]">
                  <thead className={thead}>
                    <tr>
                      <th className={th}>DATE</th>
                      <th className={th}>FOLLOW-UP DATE</th>
                      <th className={th}>NOTE</th>
                      <th className={th}>COMMENT</th>
                      <th className={th}>ASSIGN USER</th>
                      <th className={th}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody className={tbody}>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className={`${td} font-mono font-bold`}>15-10-2026 4:23 PM</td>
                      <td className={`${td} font-mono font-bold`}>15-10-2026 4:23 PM</td>
                      <td className={`${td} text-slate-400`}>—</td>
                      <td className={`${td} font-bold`}>hfjddddd</td>
                      <td className={`${td} font-bold`}>{activeLead.srOfficer}</td>
                      <td className={td}>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                          Follow Up
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 6: Visits */}
            {activeTab === "Visits" && (
              <div className={`${tableWrap} animate-in fade-in`}>
                <table className="w-full text-left min-w-[650px]">
                  <thead className={thead}>
                    <tr>
                      <th className={th}>DATE</th>
                      <th className={th}>NOTE</th>
                      <th className={th}>COMMENT</th>
                      <th className={th}>ASSIGN USER</th>
                      <th className={th}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody className={tbody}>
                    {(detailTabs.visits ?? []).length ? (detailTabs.visits ?? []).map((row: any) => <tr key={row.uuid ?? row.id}><td className={td}>{row.activityDate ?? "—"}</td><td className={td}>{row.summary ?? "—"}</td><td className={td}>{row.feedback ?? "—"}</td><td className={td}>{row.conductedByUser?.name ?? activeLead.srOfficer}</td><td className={td}>{row.visitStatus?.name ?? row.activityType ?? "—"}</td></tr>) : <EmptyRow colSpan={5} icon={<Calendar size={24} />} text="No Visit Logs Recorded." />}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 7: Note */}
            {activeTab === "Note" && (
              <div className="space-y-4 animate-in fade-in">
                <div className={`${card} p-4 flex items-center gap-3`}>
                  <span className="px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs md:text-sm font-bold">Note</span>
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Enter new note..."
                    className={field}
                  />
                </div>

                <div className={tableWrap}>
                  <table className="w-full text-left">
                    <thead className={thead}>
                      <tr>
                        <th className={`${th} w-16`}>SL</th>
                        <th className={`${th} w-48`}>DATE</th>
                        <th className={th}>NOTE</th>
                      </tr>
                    </thead>
                    <tbody className={tbody}>
                      {(detailTabs.notes ?? []).length ? (detailTabs.notes ?? []).map((row: any, index: number) => <tr key={row.uuid ?? row.id}><td className={td}>{index + 1}</td><td className={td}>{row.activityDate ?? "—"}</td><td className={td}>{row.summary ?? "—"}</td></tr>) : <EmptyRow colSpan={3} icon={<FileText size={24} />} text="No Notes Available." />}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
