interface CallAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  callAssignDate: string;
  setCallAssignDate: (val: string) => void;
  callAssignUserType: string;
  setCallAssignUserType: (val: string) => void;
  callAssignNote: string;
  setCallAssignNote: (val: string) => void;
  onSubmit: () => void;
}

export default function CallAssignModal({
  isOpen,
  onClose,
  callAssignDate,
  setCallAssignDate,
  callAssignUserType,
  setCallAssignUserType,
  callAssignNote,
  setCallAssignNote,
  onSubmit,
}: CallAssignModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-in fade-in">
        <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Call Assign
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 text-lg">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold">
          <div>
            <label className="block text-slate-500 mb-1">Date</label>
            <input
              type="text"
              placeholder="mm/dd/yyyy --:-- --"
              value={callAssignDate}
              onChange={(e) => setCallAssignDate(e.target.value)}
              className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1">Assign User Type</label>
            <input
              type="text"
              value={callAssignUserType}
              onChange={(e) => setCallAssignUserType(e.target.value)}
              className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1">Note</label>
            <textarea
              rows={2}
              placeholder="Write Descriptions"
              value={callAssignNote}
              onChange={(e) => setCallAssignNote(e.target.value)}
              className="w-full p-2 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none font-semibold"
            />
          </div>
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
            onClick={onSubmit}
            className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-black shadow-md"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
