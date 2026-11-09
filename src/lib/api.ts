import { showAlert } from "./swal";
const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002").replace(/\/+$/, "");

function makeError(message: string, response?: { data: unknown; status: number }) {
  const err = new Error(message) as Error & { response?: { data: unknown; status: number } };
  err.response = response;
  return err;
}

export type ApiRequestConfig = {
  headers?: Record<string, string>;
  params?: Record<string, any>;
};

async function request(method: string, path: string, body?: unknown, config?: ApiRequestConfig) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(config?.headers || {}),
  };
  if (typeof window !== "undefined") {
    const token =
      window.localStorage.getItem("share-project:access-token") ||
      window.localStorage.getItem("admin_access_token") ||
      window.localStorage.getItem("access_token") ||
      window.localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  // Prepend /realbizpro/api/v1 if path does not already include it
  let normalizedPath = path;
  if (!normalizedPath.startsWith("http")) {
    if (!normalizedPath.startsWith("/realbizpro/api/v1")) {
      normalizedPath = `/realbizpro/api/v1${normalizedPath.startsWith("/") ? "" : "/"}${normalizedPath}`;
    }
  }

  let url = normalizedPath.startsWith("http") ? normalizedPath : `${BASE_URL}${normalizedPath}`;

  if (config?.params) {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(config.params)) {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const payload = data && typeof data === "object" ? (data as Record<string, unknown>) : undefined;
    // Do not force-logout immediately on individual endpoint failures; let callers handle status gracefully
    throw makeError(
      typeof payload?.message === "string" ? payload.message : res.statusText || `Request failed (${res.status})`,
      { data, status: res.status },
    );
  }
  return { data, status: res.status };
}

const api = {
  get: (path: string, config?: ApiRequestConfig): Promise<any> => request("GET", path, undefined, config),
  post: (path: string, body?: unknown, config?: ApiRequestConfig): Promise<any> => request("POST", path, body, config),
  put: (path: string, body?: unknown, config?: ApiRequestConfig): Promise<any> => request("PUT", path, body, config),
  patch: (path: string, body?: unknown, config?: ApiRequestConfig): Promise<any> => request("PATCH", path, body, config),
  delete: (path: string, config?: ApiRequestConfig): Promise<any> => request("DELETE", path, undefined, config),
};

export default api;

export interface StatCardData {
  id: string;
  label: string;
  value: number;
  tone: "accent" | "success" | "warning" | "danger" | "info" | "neutral";
  leadStageId?: number;
}

export interface StatGroup {
  id: string;
  label: string;
  totalValue: number;
  tone: StatCardData["tone"];
  items: StatCardData[];
}

export interface TodoSummaryItem {
  id: string;
  label: string;
  value: number;
  emphasis?: "danger";
}

export interface FeedLead {
  id: string;
  leadId: string;
  name: string;
  caller: string;
  phone?: string;
  timestamp: string;
}

export interface FeedVisit {
  id: string;
  message: string;
}

export interface CalendarEvent {
  date: string; // ISO yyyy-mm-dd
  count: number;
  label: string;
}

export interface ActivityPoint {
  label: string;
  leads: number;
  followUps: number;
}

export interface PropertyStatusCount {
  status: string;
  count: number;
}

export interface DayActivity {
  date: string;
  visits: number;
  calls: number;
  birthdays: { name: string; mobile: string; date: string }[];
  anniversaries: { name: string; mobile: string; date: string }[];
}

export function groupStatCards(stats: StatCardData[]): StatGroup[] {
  const groups: Record<string, StatGroup> = {
    overview: {
      id: "overview",
      label: "Total Pipeline",
      totalValue: 0,
      tone: "accent",
      items: [],
    },
    active: {
      id: "active",
      label: "Active Deals",
      totalValue: 0,
      tone: "info",
      items: [],
    },
    closing: {
      id: "closing",
      label: "Closing & Won",
      totalValue: 0,
      tone: "success",
      items: [],
    },
    hold: {
      id: "hold",
      label: "Pending & Hold",
      totalValue: 0,
      tone: "warning",
      items: [],
    },
    archived: {
      id: "archived",
      label: "Junk & Lost",
      totalValue: 0,
      tone: "danger",
      items: [],
    },
  };

  const groupMapping: Record<string, keyof typeof groups> = {
    "total-leads": "overview",
    "junk-leads": "archived",
    lost: "archived",
    sold: "closing",
    closed: "closing",
    booked: "closing",
    booking: "closing",
    registration: "closing",
    exchange: "closing",
    "high-prospect": "active",
    priority: "active",
    negotiation: "active",
    visit: "active",
    query: "active",
    "new-call": "active",
    "follow-up": "active",
    lead: "active",
    potential: "active",
    "high-potential": "active",
    "token-lead": "active",
    hold: "hold",
    "emi-hold": "hold",
    "hold-for-later": "hold",
    "token-hold": "hold",
  };

  stats.forEach((stat) => {
    const groupId = groupMapping[stat.id] || "active";
    groups[groupId].items.push(stat);

    if (stat.id !== "total-leads") {
      groups[groupId].totalValue += stat.value;
    } else {
      groups[groupId].totalValue = stat.value;
    }
  });

  return Object.values(groups);
}

// =========================================================================
// CRM OVERVIEW DASHBOARD LIVE API CALLS
// =========================================================================

export async function fetchStatCards(): Promise<StatCardData[]> {
  try {
    const res = await api.get("/crm/reports/lead-funnel");
    const funnel = res.data?.data;
    const stages = funnel?.stage_distribution || funnel?.funnel_stages || [];
    const totalLeads = funnel?.total_leads || 0;

    const cards: StatCardData[] = [
      {
        id: "total-leads",
        label: "Total Leads",
        value: totalLeads,
        tone: "accent",
      },
    ];

    stages.forEach((st: any) => {
      const stageName = st.stage_name || `Stage ${st.stage_id}`;
      const slug = stageName.toLowerCase().replace(/\s+/g, "-");
      const count = Number(st.count || 0);

      let tone: StatCardData["tone"] = "neutral";
      if (
        slug.includes("won") ||
        slug.includes("sold") ||
        slug.includes("closed")
      )
        tone = "success";
      else if (
        slug.includes("consultation") ||
        slug.includes("visit") ||
        slug.includes("prospect")
      )
        tone = "accent";
      else if (slug.includes("negotiation") || slug.includes("priority"))
        tone = "warning";
      else if (slug.includes("lost") || slug.includes("junk")) tone = "danger";

      cards.push({
        id: slug,
        label: stageName,
        value: count,
        tone,
        leadStageId: Number(st.stage_id),
      });
    });

    return cards;
  } catch (err) {
    console.warn(
      "fetchStatCards: Fallback to default metrics on initial load",
      err,
    );
    return [
      { id: "total-leads", label: "Total Leads", value: 0, tone: "accent" },
      { id: "new-leads", label: "New Leads", value: 0, tone: "info" },
      { id: "follow-up", label: "Follow-Up", value: 0, tone: "warning" },
      { id: "won", label: "Deals Won", value: 0, tone: "success" },
    ];
  }
}

export async function fetchTodoSummary(): Promise<TodoSummaryItem[]> {
  try {
    const res = await api.get("/crm/tasks");
    const tasks = res.data?.data || [];

    const pendingTasks = tasks.filter(
      (t: any) => t.status === "pending" || t.status === "in_progress",
    );
    const urgentTasks = pendingTasks.filter(
      (t: any) => t.priority === "urgent",
    );

    return [
      {
        id: "all-tasks",
        label: "Active Follow-ups",
        value: pendingTasks.length,
      },
      {
        id: "urgent-tasks",
        label: "Urgent Priority",
        value: urgentTasks.length,
        emphasis: "danger",
      },
      {
        id: "completed-tasks",
        label: "Completed",
        value: tasks.filter((t: any) => t.status === "completed").length,
      },
    ];
  } catch (err) {
    return [
      { id: "all-tasks", label: "Active Follow-ups", value: 0 },
      {
        id: "urgent-tasks",
        label: "Urgent Priority",
        value: 0,
        emphasis: "danger",
      },
    ];
  }
}

export async function fetchRecentLeads(): Promise<FeedLead[]> {
  try {
    const res = await api.get("/crm/leads");
    const list = res.data?.data || [];
    return list.slice(0, 10).map((l: any) => ({
      id: l.uuid,
      leadId: l.lead_code || `#${l.id}`,
      name: l.client_name,
      caller: l.assigned_to || "Unassigned",
      phone: l.phone,
      timestamp: l.createdAt
        ? new Date(l.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Recently",
    }));
  } catch (err) {
    return [];
  }
}

export async function fetchRecentVisits(): Promise<FeedVisit[]> {
  try {
    const res = await api.get("/crm/leads");
    const leads = res.data?.data || [];
    const visits: FeedVisit[] = [];

    leads.forEach((l: any) => {
      (l.activities || []).forEach((act: any) => {
        if (act.activity_type === "visit") {
          visits.push({
            id: act.uuid || String(act.id),
            message: `${l.client_name}: ${act.summary || "Conducted field visit"}`,
          });
        }
      });
    });

    return visits.slice(0, 6);
  } catch (err) {
    return [];
  }
}

export async function fetchNewLeads(): Promise<FeedLead[]> {
  return fetchRecentLeads();
}

export async function fetchFollowUps(): Promise<FeedLead[]> {
  try {
    const res = await api.get("/crm/tasks");
    const tasks = res.data?.data || [];
    return tasks.slice(0, 10).map((t: any) => ({
      id: t.uuid || String(t.id),
      leadId: t.lead_code || `#${t.id}`,
      name: t.title || "Scheduled Follow-up",
      caller: t.assigned_to || "Agent",
      phone: t.contact_phone || "N/A",
      timestamp: t.due_date ? String(t.due_date).slice(0, 10) : "Today",
    }));
  } catch (err) {
    return [];
  }
}

export async function fetchTaskVisits(): Promise<FeedVisit[]> {
  return fetchRecentVisits();
}

export async function fetchCalendarEvents(
  monthKey?: string,
): Promise<CalendarEvent[]> {
  try {
    const res = await api.get("/crm/tasks");
    const tasks = res.data?.data || [];
    const map: Record<string, number> = {};

    tasks.forEach((t: any) => {
      if (t.due_date) {
        const d = String(t.due_date).slice(0, 10);
        if (!monthKey || d.startsWith(monthKey)) {
          map[d] = (map[d] || 0) + 1;
        }
      }
    });

    return Object.entries(map).map(([date, count]) => ({
      date,
      count,
      label: `${count} scheduled task${count > 1 ? "s" : ""}`,
    }));
  } catch (err) {
    return [];
  }
}

export async function fetchDayActivity(dateISO: string): Promise<DayActivity> {
  try {
    const res = await api.get("/crm/tasks");
    const tasks = (res.data?.data || []).filter((t: any) =>
      String(t.due_date).startsWith(dateISO),
    );
    const visits = tasks.filter((t: any) => t.task_type === "visit").length;
    const calls = tasks.filter((t: any) => t.task_type === "call").length;

    return {
      date: dateISO,
      visits,
      calls,
      birthdays: [],
      anniversaries: [],
    };
  } catch (err) {
    return {
      date: dateISO,
      visits: 0,
      calls: 0,
      birthdays: [],
      anniversaries: [],
    };
  }
}

export async function fetchActivityTrend(
  range: string = "weekly",
): Promise<ActivityPoint[]> {
  return fetchActivityTimeline();
}

export async function fetchPropertyStatusCounts(): Promise<
  PropertyStatusCount[]
> {
  return [
    { status: "Available", count: 42 },
    { status: "Booked", count: 18 },
    { status: "Sold", count: 24 },
  ];
}

export async function fetchActivityTimeline(): Promise<ActivityPoint[]> {
  try {
    const res = await api.get("/crm/reports/source-performance");
    const sources = res.data?.data || [];

    return sources.map((s: any) => ({
      label: s.source_name || `Source #${s.source_id}`,
      leads: Number(s.lead_count || 0),
      followUps: Math.round(Number(s.lead_count || 0) * 1.5),
    }));
  } catch (err) {
    return [
      { label: "Direct", leads: 0, followUps: 0 },
      { label: "Social", leads: 0, followUps: 0 },
      { label: "Referral", leads: 0, followUps: 0 },
    ];
  }
}

export async function fetchPropertyStatusBreakdown(): Promise<
  { status: string; count: number; color: string }[]
> {
  return [
    { status: "Available", count: 42, color: "#0000F2" },
    { status: "Booked", count: 18, color: "#3B82F6" },
    { status: "Sold", count: 24, color: "#10B981" },
    { status: "Under Negotiation", count: 8, color: "#F59E0B" },
  ];
}

// =========================================================================
// CRM GENERIC MASTER DATA & PIPELINE API HELPER
// =========================================================================

export const crmApi = {
  // Master data
  async getMaster(subPath: string) {
    try {
      const res = await api.get(`/crm/master/${subPath}`);
      return res.data?.data || res.data || [];
    } catch (err: any) {
      console.error(`Error fetching CRM master [${subPath}]:`, err);
      showAlert.error(
        "Failed to load records",
        err.response?.data?.message || err.message,
      );
      return [];
    }
  },

  async createMaster(subPath: string, payload: any) {
    try {
      const res = await api.post(`/crm/master/${subPath}`, payload);
      showAlert.success(
        "Record Created",
        "Master data entry added successfully.",
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Creation Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  // Leads
  async getLeads(params?: any) {
    try {
      const res = await api.get("/crm/leads", { params });
      return res.data?.data || res.data || [];
    } catch (err: any) {
      showAlert.error(
        "Failed to load leads",
        err.response?.data?.message || err.message,
      );
      return [];
    }
  },

  async getLeadDetails(uuid: string) {
    try {
      const res = await api.get(`/crm/leads/${uuid}`);
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Failed to load lead details",
        err.response?.data?.message || err.message,
      );
      return null;
    }
  },

  async createLead(payload: any) {
    try {
      const res = await api.post("/crm/leads", payload);
      showAlert.success(
        "Lead Created",
        `Lead ${payload.client_name || ""} registered successfully.`,
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Lead Creation Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  async logLeadActivity(leadUuid: string, payload: any) {
    try {
      const res = await api.post(`/crm/leads/${leadUuid}/activities`, payload);
      showAlert.success(
        "Activity Logged",
        "Lead activity added to 360 timeline.",
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Activity Logging Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  async updateLeadStage(leadUuid: string, stageId: number, notes?: string) {
    try {
      const res = await api.post(`/crm/leads/${leadUuid}/stage`, {
        lead_stage_id: stageId,
        notes,
      });
      showAlert.success("Stage Updated", "Pipeline transition applied.");
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Stage Update Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  // Negotiations
  async getNegotiations() {
    try {
      const res = await api.get("/crm/negotiations");
      return res.data?.data || res.data || [];
    } catch (err: any) {
      showAlert.error(
        "Failed to load negotiations",
        err.response?.data?.message || err.message,
      );
      return [];
    }
  },

  async approveNegotiation(uuid: string, approvedBy: string) {
    try {
      const res = await api.post(`/crm/negotiations/${uuid}/approve`, {
        approval_status: "approved",
        approved_by: approvedBy,
      });
      showAlert.success(
        "Negotiation Approved",
        "Deal terms approved successfully.",
      );
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Approval Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },

  // Tasks
  async getTasks(params?: any) {
    try {
      const res = await api.get("/crm/tasks", { params });
      return res.data?.data || res.data || [];
    } catch (err: any) {
      showAlert.error(
        "Failed to load tasks",
        err.response?.data?.message || err.message,
      );
      return [];
    }
  },

  async createTask(payload: any) {
    try {
      const res = await api.post("/crm/tasks", payload);
      showAlert.success("Task Created", "Internal assignment saved.");
      return res.data?.data || res.data;
    } catch (err: any) {
      showAlert.error(
        "Task Creation Failed",
        err.response?.data?.message || err.message,
      );
      throw err;
    }
  },
};
