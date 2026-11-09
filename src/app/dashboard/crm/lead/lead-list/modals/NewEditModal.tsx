import { X, ChevronDown } from "lucide-react";

interface NewEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: any) => void;
  formData: any;
  setFormData: (data: any) => void;
  activeLead: any;
  isLeadDetailsOpen: boolean;
  setIsLeadDetailsOpen: (val: boolean) => void;
  isPersonalInfoOpen: boolean;
  setIsPersonalInfoOpen: (val: boolean) => void;
  options?: Record<string, any[]>;
}

export default function NewEditModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  activeLead,
  isLeadDetailsOpen,
  setIsLeadDetailsOpen,
  isPersonalInfoOpen,
  setIsPersonalInfoOpen,
  options = {},
}: NewEditModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-5xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base md:text-lg font-extrabold text-slate-900 dark:text-slate-100">
            {activeLead ? "Edit Lead Account" : "Lead Accounts"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 cursor-pointer transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={onSubmit} className="p-6 md:p-7 overflow-y-auto space-y-6 text-sm font-semibold">
          
          {/* Basic Info Section Header */}
          <div className="p-3 bg-blue-100/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-extrabold rounded-xl text-sm md:text-base">
            Basic Info
          </div>

          <div className="p-5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1.5 font-bold text-xs md:text-sm">Date</label>
                <input
                  type="text"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-mono text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1.5 font-bold text-xs md:text-sm">Lead Code</label>
                <input
                  type="text"
                  readOnly
                  value={formData.leadCode}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 font-mono text-sm font-bold text-slate-500 outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1.5 font-bold text-xs md:text-sm">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1.5 font-bold text-xs md:text-sm">
                  Phone/Mobile <span className="text-rose-500">*</span>
                </label>
                <div className="flex border rounded-xl overflow-hidden bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus-within:border-indigo-600">
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 border-r border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>🇧🇩 (+880)</span>
                    <ChevronDown size={14} />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 outline-none font-mono text-sm font-semibold text-slate-800 dark:text-slate-100 bg-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1.5 font-bold text-xs md:text-sm">Secondary Number</label>
                <input
                  type="text"
                  placeholder="Secondary Number"
                  value={formData.secondaryNumber}
                  onChange={(e) => setFormData({ ...formData, secondaryNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1.5 font-bold text-xs md:text-sm">Assign User/SR</label>
                <select
                  value={formData.assignUser}
                  onChange={(e) => setFormData({ ...formData, assignUser: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                ><option value="">Select User/SR</option>{(options.user ?? []).map((item) => <option key={item.uuid} value={item.uuid}>{item.name}</option>)}</select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1.5 font-bold text-xs md:text-sm">If CR</label>
                <select
                  value={formData.ifCr}
                  onChange={(e) => setFormData({ ...formData, ifCr: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                ><option value="">Select CR</option>{(options.user ?? []).map((item) => <option key={item.uuid} value={item.uuid}>{item.name}</option>)}</select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1.5 font-bold text-xs md:text-sm">Lead Stages</label>
                <select
                  value={formData.leadStages}
                  onChange={(e) => setFormData({ ...formData, leadStages: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                ><option value="">Select Stage</option>{(options.stage ?? []).map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select>
              </div>
            </div>
          </div>

          {/* Lead Details Accordion */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setIsLeadDetailsOpen(!isLeadDetailsOpen)}
              className="w-full p-3.5 bg-blue-100/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-between cursor-pointer text-sm md:text-base"
            >
              <span className="flex items-center gap-2">Lead Details</span>
              <div className="p-1.5 rounded-lg border border-blue-400 bg-white dark:bg-slate-900 text-blue-600">
                <ChevronDown size={16} className={`transition duration-200 ${isLeadDetailsOpen ? "rotate-180" : ""}`} />
              </div>
            </button>

            {isLeadDetailsOpen && (
              <div className="p-5 bg-slate-50/50 dark:bg-slate-950/40 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1.5 font-bold text-xs md:text-sm">Lead Source</label>
                  <select
                    value={formData.leadSource}
                    onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                  >
                    <option value="">Select Source</option>
                    {(options.source ?? []).map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1.5 font-bold text-xs md:text-sm">Interested Project</label>
                  <select
                    value={formData.interestedProject}
                    onChange={(e) => setFormData({ ...formData, interestedProject: e.target.value })}
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                  >
                    <option value="">Select Interested Project</option>
                    {(options.project ?? []).map((item) => <option key={item.uuid} value={item.name}>{item.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1.5 font-bold text-xs md:text-sm">Lead Category</label>
                  <select
                    value={formData.leadCategory}
                    onChange={(e) => setFormData({ ...formData, leadCategory: e.target.value })}
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                  >
                    <option value="">Select Category</option>
                    {(options.category ?? []).map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1.5 font-bold text-xs md:text-sm">Campaign</label>
                  <select
                    value={formData.campaign}
                    onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                  >
                    <option value="">Select Campaign</option>
                    {(options.campaign ?? []).map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Personal Info Accordion */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setIsPersonalInfoOpen(!isPersonalInfoOpen)}
              className="w-full p-3.5 bg-blue-100/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-between cursor-pointer text-sm md:text-base"
            >
              <span className="flex items-center gap-2">Personal Info</span>
              <div className="p-1.5 rounded-lg border border-blue-400 bg-white dark:bg-slate-900 text-blue-600">
                <ChevronDown size={16} className={`transition duration-200 ${isPersonalInfoOpen ? "rotate-180" : ""}`} />
              </div>
            </button>

            {isPersonalInfoOpen && (
              <div className="p-5 bg-slate-50/50 dark:bg-slate-950/40 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1.5 font-bold text-xs md:text-sm">Organization</label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1.5 font-bold text-xs md:text-sm">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1.5 font-bold text-xs md:text-sm">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1.5 font-bold text-xs md:text-sm">Profession</label>
                  <select
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                  >
                    <option value="">Select Profession</option>
                    {(options.profession ?? []).map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-600 dark:text-slate-300 mb-1.5 font-bold text-xs md:text-sm">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-sm shadow-md transition cursor-pointer active:scale-95"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
