'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { 
  ChevronRight, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Calendar,
  Eye,
  RotateCcw,
  X
} from 'lucide-react';

interface AssetListItem {
  uuid: string;
  sl: number;
  name: string;
  location: string;
  acquisitionDate: string;
  originalValue: number;
  method: string;
  bookValue: number;
  depreciableValue: number;
  status: string;
}

export default function AssetManagementSystem() {
  // Navigation / View State
  const [activeView, setActiveView] = useState<'list' | 'details'>('list');
  const [activeTab, setActiveTab] = useState<'Asset' | 'Depreciation Board' | 'Movement History' | 'Revaluations History'>('Asset');

  // Edit State
  const [editingUuid, setEditingUuid] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewAsset, setViewAsset] = useState<Record<string, unknown> | null>(null);

  // Asset List State
  const [entries, setEntries] = useState('10');
  const [searchQuery, setSearchQuery] = useState('');
  const [assets, setAssets] = useState<AssetListItem[]>([]);

  // Dropdown options state (so users can add new items via '+' buttons)
  const [itemList, setItemList] = useState<string[]>(['Office Laptop', 'AC Machine', 'Office Printer', 'Conference Table']);
  const [projectList, setProjectList] = useState<string[]>(['Sheba Eyecon Tower', 'Corporate HQ Expansion']);

  // Modal State for dynamic additions (+)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'item' | 'project' | 'movement' | 'depreciation'>('item');
  const [dynamicInputVal, setDynamicInputVal] = useState('');

  // Form States for Asset Details
  const [itemName, setItemName] = useState('Select Item');
  const [originalValue, setOriginalValue] = useState<number | ''>(5000);
  const [acquisitionDate, setAcquisitionDate] = useState('12/01/2025');
  const [project, setProject] = useState('Select a project');
  const [location, setLocation] = useState('');
  const [notDepreciableValue, setNotDepreciableValue] = useState(0);
  
  // Depreciation Method
  const [method, setMethod] = useState('Straight Line');
  const [duration, setDuration] = useState('2');
  const [computation, setComputation] = useState('Select');

  // Accounting
  const [expenseAccount, setExpenseAccount] = useState('Select Account');
  const [voucherNo, setVoucherNo] = useState('Select Voucher No');

  // Filtered Assets
  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const normalizeArray = (value: unknown): Record<string, unknown>[] => {
    if (Array.isArray(value)) return value as Record<string, unknown>[];
    if (!value || typeof value !== 'object') return [];
    for (const nested of Object.values(value)) {
      const found = normalizeArray(nested);
      if (found.length) return found;
    }
    return [];
  };

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/backend/assets', { headers: { accept: 'application/json' } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Assets could not be loaded.');
      const rows = normalizeArray(result.data);
      setAssets(rows.map((asset, index) => ({
        uuid: String(asset.uuid ?? ''),
        sl: index + 1,
        name: String(asset.itemName ?? ''),
        location: String(asset.location ?? ''),
        acquisitionDate: String(asset.acquisitionDate ?? '').slice(0, 10),
        originalValue: Number(asset.originalValue ?? 0),
        method: String(asset.method ?? 'Straight Line'),
        bookValue: Number(asset.bookValue ?? asset.originalValue ?? 0),
        depreciableValue: Number(asset.depreciableValue ?? 0),
        status: String(asset.status ?? 'Running'),
      })));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Assets could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // Open New Asset Form
  const handleOpenNewAssetForm = () => {
    setEditingUuid('');
    setItemName('Select Item');
    setOriginalValue('');
    setAcquisitionDate('12/01/2025');
    setProject('Select a project');
    setLocation('');
    setNotDepreciableValue(0);
    setMethod('Straight Line');
    setDuration('2');
    setComputation('Select');
    setExpenseAccount('Select Account');
    setVoucherNo('Select Voucher No');
    setActiveView('details');
  };

  // Edit Asset from Table Action
  const handleViewAsset = async (item: AssetListItem) => {
    try {
      const response = await fetch(`/api/backend/assets/${encodeURIComponent(item.uuid)}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Asset details could not be loaded.');
      const detail = result.data?.data ?? result.data ?? result;
      setViewAsset(detail && typeof detail === 'object' ? detail as Record<string, unknown> : null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Asset details could not be loaded.');
    }
  };

  const handleEditAsset = async (item: AssetListItem) => {
    try {
      const response = await fetch(`/api/backend/assets/${encodeURIComponent(item.uuid)}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Asset could not be loaded.');
      const asset = result.data?.data ?? result.data ?? result;
      if (!asset || typeof asset !== 'object') throw new Error('Asset details were invalid.');
      const record = asset as Record<string, unknown>;
      setEditingUuid(item.uuid);
      setItemName(String(record.itemName ?? item.name));
      if (!itemList.includes(String(record.itemName ?? item.name))) {
        setItemList((current) => [...current, String(record.itemName ?? item.name)]);
      }
      setLocation(String(record.location ?? item.location));
      setOriginalValue(Number(record.originalValue ?? item.originalValue));
      setAcquisitionDate(String(record.acquisitionDate ?? item.acquisitionDate).slice(0, 10));
      setProject(String(record.project ?? 'Select a project'));
      setNotDepreciableValue(Number(record.notDepreciableValue ?? 0));
      setMethod(String(record.method ?? item.method));
      setDuration(String(record.duration ?? '2'));
      setComputation(String(record.computation ?? 'Select'));
      setExpenseAccount(String(record.expenseAccount ?? 'Select Account'));
      setVoucherNo(String(record.voucherNo ?? 'Select Voucher No'));
      setActiveView('details');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Asset could not be loaded for editing.');
    }
  };

  // Delete Asset from Table Action
  const handleDeleteAsset = (item: AssetListItem) => {
    toast((notification) => (
      <div className="flex items-center gap-3">
        <span>Delete {item.name}?</span>
        <button type="button" onClick={async () => {
          toast.dismiss(notification.id);
          const loadingToast = toast.loading('Deleting asset...');
          try {
            const response = await fetch(`/api/backend/assets/${encodeURIComponent(item.uuid)}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Asset could not be deleted.');
            toast.success('Asset deleted successfully.', { id: loadingToast });
            await fetchAssets();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Asset could not be deleted.', { id: loadingToast });
          }
        }} className="rounded bg-red-600 px-2 py-1 text-xs text-white">Delete</button>
        <button type="button" onClick={() => toast.dismiss(notification.id)} className="rounded bg-slate-200 px-2 py-1 text-xs text-slate-700">Cancel</button>
      </div>
    ), { duration: 8000 });
  };

  const handleRestoreAsset = async (uuid: string) => {
    const loadingToast = toast.loading('Restoring asset...');
    try {
      const response = await fetch(`/api/backend/assets/${encodeURIComponent(uuid)}/restore`, { method: 'PATCH' });
      const result = await response.json();
      if (!response.ok || result.success === false) throw new Error(result.message || 'Asset could not be restored.');
      toast.success('Asset restored successfully.', { id: loadingToast });
      setViewAsset(null);
      await fetchAssets();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Asset could not be restored.', { id: loadingToast });
    }
  };

  // Save Asset (Create / Update)
  const handleSaveAsset = async () => {
    if (itemName === 'Select Item' || !itemName) {
      toast.error('Please select a valid Item Name.');
      return;
    }

    const numericDuration = Number(duration);
    if (!Number.isFinite(numericDuration) || !Number.isInteger(numericDuration) || numericDuration < 0) {
      toast.error('Duration must be a non-negative whole number.');
      return;
    }

    const numericValue = typeof originalValue === 'number' ? originalValue : 0;
    const bookValue = Math.max(0, numericValue - notDepreciableValue);
    const payload = {
      itemName,
      location,
      acquisitionDate: /^\d{4}-\d{2}-\d{2}$/.test(acquisitionDate) ? acquisitionDate : acquisitionDate.includes('/') ? acquisitionDate.split('/').reverse().join('-') : acquisitionDate,
      originalValue: numericValue,
      notDepreciableValue,
      bookValue,
      depreciableValue: Math.max(0, numericValue - notDepreciableValue),
      method,
      duration: numericDuration,
      computation,
      project: project === 'Select a project' ? '' : project,
      expenseAccount: expenseAccount === 'Select Account' ? '' : expenseAccount,
      voucherNo: voucherNo === 'Select Voucher No' ? '' : voucherNo,
      status: 'Running',
      addedBy: 'Admin',
      addedById: 'admin',
    };
    setIsSaving(true);
    try {
      const response = await fetch(`/api/backend/assets${editingUuid ? `/${encodeURIComponent(editingUuid)}` : ''}`, {
        method: editingUuid ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result.success === false) throw new Error(result.message || 'Asset could not be saved.');
      toast.success(editingUuid ? 'Asset updated successfully.' : 'New asset saved successfully.');
      setEditingUuid('');
      setActiveView('list');
      await fetchAssets();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Asset could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Dynamic Modal Submit (+)
  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dynamicInputVal.trim()) {
      toast.error('Please enter a value');
      return;
    }

    if (modalType === 'item') {
      setItemList([...itemList, dynamicInputVal]);
      setItemName(dynamicInputVal);
      toast.success(`New Item "${dynamicInputVal}" added successfully!`);
    } else if (modalType === 'project') {
      setProjectList([...projectList, dynamicInputVal]);
      setProject(dynamicInputVal);
      toast.success(`New Project "${dynamicInputVal}" added successfully!`);
    }

    setDynamicInputVal('');
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 font-sans text-slate-800 relative">
      
      {/* ================= VIEW 1: ASSET LIST PAGE ================= */}
      {activeView === 'list' && (
        <div className="space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center text-sm sm:text-base text-slate-600 space-x-2">
              <span className="hover:text-blue-600 cursor-pointer">Home</span>
              <ChevronRight className="w-5 h-5 text-slate-400" />
              <span className="hover:text-blue-600 cursor-pointer">Accounts Module</span>
              <ChevronRight className="w-5 h-5 text-slate-400" />
              <span className="font-semibold text-slate-900">Asset List</span>
            </div>

            <button 
              onClick={handleOpenNewAssetForm}
              className="bg-[#6b58e8] hover:bg-[#5844d0] text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center space-x-1.5 shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Asset</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 space-y-6">
            
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
              <div className="flex items-center text-sm text-slate-600 space-x-2">
                <span>Show</span>
                <select 
                  value={entries} 
                  onChange={(e) => setEntries(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3.5 py-2 bg-white text-sm"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <span>entries</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600 font-medium">Search:</span>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name/location..."
                  className="border border-slate-300 rounded-lg px-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:border-purple-500" 
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-purple-300 rounded-xl shadow-sm">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#6b58e8] text-white font-bold uppercase tracking-wider">
                    <th className="p-4 border-r border-purple-400 whitespace-nowrap">SL</th>
                    <th className="p-4 border-r border-purple-400 whitespace-nowrap">Name</th>
                    <th className="p-4 border-r border-purple-400 whitespace-nowrap">Location</th>
                    <th className="p-4 border-r border-purple-400 whitespace-nowrap">Acquisition Date</th>
                    <th className="p-4 border-r border-purple-400 whitespace-nowrap">Original Value</th>
                    <th className="p-4 border-r border-purple-400 whitespace-nowrap">Method</th>
                    <th className="p-4 border-r border-purple-400 whitespace-nowrap">Book Value</th>
                    <th className="p-4 border-r border-purple-400 whitespace-nowrap">Depreciable Value</th>
                    <th className="p-4 border-r border-purple-400 whitespace-nowrap">Status</th>
                    <th className="p-4 text-center whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white text-slate-700">
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-slate-400 italic bg-slate-50 text-base">
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((item) => (
                      <tr key={item.sl} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="p-4 border-r font-medium">{item.sl}</td>
                        <td className="p-4 border-r font-semibold text-slate-900">{item.name}</td>
                        <td className="p-4 border-r">{item.location}</td>
                        <td className="p-4 border-r">{item.acquisitionDate}</td>
                        <td className="p-4 border-r">{item.originalValue.toLocaleString()}</td>
                        <td className="p-4 border-r">{item.method}</td>
                        <td className="p-4 border-r">{item.bookValue.toLocaleString()}</td>
                        <td className="p-4 border-r">{item.depreciableValue}</td>
                        <td className="p-4 border-r">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 text-center space-x-2">
                          {/* Edit Action Button */}
                          <button 
                            onClick={() => handleEditAsset(item)} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded shadow transition"
                            title="Edit Asset"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {/* Delete Action Button */}
                          <button
                            onClick={() => handleViewAsset(item)}
                            className="bg-sky-600 hover:bg-sky-700 text-white p-2 rounded shadow transition"
                            title="View Asset"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteAsset(item)} 
                            className="bg-rose-600 hover:bg-rose-700 text-white p-2 rounded shadow transition"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between text-sm text-slate-600 pt-2">
              <span>Showing {filteredAssets.length > 0 ? 1 : 0} to {filteredAssets.length} of {filteredAssets.length} entries</span>
              <div className="flex space-x-1.5">
                <button className="px-4 py-2 rounded-lg font-medium bg-slate-100 text-slate-400 cursor-not-allowed">Previous</button>
                <button className="px-4 py-2 rounded-lg font-semibold bg-[#6b58e8] text-white shadow">1</button>
                <button className="px-4 py-2 rounded-lg font-medium bg-slate-100 text-slate-400 cursor-not-allowed">Next</button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= VIEW 2: ASSET DETAILS & FORM PAGE ================= */}
      {activeView === 'details' && (
        <div className="space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center text-sm sm:text-base text-slate-600 space-x-2">
              <span onClick={() => setActiveView('list')} className="hover:text-blue-600 cursor-pointer">Home</span>
              <ChevronRight className="w-5 h-5 text-slate-400" />
              <span onClick={() => setActiveView('list')} className="hover:text-blue-600 cursor-pointer">Asset List</span>
              <ChevronRight className="w-5 h-5 text-slate-400" />
              <span className="font-semibold text-slate-900">{editingUuid ? 'Edit Asset' : 'New Asset'}</span>
            </div>

            <div className="flex items-center space-x-2">
              {/* +Asset Movement Action Button */}
              <button 
                onClick={() => { setModalType('movement'); setIsModalOpen(true); }} 
                className="bg-[#6b58e8] hover:bg-[#5844d0] text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Asset Movement
              </button>
              {/* +Modify Depreciation Action Button */}
              <button 
                onClick={() => { setModalType('depreciation'); setIsModalOpen(true); }} 
                className="bg-[#6b58e8] hover:bg-[#5844d0] text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Modify Depreciation
              </button>
              {/* +New Asset Action Button */}
              <button 
                onClick={handleOpenNewAssetForm} 
                className="bg-[#6b58e8] hover:bg-[#5844d0] text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> New Asset
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 px-6 py-2 flex space-x-8 text-sm font-medium">
            {['Asset', 'Depreciation Board', 'Movement History', 'Revaluations History'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-3 border-b-2 transition-colors ${activeTab === tab ? 'border-purple-600 text-purple-600 font-semibold' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 space-y-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b pb-2">Asset Value</h3>
                
                <div className="space-y-4 text-sm">
                  {/* Item Name with Functional Add (+) button */}
                  <div>
                    <label className="block text-slate-700 font-medium mb-1.5">Item Name</label>
                    <div className="flex gap-2">
                      <select 
                        value={itemName} 
                        onChange={(e) => setItemName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="Select Item">Select Item</option>
                        {itemList.map((itm, idx) => (
                          <option key={idx} value={itm}>{itm}</option>
                        ))}
                      </select>
                      <button 
                        type="button"
                        onClick={() => { setModalType('item'); setIsModalOpen(true); }}
                        className="bg-[#6b58e8] hover:bg-[#5844d0] text-white px-3 rounded-lg flex items-center justify-center transition shadow"
                        title="Add New Item"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1.5">Original Value</label>
                    <input 
                      type="number" 
                      value={originalValue} 
                      onChange={(e) => setOriginalValue(e.target.value ? Number(e.target.value) : '')}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1.5">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Enter asset location"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1.5">Acquisition Date</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={acquisitionDate} 
                        onChange={(e) => setAcquisitionDate(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:border-purple-500"
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Project with Functional Add (+) button */}
                  <div>
                    <label className="block text-slate-700 font-medium mb-1.5">Project</label>
                    <div className="flex gap-2">
                      <select 
                        value={project} 
                        onChange={(e) => setProject(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="Select a project">Select a project</option>
                        {projectList.map((prj, idx) => (
                          <option key={idx} value={prj}>{prj}</option>
                        ))}
                      </select>
                      <button 
                        type="button"
                        onClick={() => { setModalType('project'); setIsModalOpen(true); }}
                        className="bg-[#6b58e8] hover:bg-[#5844d0] text-white px-3 rounded-lg flex items-center justify-center transition shadow"
                        title="Add New Project"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b pb-2">Depreciation Method</h3>
                  
                  <div className="space-y-4 text-sm">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1.5">Method</label>
                      <select 
                        value={method} 
                        onChange={(e) => setMethod(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="Select">Select</option>
                        <option value="Straight Line">Straight Line</option>
                        <option value="Reducing Balance">Reducing Balance</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                      <div className="sm:col-span-2">
                        <label className="block text-slate-700 font-medium mb-1.5">Duration</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={duration} 
                          onChange={(e) => setDuration(e.target.value === '' ? '' : String(Math.max(0, Math.trunc(Number(e.target.value)))))}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="pt-6 font-semibold text-slate-700">Year</div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1.5">Computation</label>
                      <select 
                        value={computation} 
                        onChange={(e) => setComputation(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="Select">Select</option>
                        <option value="Daily">Daily</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b pb-2">Current Values</h3>
                
                <div className="space-y-4 text-sm bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Not Depreciable Value:</span>
                    <span className="font-semibold text-slate-900">{notDepreciableValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Book Value:</span>
                    <span className="font-semibold text-slate-900">{typeof originalValue === 'number' ? originalValue.toFixed(2) : '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Depreciable Value:</span>
                    <span className="font-semibold text-slate-900">{typeof originalValue === 'number' ? originalValue.toFixed(2) : '0.00'}</span>
                  </div>
                </div>

                <div className="pt-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b pb-2">Accounting</h3>
                  
                  <div className="space-y-4 text-sm">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1.5">Expense Account</label>
                      <select 
                        value={expenseAccount} 
                        onChange={(e) => setExpenseAccount(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="Select Account">Select Account</option>
                        <option value="Depreciation Expense">Depreciation Expense</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1.5">If Tag Voucher No</label>
                      <select 
                        value={voucherNo} 
                        onChange={(e) => setVoucherNo(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="Select Voucher No">Select Voucher No</option>
                        <option value="VCH-2025-001">VCH-2025-001</option>
                        <option value="VCH-2025-002">VCH-2025-002</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            <div className="flex items-center space-x-4 pt-6 border-t border-slate-200">
              <button 
                onClick={handleSaveAsset}
                disabled={isSaving}
                className="bg-[#6b58e8] hover:bg-[#5844d0] text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow transition"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button 
                onClick={() => setActiveView('list')}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-2.5 rounded-lg text-sm font-semibold transition"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {viewAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="font-bold text-slate-900">Asset Details</h3>
              <button type="button" onClick={() => setViewAsset(null)} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid max-h-[65vh] grid-cols-1 gap-3 overflow-y-auto p-5 sm:grid-cols-2">
              {Object.entries(viewAsset).map(([key, value]) => (
                <div key={key} className="rounded border border-slate-200 p-3">
                  <div className="text-xs font-medium text-slate-500">{key}</div>
                  <div className="break-words text-sm text-slate-900">{value === null || value === undefined ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value)}</div>
                </div>
              ))}
            </div>
            {typeof viewAsset.uuid === 'string' && (
              <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
                <button type="button" onClick={() => handleRestoreAsset(viewAsset.uuid as string)} className="flex items-center gap-1 rounded bg-emerald-600 px-4 py-2 text-sm text-white">
                  <RotateCcw className="h-4 w-4" /> Restore
                </button>
                <button type="button" onClick={() => setViewAsset(null)} className="rounded bg-slate-200 px-4 py-2 text-sm text-slate-700">Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= DYNAMIC MODAL FOR (+) BUTTONS ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 capitalize">
                {modalType === 'item' && 'Add New Item'}
                {modalType === 'project' && 'Add New Project'}
                {modalType === 'movement' && 'Asset Movement Action'}
                {modalType === 'depreciation' && 'Modify Depreciation Action'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalType === 'item' || modalType === 'project' ? (
              <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-slate-700 text-sm font-medium mb-1.5">
                    {modalType === 'item' ? 'Item Name' : 'Project Name'}
                  </label>
                  <input 
                    type="text" 
                    value={dynamicInputVal} 
                    onChange={(e) => setDynamicInputVal(e.target.value)}
                    placeholder={`Enter ${modalType} name...`}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-[#6b58e8] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow"
                  >
                    Add
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 space-y-4 text-sm text-slate-600">
                <p>এখানে <strong>{modalType === 'movement' ? 'Asset Movement' : 'Modify Depreciation'}</strong> এর প্রয়োজনীয় ফর্ম বা প্যানেল যুক্ত করা যাবে।</p>
                <div className="flex justify-end pt-2">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="bg-[#6b58e8] text-white px-4 py-2 rounded-lg text-semibold shadow"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}