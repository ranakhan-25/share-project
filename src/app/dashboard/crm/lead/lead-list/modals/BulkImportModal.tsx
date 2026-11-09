import { AlertCircle } from "lucide-react";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-in fade-in">
        <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Bulk Import
          </h3>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert("Sample Excel file download started.");
            }}
            className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline"
          >
            ↓ Sample File Download
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
          <div>
            <label className="block text-slate-500 mb-1">File</label>
            <input
              type="file"
              className="w-full p-1.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1">Lead Stage</label>
            <select className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <option value="New Assignment">New Assignment</option>
              <option value="Priority">Priority</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1">Lead Category</label>
            <select className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <option value="">Select Category</option>
              <option value="Ready Flat">Ready Flat</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1">Lead Source</label>
            <select className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <option value="">Select Source</option>
              <option value="Linkedin">Linkedin</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1">Campaign</label>
            <select className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <option value="">Select Lead Source</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1">Interested Project</label>
            <select className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <option value="">Select value</option>
              <option value="Mustain Villa">Mustain Villa</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1">User/SR</label>
            <input
              type="text"
              defaultValue="Admin"
              className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1">If CR</label>
            <input
              type="text"
              defaultValue="Admin"
              className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-rose-500 font-bold text-[11px]">
          <AlertCircle size={14} />
          <span>Note: If Lead Source or Campaign is not found in the Excel file, the values selected in this form will be used.</span>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-400 text-white font-bold"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              alert("Bulk Import successful!");
              onClose();
            }}
            className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-black shadow-md"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}