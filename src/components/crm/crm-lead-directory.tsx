"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  Ban,
  Building2,
  CalendarClock,
  Eye,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import api from "@/lib/api";
import { showAlert } from "@/lib/swal";

interface CrmOption {
  id: number;
  name: string;
}

interface CrmActivity {
  uuid: string;
  activity_type: string;
  activity_date: string;
  summary: string;
  feedback?: string;
  next_followup_date?: string;
}

interface CrmPropertyInterest {
  uuid: string;
  project_name?: string;
  plot_flat_no?: string;
  size?: string;
  quoted_price?: number;
  status: string;
}

interface CrmRequirement {
  uuid: string;
  property_type?: string;
  preferred_area?: string;
  size_sqft?: number;
  budget_min?: number;
  budget_max?: number;
  remarks?: string;
}

interface CrmAttachment {
  uuid: string;
  file_name?: string;
  description?: string;
  createdAt?: string;
}

interface CrmLead {
  id: number;
  uuid: string;
  lead_code: string;
  client_name: string;
  phone: string;
  alternate_phone?: string;
  email?: string;
  lead_category_id?: number;
  lead_stage_id?: number;
  lead_source_id?: number;
  campaign_id?: number;
  profession_id?: number;
  designation?: string;
  organization?: string;
  present_address?: string;
  assigned_to?: string;
  priority: string;
  status: string;
  lead_score?: number;
  notes?: string;
  projectId?: string;
  createdAt: string;
  category?: CrmOption;
  stage?: CrmOption;
  source?: CrmOption;
  campaign?: CrmOption;
  profession?: CrmOption;
  activities?: CrmActivity[];
  property_interests?: CrmPropertyInterest[];
  requirements?: CrmRequirement[];
  attachments?: CrmAttachment[];
}

interface LeadForm {
  client_name: string;
  phone: string;
  alternate_phone: string;
  email: string;
  lead_category_id: string;
  lead_stage_id: string;
  lead_source_id: string;
  campaign_id: string;
  profession_id: string;
  designation: string;
  organization: string;
  present_address: string;
  assigned_to: string;
  priority: string;
  notes: string;
  projectId: string;
}

const emptyForm: LeadForm = {
  client_name: "",
  phone: "",
  alternate_phone: "",
  email: "",
  lead_category_id: "",
  lead_stage_id: "",
  lead_source_id: "",
  campaign_id: "",
  profession_id: "",
  designation: "",
  organization: "",
  present_address: "",
  assigned_to: "",
  priority: "medium",
  notes: "",
  projectId: "",
};

const emptyInterest = { project_name: "", plot_flat_no: "", size: "", quoted_price: "", status: "interested" };
const emptyRequirement = { property_type: "", preferred_area: "", size_sqft: "", budget_min: "", budget_max: "", remarks: "" };

function getPayload<T>(response: { data: unknown }): T {
  const body = response.data as { data?: unknown };
  return (body?.data ?? body) as T;
}

function getItems<T>(response: { data: unknown }): T[] {
  const payload = getPayload<unknown>(response);
  return Array.isArray(payload) ? (payload as T[]) : [];
}

function getErrorMessage(error: unknown): string {
  const responseMessage = (
    error as { response?: { data?: { message?: string | string[] } }; message?: string }
  )?.response?.data?.message;
  if (Array.isArray(responseMessage)) return responseMessage.join(", ");
  return responseMessage || (error as { message?: string })?.message || "Please try again.";
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function formFromLead(lead: CrmLead): LeadForm {
  return {
    client_name: lead.client_name,
    phone: lead.phone,
    alternate_phone: lead.alternate_phone || "",
    email: lead.email || "",
    lead_category_id: lead.lead_category_id ? String(lead.lead_category_id) : "",
    lead_stage_id: lead.lead_stage_id ? String(lead.lead_stage_id) : "",
    lead_source_id: lead.lead_source_id ? String(lead.lead_source_id) : "",
    campaign_id: lead.campaign_id ? String(lead.campaign_id) : "",
    profession_id: lead.profession_id ? String(lead.profession_id) : "",
    designation: lead.designation || "",
    organization: lead.organization || "",
    present_address: lead.present_address || "",
    assigned_to: lead.assigned_to || "",
    priority: lead.priority || "medium",
    notes: lead.notes || "",
    projectId: lead.projectId || "",
  };
}

export default function CrmLeadDirectory() {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [categories, setCategories] = useState<CrmOption[]>([]);
  const [stages, setStages] = useState<CrmOption[]>([]);
  const [sources, setSources] = useState<CrmOption[]>([]);
  const [campaigns, setCampaigns] = useState<CrmOption[]>([]);
  const [professions, setProfessions] = useState<CrmOption[]>([]);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [form, setForm] = useState<LeadForm>(emptyForm);
  const [editingLead, setEditingLead] = useState<CrmLead | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [activityType, setActivityType] = useState("call");
  const [activitySummary, setActivitySummary] = useState("");
  const [activityFeedback, setActivityFeedback] = useState("");
  const [nextFollowup, setNextFollowup] = useState("");
  const [interestForm, setInterestForm] = useState(emptyInterest);
  const [requirementForm, setRequirementForm] = useState(emptyRequirement);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentDescription, setAttachmentDescription] = useState("");
  const [junkTarget, setJunkTarget] = useState<CrmLead | null>(null);
  const [junkReason, setJunkReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadLeads = useCallback(async () => {
    const response = await api.get("/crm/leads");
    setLeads(getItems<CrmLead>(response));
  }, []);

  const loadMasterData = useCallback(async () => {
    const [categoryResponse, stageResponse, sourceResponse, campaignResponse, professionResponse] =
      await Promise.all([
        api.get("/crm/master/categories"),
        api.get("/crm/master/stages"),
        api.get("/crm/master/sources"),
        api.get("/crm/master/campaigns"),
        api.get("/crm/master/professions"),
      ]);
    setCategories(getItems<CrmOption>(categoryResponse));
    setStages(getItems<CrmOption>(stageResponse));
    setSources(getItems<CrmOption>(sourceResponse));
    setCampaigns(getItems<CrmOption>(campaignResponse));
    setProfessions(getItems<CrmOption>(professionResponse));
  }, []);

  const refresh = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      await Promise.all([loadLeads(), loadMasterData()]);
    } catch (loadError) {
      const message = getErrorMessage(loadError);
      setError(message);
      console.error("Failed to load CRM lead directory", loadError);
    } finally {
      setLoading(false);
    }
  }, [loadLeads, loadMasterData]);

  useEffect(() => {
    const initialStage = new URLSearchParams(window.location.search).get("stage_id");
    if (initialStage) setStageFilter(initialStage);
    void refresh();
  }, [refresh]);

  const filteredLeads = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesSearch =
        !normalizedSearch ||
        [lead.client_name, lead.lead_code, lead.phone, lead.email, lead.organization]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      const matchesStage = stageFilter === "all" || String(lead.lead_stage_id || "") === stageFilter;
      const matchesPriority = priorityFilter === "all" || lead.priority === priorityFilter;
      const matchesCategory = categoryFilter === "all" || String(lead.lead_category_id || "") === categoryFilter;
      const matchesSource = sourceFilter === "all" || String(lead.lead_source_id || "") === sourceFilter;
      const matchesDateFrom = !dateFromFilter || new Date(lead.createdAt) >= new Date(dateFromFilter);
      const matchesDateTo = !dateToFilter || new Date(lead.createdAt) <= new Date(dateToFilter);
      return matchesSearch && matchesStage && matchesPriority && matchesCategory && matchesSource && matchesDateFrom && matchesDateTo;
    });
  }, [leads, priorityFilter, search, stageFilter, categoryFilter, sourceFilter, dateFromFilter, dateToFilter]);

  const openCreate = () => {
    setEditingLead(null);
    setFormOpen(true);
    setForm({
      ...emptyForm,
      lead_stage_id: stages[0] ? String(stages[0].id) : "",
    });
  };

  const openEdit = (lead: CrmLead) => {
    setEditingLead(lead);
    setFormOpen(true);
    setForm(formFromLead(lead));
  };

  const saveLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      email: form.email || undefined,
      lead_category_id: form.lead_category_id ? Number(form.lead_category_id) : undefined,
      lead_stage_id: form.lead_stage_id ? Number(form.lead_stage_id) : undefined,
      lead_source_id: form.lead_source_id ? Number(form.lead_source_id) : undefined,
      campaign_id: form.campaign_id ? Number(form.campaign_id) : undefined,
      profession_id: form.profession_id ? Number(form.profession_id) : undefined,
      status: editingLead?.status || "active",
    };
    try {
      if (editingLead) {
        await api.patch(`/crm/leads/${editingLead.uuid}`, payload);
      } else {
        await api.post("/crm/leads", payload);
      }
      setForm(emptyForm);
      setEditingLead(null);
      setFormOpen(false);
      await loadLeads();
      await showAlert.success(editingLead ? "Lead updated" : "Lead created");
    } catch (saveError) {
      const message = getErrorMessage(saveError);
      setError(message);
      await showAlert.error("Could not save lead", message);
    } finally {
      setSaving(false);
    }
  };

  const openDetails = async (lead: CrmLead) => {
    setSelectedLead(lead);
    try {
      const response = await api.get(`/crm/leads/${lead.uuid}`);
      setSelectedLead(getPayload<CrmLead>(response));
      setError("");
    } catch (detailError) {
      const message = getErrorMessage(detailError);
      setError(message);
      console.error("Failed to load CRM lead details", detailError);
    }
  };

  const openJunk = (lead: CrmLead) => {
    setJunkTarget(lead);
    setJunkReason("");
  };

  // Move to junk = soft delete. The reason is saved into the lead notes first,
  // because the Junk Leads page shows `notes` as "Reason / Notes".
  const confirmJunk = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!junkTarget) return;
    const lead = junkTarget;
    const reason = junkReason.trim();
    setSaving(true);
    try {
      if (reason) {
        const notes = [lead.notes, `[Junk] ${reason}`].filter(Boolean).join("\n");
        await api.patch(`/crm/leads/${lead.uuid}`, { notes });
      }
      await api.delete(`/crm/leads/${lead.uuid}`);
      setLeads((current) => current.filter((item) => item.uuid !== lead.uuid));
      if (selectedLead?.uuid === lead.uuid) setSelectedLead(null);
      setJunkTarget(null);
      setJunkReason("");
      await showAlert.success("Lead moved to junk", `${lead.client_name} is now in Junk Leads.`);
    } catch (junkError) {
      const message = getErrorMessage(junkError);
      setError(message);
      await showAlert.error("Could not move lead to junk", message);
    } finally {
      setSaving(false);
    }
  };

  const updateStage = async (lead: CrmLead, stageId: number) => {
    try {
      await api.post(`/crm/leads/${lead.uuid}/stage`, { lead_stage_id: stageId });
      await Promise.all([loadLeads(), openDetails(lead)]);
      await showAlert.success("Pipeline stage updated");
    } catch (stageError) {
      const message = getErrorMessage(stageError);
      setError(message);
      await showAlert.error("Could not update stage", message);
    }
  };

  const addActivity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedLead) return;
    setSaving(true);
    try {
      await api.post(`/crm/leads/${selectedLead.uuid}/activities`, {
        activity_type: activityType,
        activity_date: new Date().toISOString(),
        summary: activitySummary.trim(),
        feedback: activityFeedback.trim() || undefined,
        next_followup_date: nextFollowup ? new Date(nextFollowup).toISOString() : undefined,
      });
      setActivitySummary("");
      setActivityFeedback("");
      setNextFollowup("");
      await openDetails(selectedLead);
      await showAlert.success("Activity added to lead timeline");
    } catch (activityError) {
      const message = getErrorMessage(activityError);
      setError(message);
      await showAlert.error("Could not log activity", message);
    } finally {
      setSaving(false);
    }
  };

  const addPropertyInterest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedLead) return;
    setSaving(true);
    try {
      await api.post(`/crm/leads/${selectedLead.uuid}/property-interests`, {
        ...interestForm,
        quoted_price: interestForm.quoted_price ? Number(interestForm.quoted_price) : undefined,
      });
      setInterestForm(emptyInterest);
      await openDetails(selectedLead);
      await showAlert.success("Property interest added");
    } catch (interestError) {
      const message = getErrorMessage(interestError);
      setError(message);
      await showAlert.error("Could not add property interest", message);
    } finally {
      setSaving(false);
    }
  };

  const addRequirement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedLead) return;
    setSaving(true);
    try {
      await api.post(`/crm/leads/${selectedLead.uuid}/requirements`, {
        ...requirementForm,
        size_sqft: requirementForm.size_sqft ? Number(requirementForm.size_sqft) : undefined,
        budget_min: requirementForm.budget_min ? Number(requirementForm.budget_min) : undefined,
        budget_max: requirementForm.budget_max ? Number(requirementForm.budget_max) : undefined,
      });
      setRequirementForm(emptyRequirement);
      await openDetails(selectedLead);
      await showAlert.success("Buyer requirement added");
    } catch (requirementError) {
      const message = getErrorMessage(requirementError);
      setError(message);
      await showAlert.error("Could not add requirement", message);
    } finally {
      setSaving(false);
    }
  };

  const convertLead = async (lead: CrmLead) => {
    if (!(await showAlert.confirm("Convert to Customer?", "This will mark the lead as converted/won. Continue?"))) return;
    try {
      await api.post(`/crm/leads/${lead.uuid}/convert`, { notes: "Converted via CRM" });
      await Promise.all([loadLeads(), openDetails(lead)]);
      await showAlert.success("Lead converted to customer");
    } catch (convertError) {
      const message = getErrorMessage(convertError);
      setError(message);
      await showAlert.error("Could not convert lead", message);
    }
  };

  const assignCall = async (lead: CrmLead) => {
    const assignedTo = prompt("Enter employee ID or name to assign call:");
    if (!assignedTo) return;
    try {
      await api.post(`/crm/leads/${lead.uuid}/call-assign`, {
        assigned_from: "current-user",
        assigned_to: assignedTo,
        assignment_date: new Date().toISOString(),
        instruction: "Follow up with the lead",
      });
      await Promise.all([loadLeads(), openDetails(lead)]);
      await showAlert.success("Call assigned successfully");
    } catch (assignError) {
      const message = getErrorMessage(assignError);
      setError(message);
      await showAlert.error("Could not assign call", message);
    }
  };

  const transferLead = async (lead: CrmLead) => {
    const transferredTo = prompt("Enter employee ID or name to transfer to:");
    if (!transferredTo) return;
    const reason = prompt("Enter transfer reason:");
    if (!reason) return;
    try {
      await api.post(`/crm/leads/${lead.uuid}/transfer`, {
        transferred_from: lead.assigned_to || "current-user",
        transferred_to: transferredTo,
        transfer_reason: reason,
      });
      await Promise.all([loadLeads(), openDetails(lead)]);
      await showAlert.success("Lead transferred successfully");
    } catch (transferError) {
      const message = getErrorMessage(transferError);
      setError(message);
      await showAlert.error("Could not transfer lead", message);
    }
  };

  const uploadAttachment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedLead || !attachmentFile) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("file", attachmentFile);
      formData.append("description", attachmentDescription);
      formData.append("lead_id", String(selectedLead.id));

      await api.post(`/crm/leads/${selectedLead.uuid}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAttachmentFile(null);
      setAttachmentDescription("");
      await openDetails(selectedLead);
      await showAlert.success("Attachment uploaded successfully");
    } catch (uploadError) {
      const message = getErrorMessage(uploadError);
      setError(message);
      await showAlert.error("Could not upload attachment", message);
    } finally {
      setSaving(false);
    }
  };

  const hotLeads = leads.filter((lead) => lead.priority === "high" || lead.priority === "urgent").length;
  const openLeads = leads.filter((lead) => lead.status === "active").length;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 text-foreground md:px-8">
      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-indigo-600">CRM / Leads / Lead List</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Lead Directory</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review, qualify and manage client inquiries. Move low-intent leads to junk.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold hover:bg-muted" aria-label="Refresh leads">
            <RefreshCw size={16} /> Refresh
          </button>
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">
            <Plus size={17} /> New lead
          </button>
        </div>
      </header>

      {error && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm font-medium text-rose-800">{error}</div>}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "All leads", value: leads.length, icon: UserRound },
          { label: "Active leads", value: openLeads, icon: Activity },
          { label: "High priority", value: hotLeads, icon: CalendarClock },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div><p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-black">{value}</p></div>
            <Icon className="text-indigo-600" size={24} />
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center">
          <label className="relative flex-1">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, code, phone, email..." className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </label>
          <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
            <option value="all">All stages</option>
            {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
          </select>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
            <option value="all">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
            <option value="all">All sources</option>
            {sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}
          </select>
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
            <option value="all">All priorities</option>
            {["urgent", "high", "medium", "low"].map((priority) => <option key={priority} value={priority}>{priority[0].toUpperCase() + priority.slice(1)}</option>)}
          </select>
          <input type="date" value={dateFromFilter} onChange={(event) => setDateFromFilter(event.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" placeholder="From" />
          <input type="date" value={dateToFilter} onChange={(event) => setDateToFilter(event.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" placeholder="To" />
          <span className="text-sm text-muted-foreground">{filteredLeads.length} shown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>{["Lead Code", "Client Name", "Phone", "Notes", "Score", "Stage", "Status", "Actions"].map((heading) => <th key={heading} className="px-4 py-3 font-extrabold">{heading}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Loading CRM leads…</td></tr> : filteredLeads.length === 0 ? <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No leads found. Add a lead or adjust your filters.</td></tr> :
                filteredLeads.map((lead) => (
                  <tr key={lead.uuid} className="hover:bg-muted/30">
                    <td className="px-4 py-4 font-mono text-xs font-bold text-indigo-600">{lead.lead_code || `#${lead.id}`}</td>
                    <td className="px-4 py-4"><p className="font-bold">{lead.client_name}</p>{lead.email && <p className="text-xs text-muted-foreground">{lead.email}</p>}</td>
                    <td className="px-4 py-4"><a className="font-medium hover:text-indigo-600" href={`tel:${lead.phone}`}>{lead.phone}</a></td>
                    <td className="max-w-[220px] truncate px-4 py-4 text-muted-foreground" title={lead.notes || ""}>{lead.notes || "—"}</td>
                    <td className="px-4 py-4 font-mono font-bold">{lead.lead_score ?? 0}</td>
                    <td className="px-4 py-4"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">{lead.stage?.name || "Unstaged"}</span></td>
                    <td className="px-4 py-4"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold capitalize text-blue-700">{lead.status || "active"}</span></td>
                    <td className="px-4 py-4"><div className="flex items-center gap-1">
                      <button type="button" title="View details" onClick={() => void openDetails(lead)} className="rounded-lg p-2 hover:bg-indigo-100 hover:text-indigo-700"><Eye size={16} /></button>
                      <button type="button" title="Edit lead" onClick={() => openEdit(lead)} className="rounded-lg px-2 py-1 text-xs font-bold hover:bg-muted">Edit</button>
                      <button type="button" title="Assign call" onClick={() => void assignCall(lead)} className="rounded-lg p-2 hover:bg-green-100 hover:text-green-700"><Phone size={16} /></button>
                      <button type="button" title="Transfer lead" onClick={() => void transferLead(lead)} className="rounded-lg p-2 hover:bg-amber-100 hover:text-amber-700"><RefreshCw size={16} /></button>
                      <button type="button" title="Convert to customer" onClick={() => void convertLead(lead)} className="rounded-lg px-2 py-1 text-xs font-bold hover:bg-emerald-100 hover:text-emerald-700">Convert</button>
                      <button type="button" title="Move to junk" onClick={() => openJunk(lead)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50"><Ban size={14} /> Junk</button>
                    </div></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="lead-form-title">
          <section className="my-8 w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between"><div><h2 id="lead-form-title" className="text-xl font-black">{editingLead ? "Edit lead" : "Create lead"}</h2><p className="text-sm text-muted-foreground">Saved directly to the CRM database.</p></div><button type="button" onClick={() => { setFormOpen(false); setEditingLead(null); setForm(emptyForm); }} aria-label="Close lead form"><X /></button></div>
            <form onSubmit={(event) => void saveLead(event)} className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required><input required value={form.client_name} onChange={(event) => setForm({ ...form, client_name: event.target.value })} /></Field>
              <Field label="Phone" required><input required type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
              <Field label="Alternate phone"><input type="tel" value={form.alternate_phone} onChange={(event) => setForm({ ...form, alternate_phone: event.target.value })} /></Field>
              <Field label="Email"><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
              <SelectField label="Lead category" value={form.lead_category_id} options={categories} onChange={(value) => setForm({ ...form, lead_category_id: value })} />
              <SelectField label="Pipeline stage" value={form.lead_stage_id} options={stages} onChange={(value) => setForm({ ...form, lead_stage_id: value })} />
              <SelectField label="Lead source" value={form.lead_source_id} options={sources} onChange={(value) => setForm({ ...form, lead_source_id: value })} />
              <SelectField label="Campaign" value={form.campaign_id} options={campaigns} onChange={(value) => setForm({ ...form, campaign_id: value })} />
              <SelectField label="Profession" value={form.profession_id} options={professions} onChange={(value) => setForm({ ...form, profession_id: value })} />
              <Field label="Priority"><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>{["low", "medium", "high", "urgent"].map((value) => <option key={value} value={value}>{value}</option>)}</select></Field>
              <Field label="Job title"><input value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} /></Field>
              <Field label="Company"><input value={form.organization} onChange={(event) => setForm({ ...form, organization: event.target.value })} /></Field>
              <Field label="Assigned representative"><input value={form.assigned_to} onChange={(event) => setForm({ ...form, assigned_to: event.target.value })} placeholder="Employee ID or name" /></Field>
              <Field label="Project ID"><input value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })} /></Field>
              <Field label="Address"><input value={form.present_address} onChange={(event) => setForm({ ...form, present_address: event.target.value })} /></Field>
              <div className="sm:col-span-2"><Field label="Notes / requirements"><textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field></div>
              <div className="flex justify-end gap-2 border-t border-border pt-4 sm:col-span-2"><button type="button" onClick={() => { setFormOpen(false); setEditingLead(null); setForm(emptyForm); }} className="rounded-xl border border-border px-4 py-2 text-sm font-bold">Cancel</button><button disabled={saving} className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving…" : editingLead ? "Save changes" : "Create lead"}</button></div>
            </form>
          </section>
        </div>
      )}

      {selectedLead && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/50" role="dialog" aria-modal="true" aria-labelledby="lead-detail-title">
          <section className="h-full w-full max-w-2xl overflow-y-auto bg-background p-5 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between border-b border-border pb-5">
              <div><p className="font-mono text-xs font-bold text-indigo-600">{selectedLead.lead_code}</p><h2 id="lead-detail-title" className="mt-1 text-2xl font-black">{selectedLead.client_name}</h2><p className="mt-1 text-sm text-muted-foreground">{selectedLead.phone}{selectedLead.email ? ` · ${selectedLead.email}` : ""}</p></div>
              <button type="button" onClick={() => setSelectedLead(null)} aria-label="Close lead details" className="rounded-lg p-2 hover:bg-muted"><X /></button>
            </div>
            <div className="grid gap-3 py-5 sm:grid-cols-2">
              <Detail label="Source" value={selectedLead.source?.name} /><Detail label="Category" value={selectedLead.category?.name} />
              <Detail label="Organization" value={selectedLead.organization} /><Detail label="Owner" value={selectedLead.assigned_to} />
              <Detail label="Created" value={formatDate(selectedLead.createdAt)} /><Detail label="Status" value={selectedLead.status} />
            </div>
            <label className="block text-sm font-bold">Pipeline stage
              <select className="mt-1 w-full rounded-xl border border-border bg-card p-2.5" value={selectedLead.lead_stage_id || ""} onChange={(event) => void updateStage(selectedLead, Number(event.target.value))}>
                <option value="" disabled>Select stage</option>{stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
              </select>
            </label>
            {selectedLead.notes && <p className="my-5 whitespace-pre-wrap rounded-xl bg-muted/50 p-4 text-sm">{selectedLead.notes}</p>}
            <section className="mt-7 border-t border-border pt-5">
              <h3 className="mb-3 text-lg font-black">Property interests</h3>
              {selectedLead.property_interests?.length ? <ul className="mb-4 space-y-2">{selectedLead.property_interests.map((interest) => <li key={interest.uuid} className="rounded-xl border border-border p-3 text-sm"><p className="font-bold">{interest.project_name || "Property"}{interest.plot_flat_no ? ` · ${interest.plot_flat_no}` : ""}</p><p className="text-muted-foreground">{[interest.size, interest.status, interest.quoted_price ? `৳${Number(interest.quoted_price).toLocaleString()}` : ""].filter(Boolean).join(" · ")}</p></li>)}</ul> : <p className="mb-4 text-sm text-muted-foreground">No property interests recorded.</p>}
              <form onSubmit={(event) => void addPropertyInterest(event)} className="grid gap-3 sm:grid-cols-2">
                <Field label="Project / property" required><input required value={interestForm.project_name} onChange={(event) => setInterestForm({ ...interestForm, project_name: event.target.value })} /></Field>
                <Field label="Flat / plot"><input value={interestForm.plot_flat_no} onChange={(event) => setInterestForm({ ...interestForm, plot_flat_no: event.target.value })} /></Field>
                <Field label="Size"><input value={interestForm.size} onChange={(event) => setInterestForm({ ...interestForm, size: event.target.value })} /></Field>
                <Field label="Quoted price"><input type="number" min="0" value={interestForm.quoted_price} onChange={(event) => setInterestForm({ ...interestForm, quoted_price: event.target.value })} /></Field>
                <button disabled={saving} className="rounded-xl border border-indigo-200 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60 sm:col-span-2">Add property interest</button>
              </form>
            </section>
            <section className="mt-7 border-t border-border pt-5">
              <h3 className="mb-3 text-lg font-black">Buyer requirements</h3>
              {selectedLead.requirements?.length ? <ul className="mb-4 space-y-2">{selectedLead.requirements.map((requirement) => <li key={requirement.uuid} className="rounded-xl border border-border p-3 text-sm"><p className="font-bold">{requirement.property_type || "Property"}{requirement.preferred_area ? ` · ${requirement.preferred_area}` : ""}</p><p className="text-muted-foreground">{[requirement.size_sqft ? `${requirement.size_sqft} sqft` : "", requirement.budget_min || requirement.budget_max ? `৳${Number(requirement.budget_min || 0).toLocaleString()}–${Number(requirement.budget_max || 0).toLocaleString()}` : "", requirement.remarks].filter(Boolean).join(" · ")}</p></li>)}</ul> : <p className="mb-4 text-sm text-muted-foreground">No buyer requirements recorded.</p>}
              <form onSubmit={(event) => void addRequirement(event)} className="grid gap-3 sm:grid-cols-2">
                <Field label="Property type"><input value={requirementForm.property_type} onChange={(event) => setRequirementForm({ ...requirementForm, property_type: event.target.value })} /></Field>
                <Field label="Preferred area"><input value={requirementForm.preferred_area} onChange={(event) => setRequirementForm({ ...requirementForm, preferred_area: event.target.value })} /></Field>
                <Field label="Size (sqft)"><input type="number" min="0" value={requirementForm.size_sqft} onChange={(event) => setRequirementForm({ ...requirementForm, size_sqft: event.target.value })} /></Field>
                <Field label="Minimum budget"><input type="number" min="0" value={requirementForm.budget_min} onChange={(event) => setRequirementForm({ ...requirementForm, budget_min: event.target.value })} /></Field>
                <Field label="Maximum budget"><input type="number" min="0" value={requirementForm.budget_max} onChange={(event) => setRequirementForm({ ...requirementForm, budget_max: event.target.value })} /></Field>
                <Field label="Remarks"><input value={requirementForm.remarks} onChange={(event) => setRequirementForm({ ...requirementForm, remarks: event.target.value })} /></Field>
                <button disabled={saving} className="rounded-xl border border-indigo-200 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60 sm:col-span-2">Add requirement</button>
              </form>
            </section>
            <section className="mt-7 border-t border-border pt-5">
              <h3 className="mb-4 text-lg font-black">Log an activity</h3>
              <form onSubmit={(event) => void addActivity(event)} className="space-y-3">
                <label className="block text-sm font-bold">Activity type<select required value={activityType} onChange={(event) => setActivityType(event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card p-2.5">{["call", "meeting", "visit", "whatsapp", "email", "follow_up"].map((type) => <option key={type} value={type}>{type.replace("_", " ")}</option>)}</select></label>
                <label className="block text-sm font-bold">Summary<textarea required rows={2} value={activitySummary} onChange={(event) => setActivitySummary(event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card p-2.5" placeholder="What happened?" /></label>
                <label className="block text-sm font-bold">Feedback<textarea rows={2} value={activityFeedback} onChange={(event) => setActivityFeedback(event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card p-2.5" placeholder="Outcome or next step" /></label>
                <label className="block text-sm font-bold">Schedule follow-up<input type="datetime-local" value={nextFollowup} onChange={(event) => setNextFollowup(event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card p-2.5" /></label>
                <button disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving…" : "Add to timeline"}</button>
              </form>
            </section>
            <section className="mt-8 border-t border-border pt-5">
              <h3 className="mb-4 text-lg font-black">Activity timeline</h3>
              {!selectedLead.activities?.length ? <p className="text-sm text-muted-foreground">No activity has been logged for this lead.</p> : <ol className="space-y-4">{[...selectedLead.activities].sort((a, b) => b.activity_date.localeCompare(a.activity_date)).map((activity) => <li key={activity.uuid} className="border-l-2 border-indigo-200 pl-4"><p className="text-xs font-bold uppercase text-indigo-600">{activity.activity_type.replace("_", " ")} · {formatDate(activity.activity_date)}</p><p className="mt-1 text-sm font-semibold">{activity.summary}</p>{activity.feedback && <p className="mt-1 text-sm text-muted-foreground">{activity.feedback}</p>}{activity.next_followup_date && <p className="mt-1 text-xs text-amber-700">Follow-up: {formatDate(activity.next_followup_date)}</p>}</li>)}</ol>}
            </section>
            <section className="mt-8 border-t border-border pt-5">
              <h3 className="mb-4 text-lg font-black">Attachments</h3>
              {selectedLead.attachments?.length ? <ul className="mb-4 space-y-2">{selectedLead.attachments.map((attachment) => <li key={attachment.uuid} className="rounded-xl border border-border p-3 text-sm"><p className="font-bold">{attachment.file_name || "Attachment"}</p><p className="text-muted-foreground">{attachment.description || "No description"}</p><p className="text-xs text-indigo-600">{formatDate(attachment.createdAt)}</p></li>)}</ul> : <p className="mb-4 text-sm text-muted-foreground">No attachments uploaded.</p>}
              <form onSubmit={(event) => void uploadAttachment(event)} className="space-y-3">
                <label className="block text-sm font-bold">Upload File<input type="file" onChange={(event) => setAttachmentFile(event.target.files?.[0] || null)} className="mt-1 w-full rounded-xl border border-border bg-card p-2.5" /></label>
                <label className="block text-sm font-bold">Description<input type="text" value={attachmentDescription} onChange={(event) => setAttachmentDescription(event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card p-2.5" placeholder="File description..." /></label>
                <button disabled={saving || !attachmentFile} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? "Uploading…" : "Upload Attachment"}</button>
              </form>
            </section>
            <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-5">
              <a href={`tel:${selectedLead.phone}`} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold"><Phone size={16} /> Call</a>
              {selectedLead.email && <a href={`mailto:${selectedLead.email}`} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold"><Mail size={16} /> Email</a>}
              {selectedLead.projectId && <span className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground"><Building2 size={16} /> {selectedLead.projectId}</span>}
              <button type="button" onClick={() => void assignCall(selectedLead)} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50"><Phone size={16} /> Assign Call</button>
              <button type="button" onClick={() => void transferLead(selectedLead)} className="inline-flex items-center gap-2 rounded-xl border border-amber-200 px-4 py-2 text-sm font-bold text-amber-700 hover:bg-amber-50"><RefreshCw size={16} /> Transfer</button>
              <button type="button" onClick={() => void convertLead(selectedLead)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">Convert to Customer</button>
              <button type="button" onClick={() => openJunk(selectedLead)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50"><Ban size={16} /> Move to Junk</button>
            </div>
          </section>
        </div>
      )}

      {junkTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="junk-title" onMouseDown={(event) => event.target === event.currentTarget && setJunkTarget(null)}>
          <form onSubmit={(event) => void confirmJunk(event)} className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 id="junk-title" className="text-lg font-black">Move to junk</h2>
                <p className="mt-1 text-sm text-muted-foreground"><strong>{junkTarget.client_name}</strong> ({junkTarget.lead_code}) will move to Junk Leads. You can restore it from there.</p>
              </div>
              <button type="button" onClick={() => setJunkTarget(null)} aria-label="Close" className="rounded-lg p-2 hover:bg-muted"><X size={18} /></button>
            </div>
            <label className="block text-sm font-bold">Reason
              <textarea rows={3} value={junkReason} onChange={(event) => setJunkReason(event.target.value)} placeholder="e.g. Unreachable, wrong number, not interested" className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm font-normal" />
            </label>
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button type="button" onClick={() => setJunkTarget(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-bold">Cancel</button>
              <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"><Ban size={15} /> {saving ? "Moving…" : "Move to Junk"}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="block text-sm font-bold [&_input]:mt-1 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-border [&_input]:bg-background [&_input]:p-2.5 [&_input]:text-sm [&_textarea]:mt-1 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-border [&_textarea]:bg-background [&_textarea]:p-2.5 [&_textarea]:text-sm [&_select]:mt-1 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-border [&_select]:bg-background [&_select]:p-2.5 [&_select]:text-sm">{label}{required && <span className="text-rose-600"> *</span>}{children}</label>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: CrmOption[]; onChange: (value: string) => void }) {
  return <label className="block text-sm font-bold">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm"><option value="">Not specified</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>;
}

function Detail({ label, value }: { label: string; value?: string }) {
  return <div className="rounded-xl border border-border p-3"><p className="text-xs font-bold uppercase text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value || "—"}</p></div>;
}