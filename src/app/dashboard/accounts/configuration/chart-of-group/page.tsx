'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  Search,
  Plus,
  RefreshCcw,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/realbizpro/api/v1';

// ডামি ডেটা (বেশি ডেটা দিয়ে টেস্ট করার জন্য)
const initialDummyData = [
  { id: 1, code: 'AST-001', name: 'Office Laptop', category: 'Electronics', unit: 'Pcs', brand: 'Global Link', price: 1200, group: 'Fixed Asset' },
  { id: 2, code: 'AST-002', name: 'AC Machine', category: 'Electronics', unit: 'Pcs', brand: 'Samsung', price: 800, group: 'Current Asset' },
  { id: 3, code: 'AST-003', name: 'Office Printer', category: 'Stationery', unit: 'Pcs', brand: 'HP', price: 350, group: 'Fixed Asset' },
  { id: 4, code: 'AST-004', name: 'Conference Table', category: 'Furniture', unit: 'Pcs', brand: 'Local', price: 500, group: 'Fixed Asset' },
  { id: 5, code: 'AST-005', name: 'Desktop Computer', category: 'Electronics', unit: 'Pcs', brand: 'Dell', price: 1500, group: 'Fixed Asset' },
  { id: 6, code: 'AST-006', name: 'Whiteboard', category: 'Stationery', unit: 'Pcs', brand: 'Local', price: 100, group: 'Expense' },
  { id: 7, code: 'AST-007', name: 'Ergonomic Chair', category: 'Furniture', unit: 'Pcs', brand: 'Global Link', price: 300, group: 'Fixed Asset' },
  { id: 8, code: 'AST-008', name: 'Projector', category: 'Electronics', unit: 'Pcs', brand: 'Epson', price: 950, group: 'Fixed Asset' },
  { id: 9, code: 'AST-009', name: 'Water Dispenser', category: 'Electronics', unit: 'Pcs', brand: 'WALTON', price: 200, group: 'Asset' },
  { id: 10, code: 'AST-010', name: 'Reception Sofa', category: 'Furniture', unit: 'Pcs', brand: 'Local', price: 750, group: 'Fixed Asset' },
  { id: 11, code: 'AST-011', name: 'Router', category: 'Electronics', unit: 'Pcs', brand: 'TP-Link', price: 80, group: 'Asset' },
];

export default function AssetItemList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [assets, setAssets] = useState(initialDummyData);

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);

  // Chart of Groups State
  const [chartGroups, setChartGroups] = useState<{ id: string; name: string }[]>([]);
  const [isGroupsLoading, setIsGroupsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    code: '',
    category: '',
    brand: '',
    name: '',
    unit: '',
    price: '',
    group: ''
  });

  // ১. API থেকে Chart of Groups ফেচ করা
  const fetchChartOfGroups = async () => {
    setIsGroupsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/chart-of-groups`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'accept': 'application/json' }
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        let extractedData = [];
        if (Array.isArray(result.data)) extractedData = result.data;
        else if (Array.isArray(result.data.items)) extractedData = result.data.items;
        else if (Array.isArray(result.data.data)) extractedData = result.data.data;

        const formattedGroups = extractedData.map((item: any) => ({
          id: item.uuid || item.id || Math.random().toString(),
          name: item.name || item.groupName || item.title || item.accountName || 'Unknown Group'
        }));

        setChartGroups(formattedGroups);
      }
    } catch (error) {
      console.error("Failed to fetch chart groups:", error);
    } finally {
      setIsGroupsLoading(false);
    }
  };

  useEffect(() => {
    fetchChartOfGroups();
  }, []);

  // ==========================================
  // ২. SEARCH LOGIC (সার্চ কুয়েরি ফিল্টার)
  // ==========================================
  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return assets;
    const query = searchQuery.toLowerCase();
    
    return assets.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.brand.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        item.group.toLowerCase().includes(query)
    );
  }, [assets, searchQuery]);

  // ==========================================
  // ৩. PAGINATION LOGIC (পেজিনেশন)
  // ==========================================
  const totalEntries = filteredAssets.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);

  // কারেন্ট পেজের ডেটা স্লাইস করা
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredAssets.slice(indexOfFirstEntry, indexOfLastEntry);

  // সার্চ করলে বা এন্ট্রি পার পেজ চেঞ্জ হলে পেজ ১ এ রিসেট হবে
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, entriesPerPage]);

  // Handlers
  const handleAddClick = () => {
    setModalMode('add');
    setFormData({ id: 0, code: '', category: '', brand: '', name: '', unit: '', price: '', group: '' });
    setIsModalOpen(true);
  };

  const handleEditClick = (item: any) => {
    setModalMode('edit');
    setFormData({
      id: item.id,
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (modalMode === 'edit') {
      setAssets((prev) =>
        prev.map((item) =>
          item.id === formData.id ? { ...item, ...formData, price: Number(formData.price) } : item
        )
      );
    } else {
      const newId = assets.length > 0 ? Math.max(...assets.map(a => a.id)) + 1 : 1;
      const newAsset = {
        ...formData,
        id: newId,
        code: `AST-00${newId}`,
        price: Number(formData.price) || 0,
      };
      setAssets([...assets, newAsset]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setAssets(assets.filter(asset => asset.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] p-4 md:p-6 font-sans text-sm text-[#333]">
      {/* HEADER */}
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
          <button onClick={handleAddClick} className="bg-[#6b58e8] hover:bg-[#5844d0] text-white px-4 py-1.5 rounded text-sm flex items-center transition">
            <Plus className="w-4 h-4 mr-1" /> Item Add
          </button>
          <button className="bg-[#e34949] hover:bg-[#c93b3b] text-white px-4 py-1.5 rounded text-sm flex items-center transition">
            PDF
          </button>
          <button onClick={fetchChartOfGroups} className="bg-[#17b5c5] hover:bg-[#1399a7] text-white p-2 rounded transition">
            <RefreshCcw className={`w-4 h-4 ${isGroupsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded shadow-sm border border-gray-100 p-4">
        
        {/* Table Controls (Search & Show Entries) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <div className="flex items-center space-x-2 text-gray-600">
            <span>Show</span>
            <select 
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 outline-none focus:border-[#6b58e8]"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Search:</span>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="border border-gray-300 rounded px-3 py-1.5 outline-none focus:border-[#6b58e8] w-48 pl-8"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-2 top-2" />
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
                <th className="p-3 border-r border-[#8271eb]">Category</th>
                <th className="p-3 border-r border-[#8271eb]">Unit</th>
                <th className="p-3 border-r border-[#8271eb]">Brand</th>
                <th className="p-3 border-r border-[#8271eb]">Purchase Price</th>
                <th className="p-3 border-r border-[#8271eb]">Group</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {currentEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-gray-500">
                    No data available in table
                  </td>
                </tr>
              ) : (
                currentEntries.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="p-3 border-r border-gray-100 font-medium">{item.id}</td>
                    <td className="p-3 border-r border-gray-100">{item.code}</td>
                    <td className="p-3 border-r border-gray-100 font-semibold text-gray-800">{item.name}</td>
                    <td className="p-3 border-r border-gray-100">{item.category}</td>
                    <td className="p-3 border-r border-gray-100">{item.unit}</td>
                    <td className="p-3 border-r border-gray-100">{item.brand}</td>
                    <td className="p-3 border-r border-gray-100">{item.price.toFixed(2)}</td>
                    <td className="p-3 border-r border-gray-100">{item.group}</td>
                    <td className="p-3 flex items-center justify-center space-x-2">
                      <button onClick={() => handleEditClick(item)} className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 text-gray-600 gap-3">
          <div>
            Showing {totalEntries > 0 ? indexOfFirstEntry + 1 : 0} to {Math.min(indexOfLastEntry, totalEntries)} of {totalEntries} entries
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 border border-gray-200 rounded ${
                currentPage === 1 ? 'bg-[#f8f9fa] text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <div className="flex items-center px-3 bg-[#6b58e8] text-white rounded">
              {currentPage} / {totalPages === 0 ? 1 : totalPages}
            </div>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`px-3 py-1.5 border border-gray-200 rounded ${
                currentPage === totalPages || totalPages === 0 ? 'bg-[#f8f9fa] text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-[#fcfbfa] rounded shadow-lg w-full max-w-3xl overflow-hidden relative border border-gray-200">
            <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-800">
                {modalMode === 'edit' ? 'Edit Item' : 'New Item'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 bg-[#fbf8f9]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1.5">Category</label>
                    <div className="relative">
                      <select name="category" value={formData.category} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 appearance-none bg-white" required>
                        <option value="">Select Category</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Furniture">Furniture</option>
                        <option value="Stationery">Stationery</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1.5">Brand</label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <select name="brand" value={formData.brand} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 appearance-none bg-white" required>
                          <option value="">Select Brand</option>
                          <option value="Global Link">Global Link</option>
                          <option value="Dell">Dell</option>
                          <option value="HP">HP</option>
                          <option value="Local">Local</option>
                          <option value="Samsung">Samsung</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                      </div>
                      <button type="button" className="bg-[#6b58e8] text-white px-3 py-2 rounded"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>

                  {/* Item Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1.5">Item Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Item Name" className="w-full border border-gray-300 rounded px-3 py-2 bg-white" required />
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1.5">Unit</label>
                    <div className="relative">
                      <select name="unit" value={formData.unit} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 appearance-none bg-white" required>
                        <option value="">Select Unit</option>
                        <option value="Pcs">Pcs</option>
                        <option value="Kg">Kg</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Purchase Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1.5">Purchase Price</label>
                    <input type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange} placeholder="Enter Price" className="w-full border border-gray-300 rounded px-3 py-2 bg-white" required />
                  </div>

                  {/* Chart Of Groups (API CONNECTED) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1.5">Chart Of Groups*</label>
                    <div className="relative">
                      <select 
                        name="group" 
                        value={formData.group} 
                        onChange={handleInputChange} 
                        className="w-full border border-gray-300 rounded px-3 py-2 appearance-none bg-white" 
                        required
                      >
                        <option value="">
                          {isGroupsLoading ? 'Loading groups...' : 'Select One Option'}
                        </option>
                        
                        {chartGroups.length > 0 ? (
                          chartGroups.map((group: any) => (
                            <option key={group.id} value={group.name}>
                              {group.name}
                            </option>
                          ))
                        ) : (
                          !isGroupsLoading && <option value="" disabled>No groups found</option>
                        )}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                </div>
              </div>

              <div className="bg-white px-6 py-4 border-t border-gray-100 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 bg-gray-500 text-white rounded">Close</button>
                <button type="submit" className="px-5 py-2 bg-[#6b58e8] text-white rounded">
                  {modalMode === 'edit' ? 'Update' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}