/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// ====================== TYPES ======================
interface BoqItem {
  id: string;
  uuid: string;
  date: string;
  titleOfWork: string;
  task: string;
  budget: string;
  percentageOfTotalBudget: string;
  perSftBudget: string;
  cost: string;
  available: string;
  addedBy: string | null;
  uid?: string;
  projectId?: string;
  deletedAt?: string | null;
  project?: { name: string; uuid?: string };
}

interface Project {
  id: string;
  uuid: string;
  name: string;
  code: string;
}

interface ProjectType {
  id: string;
  uuid: string;
  name: string;
}

interface ProjectSite {
  id: string;
  uuid: string;
  code: string;
  name: string;
  location: string;
  description: string | null;
  projectId: string;
}

interface BoqLineItem {
  id: number;
  type: string;
  itemName: string;
  accountsHead: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface TaskItem {
  uuid: string;
  taskName: string;
}

// ====================== STATIC OPTIONS ======================
const TYPE_OPTIONS = ["Material", "Work", "Cost"];
const UNIT_OPTIONS = [
  "Kg", "Bag", "Cft", "Litre", "Pcs", "Sft", "Feet", "Lit.", "Tk.", "Goj",
  "Drum", "Gallon", "Job", "Nos", "Rft", "RMT",
];

const TITLE_OPTIONS = [
  "Bricks Works", "cement", "Design Cost", "Direct Common Cost",
  "Door Works", "Electric Works", "Indirect Common Cost", "Foundation Work",
];

const ITEM_OPTIONS = [
  "Soil Test Boring", "Land Survey", "Rebar Test", "Cylinder Set",
  "Scrap", "Maskin Tape", "Plastic Belcha",
];

const ACCOUNT_HEAD_OPTIONS = [
  "500-022-015-Others Consumption-(0)",
  "500-022-014-Sanitary Work Consumption-(0)",
  "500-022-013-Thai Consumption-(0)",
  "500-022-012-Marble Consumption-(0)",
  "500-022-011-Tiles Consumption-(70)",
];

// ====================== MAIN COMPONENT ======================
export default function BoqPage() {
  const params = useParams();
  const projectUuid = params.uuid as string;

  const [boqList, setBoqList] = useState<BoqItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [projectSites, setProjectSites] = useState<ProjectSite[]>([]);
  
  // ✅ Task ড্রপডাউনের জন্য স্টেট
  const [tasks, setTasks] = useState<TaskItem[]>([]); 

  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingBoq, setEditingBoq] = useState<BoqItem | null>(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    titleOfWork: "",
    uid: "",
    projectType: "",
    projectId: "",
    site: "",
    task: "",
    addTask: false,
  });

  const [lineItems, setLineItems] = useState<BoqLineItem[]>([
    {
      id: Date.now(),
      type: "Material",
      itemName: "",
      accountsHead: "",
      description: "",
      unit: "Kg",
      quantity: 0,
      rate: 0,
      amount: 0,
    },
  ]);

  // ====================== FETCH ======================
  const fetchBoqList = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/realbizpro/api/v1/boq?sortBy=createdAt&sortOrder=DESC&withDeleted=false`
      );
      const json = await res.json();
      if (json.success) {
        const activeBoqs = (json.data.data || []).filter((item: BoqItem) => !item.deletedAt);
        setBoqList(activeBoqs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/realbizpro/api/v1/project`);
      const json = await res.json();
      if (json.success) setProjects(json.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjectTypes = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/realbizpro/api/v1/project-type`);
      const json = await res.json();
      if (json.success) setProjectTypes(json.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjectSites = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/realbizpro/api/v1/project-sites`);
      const json = await res.json();
      if (json.success) setProjectSites(json.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Task লিস্ট ফেচ
  const fetchTasks = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/realbizpro/api/v1/task?page=1&limit=100`);
      const json = await res.json();
      if (json.success) {
        setTasks(json.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBoqList();
    fetchProjects();
    fetchProjectTypes();
    fetchProjectSites();
    fetchTasks(); // ✅ কল করা হলো
  }, []);

  // ====================== CREATE ======================
  const handleCreate = () => {
    setEditingBoq(null);
    const random = Math.floor(1000 + Math.random() * 9000);
    setForm({
      date: new Date().toISOString().split("T")[0],
      titleOfWork: "",
      uid: `BOQ-${random}`,
      projectType: "",
      projectId: projectUuid || "",
      site: "",
      task: "",
      addTask: false,
    });
    setLineItems([
      {
        id: Date.now(),
        type: "Material",
        itemName: "",
        accountsHead: "",
        description: "",
        unit: "Kg",
        quantity: 0,
        rate: 0,
        amount: 0,
      },
    ]);
    setShowAddForm(true);
  };

  // ====================== EDIT ======================
  const handleEdit = (boq: BoqItem) => {
    setEditingBoq(boq);
    setForm({
      date: boq.date || new Date().toISOString().split("T")[0],
      titleOfWork: boq.titleOfWork || "",
      uid: boq.uid || `BOQ-${boq.id}`,
      projectType: "",
      projectId: boq.projectId || boq.project?.uuid || projectUuid || "",
      site: "",
      task: boq.task || "",
      addTask: false,
    });
    setLineItems([
      {
        id: Date.now(),
        type: "Material",
        itemName: "",
        accountsHead: "",
        description: "",
        unit: "Kg",
        quantity: 0,
        rate: 0,
        amount: Number(boq.budget) || 0,
      },
    ]);
    setShowAddForm(true);
  };

  // ====================== DELETE ======================
  const handleDelete = async (boq: BoqItem) => {
    if (!window.confirm(`Delete "${boq.titleOfWork}"?`)) return;
    const uuid = boq.uuid;
    if (!uuid) {
      alert("UUID missing – cannot delete");
      return;
    }
    try {
      setDeletingId(uuid);
      setBoqList((prev) => prev.filter((item) => item.uuid !== uuid));
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/realbizpro/api/v1/boq/${uuid}`,
        { method: "DELETE", headers: { "Content-Type": "application/json" } }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok && !json.success) {
        alert(`Delete failed: ${json.message || res.status}`);
        fetchBoqList();
      }
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
      fetchBoqList();
    } finally {
      setDeletingId(null);
    }
  };

  // ====================== LINE ITEMS ======================
  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        type: "",
        itemName: "",
        accountsHead: "",
        description: "",
        unit: "Kg",
        quantity: 0,
        rate: 0,
        amount: 0,
      },
    ]);
  };

  const removeLineItem = (id: number) => {
    setLineItems((prev) => {
      const filtered = prev.filter((i) => i.id !== id);
      return filtered.length
        ? filtered
        : [
            {
              id: Date.now(),
              type: "",
              itemName: "",
              accountsHead: "",
              description: "",
              unit: "Kg",
              quantity: 0,
              rate: 0,
              amount: 0,
            },
          ];
    });
  };

  const updateLineItem = (id: number, field: keyof BoqLineItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "rate") {
          updated.amount = Number(updated.quantity) * Number(updated.rate);
        }
        return updated;
      })
    );
  };

  const grandTotal = lineItems.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );

  // ====================== SUBMIT ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      projectId: form.projectId,
      uid: form.uid,
      date: form.date,
      titleOfWork: form.titleOfWork,
      task: form.task || form.titleOfWork,
      budget: grandTotal,
      percentageOfTotalBudget: 0,
      perSftBudget: 0,
      cost: 0,
      available: grandTotal,
      addedBy: "Admin",
      addedById: "admin-user",
    };

    try {
      const isEdit = !!editingBoq;
      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/realbizpro/api/v1/boq/${editingBoq!.uuid}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/realbizpro/api/v1/boq`;

      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok || json.success) {
        alert(isEdit ? "BOQ updated successfully!" : "BOQ created successfully!");
        setShowAddForm(false);
        setEditingBoq(null);
        await fetchBoqList();
      } else {
        alert(json.message || `Failed (${res.status})`);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save BOQ");
    } finally {
      setSubmitting(false);
    }
  };

  // ====================== FORM VIEW ======================
  if (showAddForm) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">
            {editingBoq ? "EDIT BOQ" : "ADD BOQ"}
          </h1>
          <button
            onClick={() => {
              setShowAddForm(false);
              setEditingBoq(null);
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
          >
            BOQ LIST
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg border p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm mb-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Title/Name of Work</label>
                <div className="flex gap-1">
                  <select
                    value={form.titleOfWork}
                    onChange={(e) => setForm({ ...form, titleOfWork: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select Title/Name of Work</option>
                    {TITLE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <button type="button" className="bg-purple-600 text-white px-3 rounded">+</button>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Code (UID)</label>
                <input
                  value={form.uid}
                  onChange={(e) => setForm({ ...form, uid: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Project Type</label>
                <select
                  value={form.projectType}
                  onChange={(e) => setForm({ ...form, projectType: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Select value</option>
                  {projectTypes.map((t) => (
                    <option key={t.uuid} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Project</label>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p.uuid} value={p.uuid}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm mb-1">Site</label>
                <select
                  value={form.site}
                  onChange={(e) => setForm({ ...form, site: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Select Site</option>
                  {projectSites.map((site) => (
                    <option key={site.uuid} value={site.name}>
                      {site.name}{site.location ? ` - ${site.location}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* ✅ API-চালিত Task ড্রপডাউন */}
              <div>
                <label className="block text-sm mb-1">Task</label>
                <select
                  value={form.task}
                  onChange={(e) => setForm({ ...form, task: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Select Task</option>
                  {tasks.map((t) => (
                    <option key={t.uuid} value={t.taskName}>{t.taskName}</option>
                  ))}
                </select>
              </div>

              {/* Add Task চেকবক্স থাকলে এখানে রাখতে পারেন, না লাগলে বাদ দিতে পারেন */}
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-lg border overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-600 text-white">
                  <th className="px-3 py-2 text-left">TYPE</th>
                  <th className="px-3 py-2 text-left">ITEM NAME</th>
                  <th className="px-3 py-2 text-left">ACCOUNTS HEAD</th>
                  <th className="px-3 py-2 text-left">DESCRIPTION</th>
                  <th className="px-3 py-2 text-left">UNIT</th>
                  <th className="px-3 py-2 text-left">QUANTITY</th>
                  <th className="px-3 py-2 text-left">RATE</th>
                  <th className="px-3 py-2 text-left">AMOUNT</th>
                  <th className="px-3 py-2 text-center">
                    <button type="button" onClick={addLineItem} className="bg-green-500 hover:bg-green-600 text-white w-6 h-6 rounded text-xs">+</button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-2 py-2">
                      <select value={item.type} onChange={(e) => updateLineItem(item.id, "type", e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
                        <option value="">Select Type</option>
                        {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <select value={item.itemName} onChange={(e) => updateLineItem(item.id, "itemName", e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
                        <option value="">Select Item</option>
                        {ITEM_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <select value={item.accountsHead} onChange={(e) => updateLineItem(item.id, "accountsHead", e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
                        <option value="">Select Item</option>
                        {ACCOUNT_HEAD_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input value={item.description} onChange={(e) => updateLineItem(item.id, "description", e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
                    </td>
                    <td className="px-2 py-2">
                      <select value={item.unit} onChange={(e) => updateLineItem(item.id, "unit", e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
                        {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input type="number" value={item.quantity} onChange={(e) => updateLineItem(item.id, "quantity", Number(e.target.value))} className="w-20 border rounded px-2 py-1.5 text-sm" />
                    </td>
                    <td className="px-2 py-2">
                      <input type="number" value={item.rate} onChange={(e) => updateLineItem(item.id, "rate", Number(e.target.value))} className="w-20 border rounded px-2 py-1.5 text-sm" />
                    </td>
                    <td className="px-2 py-2">
                      <input type="number" value={item.amount} readOnly className="w-24 border rounded px-2 py-1.5 text-sm bg-gray-50" />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button type="button" onClick={() => removeLineItem(item.id)} className="bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded text-xs">🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="bg-white border rounded-lg p-4 w-80">
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium">Grand Total :</span>
                <input value={grandTotal.toFixed(2)} readOnly className="border rounded px-3 py-1.5 w-32 text-right bg-gray-50" />
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded disabled:opacity-60">
                {submitting ? "Saving..." : editingBoq ? "Update" : "Submit"}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ====================== LIST VIEW ======================
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 items-center">
          <button className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm">Copy</button>
          <button className="bg-orange-500 text-white px-3 py-1.5 rounded text-sm">CSV</button>
          <button className="bg-green-600 text-white px-3 py-1.5 rounded text-sm">Excel</button>
          <button className="bg-red-500 text-white px-3 py-1.5 rounded text-sm">PDF</button>
          <span className="text-sm text-gray-600 ml-2">
            Show{" "}
            <select className="border rounded px-2 py-1 mx-1">
              <option>20</option><option>50</option><option>100</option>
            </select>{" "}
            entries
          </span>
        </div>

        <div className="flex gap-2">
          <button onClick={handleCreate} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm">+ CREATE BOQ</button>
          <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm">+ CLONE BOQ</button>
        </div>
      </div>

      <div className="flex justify-end mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">Search:</span>
          <input className="border rounded px-3 py-1.5 text-sm w-48" />
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-x-auto">
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-600 text-white">
                  <th className="px-3 py-2"><input type="checkbox" /></th>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">TITLE/NAME OF WORK</th>
                  <th className="px-3 py-2 text-left">DATE</th>
                  <th className="px-3 py-2 text-left">BUDGET</th>
                  <th className="px-3 py-2 text-left">% OF TOTAL BUDGET</th>
                  <th className="px-3 py-2 text-left">PER SFT BUDGET</th>
                  <th className="px-3 py-2 text-left">COST</th>
                  <th className="px-3 py-2 text-left">AVAILABLE</th>
                  <th className="px-3 py-2 text-left">ADDED BY</th>
                  <th className="px-3 py-2 text-left">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {boqList.length === 0 ? (
                  <tr><td colSpan={11} className="text-center py-8 text-gray-500">No data available in table</td></tr>
                ) : (
                  boqList.map((item) => (
                    <tr key={item.uuid} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2"><input type="checkbox" /></td>
                      <td className="px-3 py-2">{item.id}</td>
                      <td className="px-3 py-2">{item.titleOfWork}</td>
                      <td className="px-3 py-2">{item.date}</td>
                      <td className="px-3 py-2">{item.budget}</td>
                      <td className="px-3 py-2">{item.percentageOfTotalBudget}%</td>
                      <td className="px-3 py-2">{item.perSftBudget}</td>
                      <td className="px-3 py-2">{item.cost}</td>
                      <td className="px-3 py-2">{item.available}</td>
                      <td className="px-3 py-2">{item.addedBy || "-"}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(item)} className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs">✎</button>
                          <button onClick={() => handleDelete(item)} disabled={deletingId === item.uuid} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs disabled:opacity-50">
                            {deletingId === item.uuid ? "..." : "🗑"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                <tr className="bg-gray-50 font-medium">
                  <td colSpan={4} className="px-3 py-2 text-right">GRAND TOTAL:</td>
                  <td className="px-3 py-2">{boqList.reduce((sum, item) => sum + (Number(item.budget) || 0), 0).toFixed(2)}</td>
                  <td className="px-3 py-2">{boqList.reduce((sum, item) => sum + (Number(item.percentageOfTotalBudget) || 0), 0).toFixed(2)}%</td>
                  <td className="px-3 py-2">{boqList.reduce((sum, item) => sum + (Number(item.perSftBudget) || 0), 0).toFixed(2)}</td>
                  <td className="px-3 py-2">{boqList.reduce((sum, item) => sum + (Number(item.cost) || 0), 0).toFixed(2)}</td>
                  <td className="px-3 py-2">{boqList.reduce((sum, item) => sum + (Number(item.available) || 0), 0).toFixed(2)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-between items-center px-4 py-3 text-sm text-gray-600">
              <span>Showing 1 to {boqList.length} of {boqList.length} entries</span>
              <div className="flex gap-2">
                <button className="border px-3 py-1 rounded" disabled>Previous</button>
                <button className="bg-purple-600 text-white px-3 py-1 rounded">1</button>
                <button className="border px-3 py-1 rounded" disabled>Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}