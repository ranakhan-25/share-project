"use client";

import React from "react";
import { PhoneCall } from "lucide-react";

interface CallAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount?: number;
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
  selectedCount = 0,
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
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-in fade-in">
        <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <PhoneCall className="text-indigo-600" size={22} />
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Call Assignment
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-lg border border-indigo-200 dark:border-indigo-800">
                {selectedCount} Leads Selected
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer ml-2"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
          <div>
            <label className="block text-slate-500 mb-1">Assignment Date & Time</label>
            <input
              type="datetime-local"
              value={callAssignDate}
              onChange={(e) => setCallAssignDate(e.target.value)}
              className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1">Assign User Type</label>
            <input
              type="text"
              value={callAssignUserType}
              onChange={(e) => setCallAssignUserType(e.target.value)}
              placeholder="Officer/SR"
              className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-slate-500 mb-1">Instructions / Note</label>
            <textarea
              rows={3}
              placeholder="Write follow-up instructions, talking points, or schedule notes..."
              value={callAssignNote}
              onChange={(e) => setCallAssignNote(e.target.value)}
              className="w-full p-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
            />
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
            onClick={onSubmit}
            className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md cursor-pointer transition active:scale-95"
          >
            Assign Calls
          </button>
        </div>
      </div>
    </div>
  );
}
