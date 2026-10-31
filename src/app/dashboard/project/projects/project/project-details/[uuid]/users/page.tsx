/* eslint-disable prettier/prettier */
"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { X } from "lucide-react";

export default function UsersPage() {
  const { uuid } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-white rounded-lg border overflow-x-auto shadow-sm">
        <div className="flex justify-end p-2 border-b">
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-teal-400 hover:bg-teal-500 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            +ADD NEW
          </button>
        </div>
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="px-3 py-2 font-medium w-12">#</th>
              <th className="px-3 py-2 font-medium">NAME</th>
              <th className="px-3 py-2 font-medium">EMAIL</th>
              <th className="px-3 py-2 font-medium">PHONE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-3 py-2">1</td>
              <td className="px-3 py-2 font-medium">Admin</td>
              <td className="px-3 py-2">admin@admin.com</td>
              <td className="px-3 py-2">01713784994</td>
            </tr>
            {/* আরও ইউজার থাকলে এখানে ম্যাপ করবেন */}
          </tbody>
        </table>
      </div>

      {/* Assign User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-md shadow-xl w-full max-w-lg mx-4">
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200">
              <h2 className="text-[15px] font-semibold text-gray-800">Assign Users</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              <label className="block text-xs text-gray-600 mb-1">Assign User</label>
              <input 
                type="text" 
                placeholder="Select User" 
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-md">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="bg-gray-400 text-white px-4 py-1.5 rounded text-sm hover:bg-gray-500 transition-colors"
              >
                Close
              </button>
              <button className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm hover:bg-indigo-700 transition-colors">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}