import { AlertCircle, AlertTriangle } from "lucide-react";

interface AlertDeleteModalsProps {
  isAlertOpen: boolean;
  onCloseAlert: () => void;
  isDeleteModalOpen: boolean;
  onCloseDelete: () => void;
  activeLead: any;
  onConfirmDelete: () => void;
}

export default function AlertDeleteModals({
  isAlertOpen,
  onCloseAlert,
  isDeleteModalOpen,
  onCloseDelete,
  activeLead,
  onConfirmDelete,
}: AlertDeleteModalsProps) {
  return (
    <>
      {isAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 space-y-4 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border-2 border-amber-500/30">
              <AlertCircle size={32} />
            </div>

            <h3 className="text-lg font-black text-foreground">
              Please select at least one checkbox
            </h3>

            <button
              onClick={onCloseAlert}
              className="px-6 py-2 rounded-xl bg-cyan-400 text-white font-black text-xs shadow-md"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {isDeleteModalOpen && activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-foreground">Confirm Delete Lead?</h3>
              <p className="text-xs text-muted-foreground font-medium">
                Are you sure you want to delete lead <span className="font-bold text-foreground">"{activeLead.name}"</span>?
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={onCloseDelete}
                className="px-5 py-2 rounded-xl bg-muted font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={onConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white font-black text-xs shadow-md"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}