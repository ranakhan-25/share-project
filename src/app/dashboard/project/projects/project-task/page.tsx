'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Home, 
  ChevronRight, 
  Plus, 
  Search, 
  List, 
  Kanban, 
  Calendar as CalendarIcon, 
  X, 
  Paperclip, 
  Upload,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Trash2,
  Edit,
  CheckCircle2
} from 'lucide-react';
import { getStoredAccessToken } from '@/lib/admin-auth/adminAuthStorage';

// Backend Response Type
interface ApiTask {
  uuid: string;
  id: string;
  projectUuid: string;
  milestoneUuid?: string;
  taskCode: string;
  title: string;
  assignee: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate: string;
  reminderBefore?: number;
  description?: string;
  status: 'Todo' | 'In Progress' | 'Under Review' | 'Completed';
  attachmentUrl?: string;
  createdAt: string;
  deletedAt: string | null;
}

// Frontend UI Type
interface ProjectTask {
  uuid: string;
  code: string;
  projectUuid: string;
  title: string;
  milestone?: string;
  assignee: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate: string;
  status: 'Todo' | 'In Progress' | 'Under Review' | 'Completed';
  description?: string;
  hasAttachment?: boolean;
  reminderBefore?: number;
}

interface ProjectOption {
  uuid: string;
  name: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ProjectTasksPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/realbizpro/api/v1';

  // State
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectUuid, setSelectedProjectUuid] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // View & Filter State
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectTask | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    milestoneUuid: '',
    assignee: 'Shamim Khan',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    dueDate: new Date().toISOString().slice(0, 16),
    description: '',
    reminderBefore: '30',
    hasAttachment: false
  });

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? getStoredAccessToken() : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const notifySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // 1. FETCH USER'S PROJECTS
  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/project?limit=100`, { headers: getHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.data?.data || data?.data?.items || data?.data || [];
      const opts: ProjectOption[] = list.map((p: any) => ({
        uuid: p.uuid,
        name: p.projectName || p.name || 'Unnamed Project'
      }));
      setProjects(opts);
      if (opts.length > 0) {
        setSelectedProjectUuid(opts[0].uuid);
      }
    } catch (e) {
      console.error('Failed to load projects', e);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // 2. FETCH TASKS (GET)
  const fetchTasks = async (page = 1, limit = 10, projectUuid = selectedProjectUuid) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const url = projectUuid 
        ? `${API_BASE_URL}/project-tasks?projectUuid=${projectUuid}&page=${page}&limit=${limit}`
        : `${API_BASE_URL}/project-tasks?page=${page}&limit=${limit}`;

      const response = await fetch(url, { headers: getHeaders() });
      const result = await response.json();
      
      let rawTasks: ApiTask[] = [];
      let metaData: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };
      
      if (Array.isArray(result)) {
        rawTasks = result;
        metaData = { total: result.length, page: 1, limit: result.length, totalPages: 1 };
      } else if (result.success && Array.isArray(result.data)) {
        rawTasks = result.data;
        metaData = result.meta || { total: result.data.length, page, limit, totalPages: Math.ceil(result.data.length / limit) };
      } else if (Array.isArray(result.data)) {
        rawTasks = result.data;
        metaData = result.meta || { total: result.data.length, page, limit, totalPages: Math.ceil(result.data.length / limit) };
      } else if (result.data && Array.isArray(result.data.data)) {
        rawTasks = result.data.data;
        metaData = result.data.meta || { total: result.data.data.length, page, limit, totalPages: Math.ceil(result.data.data.length / limit) };
      }

      const mappedTasks: ProjectTask[] = rawTasks.map((t) => ({
        uuid: t.uuid,
        code: t.taskCode,
        projectUuid: t.projectUuid,
        title: t.title,
        milestone: t.milestoneUuid || 'General',
        assignee: t.assignee,
        priority: t.priority,
        dueDate: t.dueDate,
        status: t.status,
        description: t.description,
        hasAttachment: !!t.attachmentUrl,
        reminderBefore: t.reminderBefore
      }));
      
      setTasks(mappedTasks);
      setMeta(metaData);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setErrorMsg("Failed to load tasks. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectUuid) {
      fetchTasks(currentPage, pageLimit, selectedProjectUuid);
    }
  }, [selectedProjectUuid, currentPage, pageLimit]);

  // 3. CREATE TASK (POST)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectUuid) {
      setErrorMsg('Please select a project first.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);

    const finalMilestoneUuid = formData.milestoneUuid.trim() === '' ? null : formData.milestoneUuid.trim();

    const payload = {
      projectUuid: selectedProjectUuid,
      milestoneUuid: finalMilestoneUuid,
      taskCode: `TSK-${Math.floor(Math.random() * 9000 + 1000)}`,
      title: formData.title,
      assignee: formData.assignee,
      priority: formData.priority,
      dueDate: new Date(formData.dueDate).toISOString(),
      reminderBefore: parseInt(formData.reminderBefore) || 30,
      description: formData.description,
      status: 'Todo',
      attachmentUrl: formData.hasAttachment ? 'dummy-attachment-url.pdf' : null,
      addedBy: 'Admin',
      addedById: 'admin-uuid'
    };

    try {
      const response = await fetch(`${API_BASE_URL}/project-tasks`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create task');
      }

      await fetchTasks(1, pageLimit, selectedProjectUuid);
      setIsModalOpen(false);
      notifySuccess('Task created successfully!');
      
      setFormData({
        title: '',
        milestoneUuid: '',
        assignee: 'Shamim Khan',
        priority: 'Medium',
        dueDate: new Date().toISOString().slice(0, 16),
        description: '',
        reminderBefore: '30',
        hasAttachment: false
      });

    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. UPDATE TASK (PATCH)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/project-tasks/${editingTask.uuid}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          title: editingTask.title,
          assignee: editingTask.assignee,
          priority: editingTask.priority,
          status: editingTask.status,
          description: editingTask.description
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update task');
      }

      setTasks(tasks.map(t => t.uuid === editingTask.uuid ? editingTask : t));
      setEditingTask(null);
      notifySuccess('Task updated successfully!');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (uuid: string, newStatus: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/project-tasks/${uuid}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setTasks(tasks.map(t => t.uuid === uuid ? { ...t, status: newStatus } : t));
        notifySuccess('Task status updated!');
      } else {
        const err = await response.json();
        alert(err.message || "Failed to update status");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 5. DELETE TASK
  const handleDeleteTask = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/project-tasks/${deleteTarget.uuid}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to delete task');
      }

      setTasks(tasks.filter(t => t.uuid !== deleteTarget.uuid));
      setDeleteTarget(null);
      notifySuccess('Task deleted successfully!');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Logic
  const assigneesList = useMemo(() => ['All', ...Array.from(new Set(tasks.map(t => t.assignee)))], [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = 
        task.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignee.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAssignee = selectedAssignee === 'All' || task.assignee === selectedAssignee;
      const matchesPriority = selectedPriority === 'All' || task.priority === selectedPriority;
      const matchesStatus = selectedStatus === 'All' || task.status === selectedStatus;

      return matchesSearch && matchesAssignee && matchesPriority && matchesStatus;
    });
  }, [tasks, searchQuery, selectedAssignee, selectedPriority, selectedStatus]);

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setPageLimit(newLimit);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-8 font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <nav className="flex items-center text-sm text-slate-500 space-x-2 mb-1">
            <Link href="/dashboard" className="flex items-center hover:text-blue-600 transition-colors">
              <Home className="w-4 h-4 mr-1 text-slate-600" /> Dashboard
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-900">Project Tasks</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Project Tasks Management</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Project Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Project:</label>
            <select
              value={selectedProjectUuid}
              onChange={(e) => setSelectedProjectUuid(e.target.value)}
              className="bg-white border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-blue-600 shadow-sm cursor-pointer"
            >
              {projects.length === 0 && <option value="">No Projects Found</option>}
              {projects.map((p) => (
                <option key={p.uuid} value={p.uuid}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button onClick={() => setViewMode('list')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}><List className="w-3.5 h-3.5" /> List</button>
            <button onClick={() => setViewMode('kanban')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'kanban' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}><Kanban className="w-3.5 h-3.5" /> Kanban</button>
            <button onClick={() => setViewMode('calendar')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}><CalendarIcon className="w-3.5 h-3.5" /> Calendar</button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Create Task
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600" />
          {errorMsg}
        </div>
      )}

      {/* Main Container */}
      <div className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
        
        {/* Filters */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Assignee:</label>
              <select value={selectedAssignee} onChange={(e) => setSelectedAssignee(e.target.value)} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-blue-600 shadow-sm cursor-pointer">
                {assigneesList.map((a, i) => <option key={i} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Priority:</label>
              <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-blue-600 shadow-sm cursor-pointer capitalize">
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Status:</label>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-blue-600 shadow-sm cursor-pointer capitalize">
                <option value="All">All Statuses</option>
                <option value="Todo">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Under Review">Under Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input type="text" placeholder="Search title, assignee, code..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p>Loading tasks from server...</p>
          </div>
        ) : (
          <>
            {/* LIST VIEW */}
            {viewMode === 'list' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                      <th className="py-3.5 px-4">Code</th>
                      <th className="py-3.5 px-4">Task Title</th>
                      <th className="py-3.5 px-4">Assignee</th>
                      <th className="py-3.5 px-4">Priority</th>
                      <th className="py-3.5 px-4">Due Date</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-center">Attachment</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredTasks.length > 0 ? (
                      filteredTasks.map((task) => (
                        <tr key={task.uuid} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">{task.code}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            <div className="flex flex-col">
                              <span>{task.title}</span>
                              {task.description && <span className="text-xs text-slate-500 font-normal">{task.description}</span>}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">{task.assignee}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              task.priority === 'Low' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                              task.priority === 'Medium' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              task.priority === 'High' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 text-xs whitespace-nowrap">
                            {new Date(task.dueDate).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.uuid, e.target.value)}
                              className="bg-slate-50 border border-slate-200 text-xs font-semibold px-2 py-1 rounded-lg outline-none cursor-pointer"
                            >
                              <option value="Todo">Todo</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Under Review">Under Review</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {task.hasAttachment ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-50 text-blue-600 rounded-lg"><Paperclip className="w-3.5 h-3.5" /></span>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setEditingTask(task)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Task"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(task)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Task"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">No task entries found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* KANBAN VIEW */}
            {viewMode === 'kanban' && (
              <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50">
                {(['Todo', 'In Progress', 'Under Review', 'Completed'] as const).map((statusCol) => (
                  <div key={statusCol} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">{statusCol}</h3>
                      <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {filteredTasks.filter(t => t.status === statusCol).length}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {filteredTasks.filter(t => t.status === statusCol).map((task) => (
                        <div key={task.uuid} className="border border-slate-200 rounded-xl p-3 bg-white hover:border-blue-600 transition-all shadow-xs">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono text-xs font-bold text-blue-600">{task.code}</span>
                            <span className="text-[10px] uppercase font-bold text-slate-500">{task.priority}</span>
                          </div>
                          <p className="font-semibold text-slate-900 text-sm mb-2">{task.title}</p>
                          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                            <span>{task.assignee}</span>
                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CALENDAR VIEW */}
            {viewMode === 'calendar' && (
              <div className="p-8 text-center text-slate-500">
                <CalendarIcon className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                <p className="font-bold text-slate-800">Calendar Timeline Mode</p>
                <p className="text-sm text-slate-500 mt-1">Showing upcoming task deadlines.</p>
              </div>
            )}
          </>
        )}

        {/* Footer with Pagination */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span>Showing {filteredTasks.length} of {meta.total} total task items</span>
            <select 
              value={pageLimit} 
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-semibold text-slate-700">
              Page {meta.page} of {meta.totalPages || 1}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= meta.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          <span>Project Tasks Module</span>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Create Task</h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Title *</label>
                <input type="text" required placeholder="e.g. Inspect Rebar Spacing" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Assignee *</label>
                  <input type="text" required value={formData.assignee} onChange={(e) => setFormData({ ...formData, assignee: e.target.value })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Priority *</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm capitalize">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Due Date & Time *</label>
                <input type="datetime-local" required value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Reminder Before (minutes)</label>
                <input type="number" placeholder="30" value={formData.reminderBefore} onChange={(e) => setFormData({ ...formData, reminderBefore: e.target.value })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Description</label>
                <textarea rows={3} placeholder="Task instructions..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSubmitting ? 'Saving...' : 'Save Task'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Edit Task — {editingTask.code}</h2>
              <button onClick={() => setEditingTask(null)} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Title *</label>
                <input type="text" required value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Assignee</label>
                  <input type="text" value={editingTask.assignee} onChange={(e) => setEditingTask({ ...editingTask, assignee: e.target.value })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Status</label>
                  <select value={editingTask.status} onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as any })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm">
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Description</label>
                <textarea rows={3} value={editingTask.description || ''} onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setEditingTask(null)} className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-sm">
                  {isSubmitting ? 'Updating...' : 'Update Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Delete Task?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete <span className="font-semibold text-slate-800">{deleteTarget.title}</span> ({deleteTarget.code})?</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={handleDeleteTask} disabled={isSubmitting} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-sm">
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
