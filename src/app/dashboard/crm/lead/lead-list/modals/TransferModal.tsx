"use client";

import React from "react";
import { Plus } from "lucide-react";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  transferUser: string;
  setTransferUser: (val: string) => void;
  transferType: string;
  setTransferType: (val: string) => void;
  transferFollowup: boolean;
  setTransferFollowup: (val: boolean) => void;
  transferManualSet: boolean;
  setTransferManualSet: (val: boolean) => void;
  onConfirmTransfer: () => void; // 👈 সঠিক টাইপ ডিক্লেয়ারেশন
}

export default function TransferModal({
  isOpen,
  onClose,
  selectedCount,
  transferUser,
  setTransferUser,
  transferType,
  setTransferType,
  transferFollowup,
  setTransferFollowup,
  transferManualSet,
  setTransferManualSet,
  onConfirmTransfer,
}: TransferModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-in fade-in">
        <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Transfer Lead
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Selected Lead:</span>
            <span className="px-4 py-1.5 border rounded-lg bg-slate-50 dark:bg-slate-950 font-bold text-rose-600 text-sm">
              {selectedCount}
            </span>
            <button type="button" onClick={onClose} className="text-slate-400 text-lg ml-2 cursor-pointer">
              ✕
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
          <div>
            <label className="block text-slate-500 mb-1">Assign User</label>
            <select
              value={transferUser}
              onChange={(e) => setTransferUser(e.target.value)}
              className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              <option value="">Select User</option>
              <option value="Admin">Admin</option>
              <option value="Mohin">Mohin</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1">Assign Type</label>
            <div className="flex items-center gap-4 pt-1">
              <input
                type="text"
                value={transferType}
                onChange={(e) => setTransferType(e.target.value)}
                className="w-full p-2 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
              <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={transferFollowup}
                  onChange={(e) => setTransferFollowup(e.target.checked)}
                  className="rounded cursor-pointer"
                />
                Followup
              </label>
              <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={transferManualSet}
                  onChange={(e) => setTransferManualSet(e.target.checked)}
                  className="rounded cursor-pointer"
                />
                Manual Set
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-12 bg-indigo-500 text-white font-black text-xs p-2.5 text-center uppercase tracking-wider">
            <div className="col-span-6">USER NAME</div>
            <div className="col-span-3">QUANTITY</div>
            <div className="col-span-3 flex justify-center items-center">
              <span>ACTION</span>
              <button type="button" className="ml-2 bg-blue-500 text-white rounded p-0.5 cursor-pointer"><Plus size={14} /></button>
            </div>
          </div>
        </div>

        <div className="text-center font-bold text-xs text-slate-500 space-y-1">
          <div>Assign Total Transfer</div>
          <div className="w-48 mx-auto p-2 border rounded-xl font-mono text-blue-600 font-extrabold text-lg bg-slate-50 dark:bg-slate-950">
            {selectedCount}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-400 hover:bg-slate-500 text-white font-bold cursor-pointer transition"
          >
            Close
          </button>
          
          <button
            type="button"
            onClick={onConfirmTransfer}
            className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md cursor-pointer transition"
          >
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
}