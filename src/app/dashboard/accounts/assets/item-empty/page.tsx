'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ChevronDown,
  Search,
  Plus,
  RefreshCcw,
  X,
  Pencil,
  Trash2,
  Eye,
} from 'lucide-react';

export default function AssetItemList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [assets, setAssets] = useState<Array<{ id: number; uuid: string; code: string; category: string; brand: string; name: string; unit: string; price: number; group: string; location: string; acquisitionDate: string; method: string; bookValue: number; depreciableValue: number; status: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<(typeof assets)[number] | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    uuid: '',
    code: '',
    category: '',
    brand: '',
    name: '',
    unit: '',
    price: '',
    group: ''
  });

  const normalizeArray = (value: unknown): Record<string, unknown>[] => {
    if (Array.isArray(value)) return value as Record<string, unknown>[];
    if (!value || typeof value !== 'object') return [];
    for (const nested of Object.values(value)) {
      const found = normalizeArray(nested);
      if (found.length) return found;
    }
    return [];
  };

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/backend/item-entry', { headers: { accept: 'application/json' } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Item entries could not be loaded.');
      const rows = normalizeArray(result.data);
      setAssets(rows.map((item, index) => ({
        id: Number(item.id ?? index + 1),
        uuid: String(item.uuid ?? ''),
        code: String(item.code ?? `AST-${String(index + 1).padStart(3, '0')}`),
        category: String(item.category ?? 'Asset'),
        brand: String(item.brand ?? '—'),
        name: String(item.itemName ?? item.name ?? ''),
        unit: String(item.unit ?? 'Pcs'),
        price: Number(item.originalValue ?? item.price ?? 0),
        group: String(item.group ?? 'Asset'),
        location: String(item.location ?? ''),
        acquisitionDate: String(item.acquisitionDate ?? '').slice(0, 10),
        method: String(item.method ?? ''),
        bookValue: Number(item.bookValue ?? 0),
        depreciableValue: Number(item.depreciableValue ?? 0),
        status: String(item.status ?? ''),
      })));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Item entries could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Add Button Click
  const handleAddClick = () => {
    setModalMode('add');
    setFormData({ id: 0, uuid: '', code: '', category: '', brand: '', name: '', unit: '', price: '', group: '' });
    setIsModalOpen(true);
  };

  // Edit Button Click
  const handleEditClick = (item: (typeof assets)[number]) => {
    setModalMode('edit');
    setFormData({
      id: item.id,
      uuid: item.uuid,
      code: item.code,
      category: item.category,
      brand: item.brand,
      name: item.name,
      unit: item.unit,
      price: item.price.toString(),
      group: item.group,
    });
    setIsModalOpen(true);
  };

  // Form Input Change Handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit Form (Add or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.brand || !formData.name.trim() || !formData.unit || !formData.price || !formData.group) {
      toast.error('Please fill in required fields (*)');
      return;
    }
    const price = Number(formData.price || 0);
    if (!Number.isFinite(price) || price < 0) {
      toast.error('Purchase price must be a valid non-negative number.');
      return;
    }
    const payload = {
      itemName: formData.name.trim(),
      location: String(formData.category || ''),
      acquisitionDate: new Date().toISOString().slice(0, 10),
      originalValue: price,
      method: String(formData.brand || ''),
      bookValue: price,
      depreciableValue: price,
      status: formData.group || 'Running',
    };
    setIsSaving(true);
    try {
      const uuid = modalMode === 'edit' ? String(formData.uuid || '') : '';
      if (uuid === '' && modalMode === 'edit') {
        throw new Error('This item has no valid UUID.');
      }
      const response = await fetch(`/api/backend/item-entry${uuid ? `/${encodeURIComponent(uuid)}` : ''}`, {
        method: uuid ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result.success === false) throw new Error(result.message || 'Item entry could not be saved.');
      toast.success(modalMode === 'edit' ? 'Item entry updated successfully.' : 'Item entry created successfully.');
      setIsModalOpen(false);
      await fetchItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Item entry could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Handler
  const handleDelete = (item: (typeof assets)[number]) => {
    toast((notification) => (
      <div className="flex items-center gap-3">
        <span>Delete {item.name}?</span>
        <button type="button" onClick={async () => {
          toast.dismiss(notification.id);
          const loadingToast = toast.loading('Deleting item...');
          try {
            const response = await fetch(`/api/backend/item-entry/${encodeURIComponent(item.uuid)}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Item entry could not be deleted.');
            toast.success('Item entry deleted successfully.', { id: loadingToast });
            await fetchItems();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Item entry could not be deleted.', { id: loadingToast });
          }
        }} className="rounded bg-red-500 px-2 py-1 text-xs text-white">Delete</button>
        <button type="button" onClick={() => toast.dismiss(notification.id)} className="rounded bg-slate-200 px-2 py-1 text-xs text-slate-700">Cancel</button>
      </div>
    ), { duration: 8000 });
  };

  const handleView = async (item: (typeof assets)[number]) => {
    if (!item.uuid) {
      toast.error('This item has no valid UUID.');
      return;
    }
    const loadingToast = toast.loading('Loading item details...');
    try {
      const response = await fetch(`/api/backend/item-entry/${encodeURIComponent(item.uuid)}`, {
        headers: { accept: 'application/json' },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Item details could not be loaded.');
      const data = result.data?.data ?? result.data ?? result;
      setSelectedItem({
        ...item,
        location: String(data.location ?? item.location ?? ''),
        acquisitionDate: String(data.acquisitionDate ?? item.acquisitionDate ?? '').slice(0, 10),
        method: String(data.method ?? item.method ?? ''),
        bookValue: Number(data.bookValue ?? item.bookValue ?? 0),
        depreciableValue: Number(data.depreciableValue ?? item.depreciableValue ?? 0),
        status: String(data.status ?? item.status ?? ''),
      });
      toast.dismiss(loadingToast);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Item details could not be loaded.', { id: loadingToast });
    }
  };

  const filteredAssets = assets.filter((item) =>
    [item.id, item.code, item.name, item.category, item.brand, item.unit]
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#f4f7f6] p-4 md:p-6 font-sans text-sm text-[#333]">
      {/* ================= BREADCRUMB & HEADER ================= */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
        <div className="flex items-center space-x-2 text-[#6b58e8] text-sm">
          <span className="hover:underline cursor-pointer">Home</span>
          <span className="text-gray-400">&gt;</span>
          <span className="hover:underline cursor-pointer flex items-center">
            Inventory <ChevronDown className="w-3 h-3 ml-1" />
          </span>
          <span className="text-gray-400">&gt;</span>
          <span className="text-gray-600">Asset Item</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleAddClick}
            className="bg-[#6b58e8] hover:bg-[#5844d0] text-white px-4 py-1.5 rounded text-sm flex items-center transition"
          >
            <Plus className="w-4 h-4 mr-1" /> Item Add
          </button>
          <button className="bg-[#e34949] hover:bg-[#c93b3b] text-white px-4 py-1.5 rounded text-sm flex items-center transition">
            PDF
          </button>
          <button
            type="button"
            onClick={fetchItems}
            disabled={isLoading}
            className="bg-[#17b5c5] hover:bg-[#1399a7] disabled:opacity-60 text-white p-2 rounded transition"
            title="Refresh"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ================= TABLE SECTION ================= */}
      <div className="bg-white rounded shadow-sm border border-gray-100 p-4">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <div className="flex items-center space-x-2 text-gray-600">
            <span>Show</span>
            <select className="border border-gray-300 rounded px-2 py-1 outline-none focus:border-[#6b58e8]">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Search:</span>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="border border-gray-300 rounded px-3 py-1 outline-none focus:border-[#6b58e8] w-48 pl-8"
                placeholder="Search items"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1.5" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#6b58e8] text-white text-xs uppercase font-semibold">
                <th className="p-3 border-r border-[#8271eb]">ID</th>
                <th className="p-3 border-r border-[#8271eb]">Code</th>
                <th className="p-3 border-r border-[#8271eb]">Name</th>
                <th className="p-3 border-r border-[#8271eb]">
                  <div className="flex items-center justify-between">
                    Category <ChevronDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 border-r border-[#8271eb]">Unit</th>
                <th className="p-3 border-r border-[#8271eb]">Brand</th>
                <th className="p-3 border-r border-[#8271eb]">Purchase Price</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-gray-500">
                    No data available in table
                  </td>
                </tr>
              ) : (
                filteredAssets.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="p-3 border-r border-gray-100 font-medium">{item.id}</td>
                    <td className="p-3 border-r border-gray-100">{item.code}</td>
                    <td className="p-3 border-r border-gray-100 font-semibold text-gray-800">{item.name}</td>
                    <td className="p-3 border-r border-gray-100">{item.category}</td>
                    <td className="p-3 border-r border-gray-100">{item.unit}</td>
                    <td className="p-3 border-r border-gray-100">{item.brand}</td>
                    <td className="p-3 border-r border-gray-100">{item.price.toFixed(2)}</td>
                    <td className="p-3 flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleView(item)}
                        className="bg-gray-600 hover:bg-gray-700 text-white p-1.5 rounded transition"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditClick(item)}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded transition"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded transition"
                        title="Delete"
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

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 text-gray-600 gap-3">
          <div>
            Showing {filteredAssets.length === 0 ? 0 : 1} to {filteredAssets.length} of {filteredAssets.length} entries
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1.5 bg-[#f8f9fa] border border-gray-200 rounded text-gray-400 cursor-not-allowed">
              Previous
            </button>
            <button className="px-3 py-1.5 bg-[#f8f9fa] border border-gray-200 rounded text-gray-400 cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ================= ADD / EDIT MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-[#fcfbfa] rounded shadow-lg w-full max-w-3xl overflow-hidden relative border border-gray-200">
            {/* Modal Header */}
            <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-800">
                {modalMode === 'edit' ? 'Edit Item' : 'New Item'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Form) */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 bg-[#fbf8f9]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  
                  {/* Category Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1.5">Category</label>
                    <div className="relative">
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 appearance-none bg-white text-gray-700 outline-none focus:border-[#6b58e8]"
                        required
                      >
                        <option value="">Select Category</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Furniture">Furniture</option>
                        <option value="Stationery">Stationery</option>
                        <option value="Vehicles">Vehicles</option>
                        <option value="Machinery">Machinery</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Brand Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1.5">Brand</label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <select
                          name="brand"
                          value={formData.brand}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 appearance-none bg-white text-gray-700 outline-none focus:border-[#6b58e8]"
                          required
                        >
                          <option value="">Select Brand</option>
                          <option value="Global Link">Global Link</option>
                          <option value="ABCD">ABCD</option>
                          <option value="local">local</option>
                          <option value="bsrm test">bsrm test</option>
                          <option value="hhh">hhh</option>
                          <option value="test">test</option>
                          <option value="Dell">Dell</option>
                          <option value="HP">HP</option>
                          <option value="Samsung">Samsung</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                      </div>
                      <button type="button" className="bg-[#6b58e8] hover:bg-[#5844d0] text-white px-3 py-2 rounded shadow transition">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Item Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1.5">Item Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Item Name"
                      className="w-full border border-gray-300 rounded px-3 py-2 bg-white outline-none focus:border-[#6b58e8] placeholder-gray-400"
                      required
                    />
                  </div>

                  {/* Unit Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1.5">Unit</label>
                    <div className="relative">
                      <select
                        name="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 appearance-none bg-white text-gray-700 outline-none focus:border-[#6b58e8]"
                        required
                      >
                        <option value="">Select Unit</option>
                        <option value="Kg">Kg</option>
                        <option value="Bag">Bag</option>
                        <option value="Cft">Cft</option>
                        <option value="Litre">Litre</option>
                        <option value="Pcs">Pcs</option>
                        <option value="Sft">Sft</option>
                        <option value="Feet">Feet</option>
                        <option value="Lt.">Lt.</option>
                        <option value="Tk.">Tk.</option>
                        <option value="Goj">Goj</option>
                        <option value="Drum">Drum</option>
                        <option value="Gallon">Gallon</option>
                        <option value="Job">Job</option>
                        <option value="Nos">Nos</option>
                        <option value="Rft">Rft</option>
                        <option value="RMT">RMT</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Purchase Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1.5">Purchase Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="Enter Purchase Price"
                      className="w-full border border-gray-300 rounded px-3 py-2 bg-white outline-none focus:border-[#6b58e8] placeholder-gray-400"
                      required
                    />
                  </div>

                  {/* Chart Of Groups Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1.5">Chart Of Groups*</label>
                    <div className="relative">
                      <select
                        name="group"
                        value={formData.group}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 appearance-none bg-white text-gray-700 outline-none focus:border-[#6b58e8]"
                        required
                      >
                        <option value="">Select One Option</option>
                        <option value="Asset">Asset</option>
                        <option value="Liability">Liability</option>
                        <option value="Equity">Equity</option>
                        <option value="Revenue">Revenue</option>
                        <option value="Expense">Expense</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-white px-6 py-4 border-t border-gray-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#6b58e8] hover:bg-[#5844d0] text-white rounded font-medium transition"
                >
                  {isSaving ? 'Saving...' : modalMode === 'edit' ? 'Update' : 'Submit'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-base font-semibold text-gray-800">Item Details</h2>
              <button type="button" onClick={() => setSelectedItem(null)} className="rounded bg-gray-100 p-1 text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 px-6 py-5 text-sm">
              <div><span className="text-gray-500">Name:</span> <strong>{selectedItem.name || '-'}</strong></div>
              <div><span className="text-gray-500">Code:</span> {selectedItem.code || '-'}</div>
              <div><span className="text-gray-500">Category:</span> {selectedItem.category || '-'}</div>
              <div><span className="text-gray-500">Brand:</span> {selectedItem.brand || '-'}</div>
              <div><span className="text-gray-500">Unit:</span> {selectedItem.unit || '-'}</div>
              <div><span className="text-gray-500">Price:</span> {selectedItem.price.toFixed(2)}</div>
              <div><span className="text-gray-500">Location:</span> {selectedItem.location || '-'}</div>
              <div><span className="text-gray-500">Status:</span> {selectedItem.status || '-'}</div>
              <div><span className="text-gray-500">Method:</span> {selectedItem.method || '-'}</div>
              <div><span className="text-gray-500">Acquired:</span> {selectedItem.acquisitionDate || '-'}</div>
            </div>
            <div className="flex justify-end border-t px-6 py-4">
              <button type="button" onClick={() => setSelectedItem(null)} className="rounded bg-gray-500 px-5 py-2 text-white">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}