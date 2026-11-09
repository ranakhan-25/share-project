import { AlertCircle } from "lucide-react";

interface SmsModalsProps {
  isSmsOpen: boolean;
  isWishSmsOpen: boolean;
  onCloseSms: () => void;
  smsTemplate: string;
  setSmsTemplate: (val: string) => void;
  smsText: string;
  setSmsText: (val: string) => void;
  onSubmitSms: () => void;
  isSmsConfirmOpen: boolean;
  onCloseConfirm: () => void;
  onConfirmOk: () => void;
}

export default function SmsModals({
  isSmsOpen,
  isWishSmsOpen,
  onCloseSms,
  smsTemplate,
  setSmsTemplate,
  smsText,
  setSmsText,
  onSubmitSms,
  isSmsConfirmOpen,
  onCloseConfirm,
  onConfirmOk,
}: SmsModalsProps) {
  return (
    <>
      {(isSmsOpen || isWishSmsOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {isWishSmsOpen ? "Wish SMS Template" : "SMS Template"}
              </h3>
              <button
                type="button"
                onClick={onCloseSms}
                className="px-2 py-0.5 text-xs text-slate-600 bg-slate-100 rounded border border-slate-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-500 mb-1">SMS Template</label>
                <select
                  value={smsTemplate}
                  onChange={(e) => setSmsTemplate(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                >
                  <option value="">Select Template</option>
                  <option value="Greeting">Greeting Template</option>
                  <option value="Followup">Followup Template</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">SMS</label>
                <textarea
                  rows={4}
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  placeholder="Write SMS"
                  className="w-full p-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none font-semibold outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onCloseSms}
                className="px-6 py-2 rounded-xl bg-slate-400 text-white font-bold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={onSubmitSms}
                className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-black shadow-md"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {isSmsConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 space-y-6 shadow-2xl text-center animate-in fade-in">
            <div className="w-24 h-24 mx-auto rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border-4 border-amber-400/40">
              <AlertCircle size={52} />
            </div>

            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              Are you sure Send SMS?
            </h3>

            <div className="flex justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={onCloseConfirm}
                className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border border-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirmOk}
                className="px-8 py-2.5 rounded-xl bg-rose-500 text-white font-black shadow-md hover:bg-rose-600 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}