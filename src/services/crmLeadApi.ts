import api from "@/lib/api";

type ApiRecord = Record<string, any>;
const unwrap = (response: any) => response?.data?.data ?? response?.data ?? response;
const rowsOf = (response: any): ApiRecord[] => {
  const value = unwrap(response);
  return Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [];
};
const pageMeta = (response: any) => response?.data?.meta ?? response?.meta ?? {};
const first = (...values: any[]) => values.find((value) => value !== undefined && value !== null && value !== "");

export function mapLead(row: ApiRecord): ApiRecord {
  const activity = row.activities?.[0];
  const interest = row.propertyInterests?.[0];
  return {
    id: row.uuid ?? String(row.id), uuid: row.uuid, leadId: first(row.leadCode, row.lead_code, String(row.id)),
    name: first(row.clientName, row.client_name, ""), phone: first(row.phone, ""), secondaryNumber: first(row.alternatePhone, row.alternate_phone, ""),
    address: first(row.presentAddress, row.present_address, row.permanentAddress, row.permanent_address, ""), organization: row.organization ?? "", designation: row.designation ?? "", email: row.email ?? "",
    badge: row.status === "converted" ? "Sold" : first(row.stage?.name, row.priority, row.status, "New Assignment"),
    srOfficer: first(row.assignedUser?.name, row.assignedUser?.user?.name, row.assignedTo, row.assigned_to, "Unassigned"), srOfficerId: first(row.assignedTo, row.assigned_to, ""),
    cr: first(row.creditOfficer?.name, row.creditOfficerId, row.credit_officer_id, ""), crId: first(row.creditOfficerId, row.credit_officer_id, ""), avatarUrl: row.avatarUrl ?? row.avatar_url,
    leadSource: first(row.source?.name, row.leadSource, ""), leadSourceId: row.leadSourceId ?? row.lead_source_id,
    interestedProject: first(interest?.projectName, interest?.project?.name, row.project?.name, ""), interestedProjectId: first(interest?.projectId, row.projectId, ""),
    leadCategory: first(row.category?.name, row.leadCategory, ""), leadCategoryId: row.leadCategoryId ?? row.lead_category_id,
    campaign: first(row.campaign?.name, ""), campaignId: row.campaignId ?? row.campaign_id,
    birthDate: row.birthDate ?? row.birth_date, anniversaryDate: row.anniversaryDate ?? row.anniversary_date,
    profession: first(row.profession?.name, row.professionName, ""), professionId: row.professionId ?? row.profession_id,
    createdAt: row.createdAt ?? row.created_at,
    lastActivity: activity ? `${activity.activityType ?? activity.activity_type ?? "Activity"}\n${activity.summary ?? ""}` : "",
    nextActivity: activity?.nextFollowupDate ?? activity?.next_followup_date ?? "", remark: row.initialRemark ?? row.initial_remark ?? row.notes ?? "", query: row.query ?? "",
    leadDate: row.leadDate ?? row.lead_date, stageId: first(row.leadStageId, row.lead_stage_id, row.stage?.id), status: row.status ?? "active", raw: row,
  };
}

export const crmLeadApi = {
  async listAllLeads(params: ApiRecord = {}) {
    const limit = 100;
    const firstPage = await api.get("/crm/leads", { params: { ...params, page: 1, limit } });
    const all = rowsOf(firstPage);
    const totalPages = Math.max(1, Number(pageMeta(firstPage).totalPages ?? 1));
    for (let page = 2; page <= totalPages; page += 1) {
      all.push(...rowsOf(await api.get("/crm/leads", { params: { ...params, page, limit } })));
    }
    return { data: all.map(mapLead), meta: pageMeta(firstPage) };
  },
  async createLead(payload: ApiRecord) { return mapLead(unwrap(await api.post("/crm/leads", payload))); },
  async updateLead(uuid: string, payload: ApiRecord) { return mapLead(unwrap(await api.patch(`/crm/leads/${uuid}`, payload))); },
  async deleteLead(uuid: string) { return unwrap(await api.delete(`/crm/leads/${uuid}`)); },
  async details(uuid: string) { return unwrap(await api.get(`/crm/call-center-follow-up/leads/${uuid}`)); },
  async dropdown(entity: string) { return rowsOf(await api.get(`/crm/leads/dropdown/${entity}`)); },
  async callAssign(payload: ApiRecord) { return unwrap(await api.post("/crm/leads/call-assign", payload)); },
  async transfer(payload: ApiRecord) { return unwrap(await api.post("/crm/leads/transfer", payload)); },
  async bulkImport(rows: ApiRecord[]) { return unwrap(await api.post("/crm/leads/bulk-import", { rows })); },
  async addActivity(uuid: string, payload: ApiRecord) { return unwrap(await api.post(`/crm/call-center-follow-up/leads/${uuid}/activities`, payload)); },
  async addNote(uuid: string, note: string) { return unwrap(await api.post(`/crm/call-center-follow-up/leads/${uuid}/notes`, { note })); },
  async requirements(uuid: string) { return rowsOf(await api.get(`/crm/call-center-follow-up/leads/${uuid}/requirements`)); },
  async addRequirement(uuid: string, payload: ApiRecord) { return unwrap(await api.post(`/crm/call-center-follow-up/leads/${uuid}/requirements`, payload)); },
  async interests(uuid: string) { return rowsOf(await api.get(`/crm/call-center-follow-up/leads/${uuid}/property-interests`)); },
  async addInterest(uuid: string, payload: ApiRecord) { return unwrap(await api.post(`/crm/call-center-follow-up/leads/${uuid}/property-interests`, payload)); },
  async negotiations(uuid: string) { return rowsOf(await api.get(`/crm/call-center-follow-up/leads/${uuid}/negotiations`)); },
  async activities(uuid: string, tab: string) { return rowsOf(await api.get(`/crm/call-center-follow-up/leads/${uuid}/${tab}`)); },
  async junk(params: ApiRecord = {}) { return api.get("/crm/leads/junk", { params }); },
  async listAllJunk(params: ApiRecord = {}) {
    const firstPage = await api.get("/crm/leads/junk", { params: { ...params, page: 1, limit: 100 } });
    const all = rowsOf(firstPage);
    const totalPages = Math.max(1, Number(pageMeta(firstPage).totalPages ?? 1));
    for (let page = 2; page <= totalPages; page += 1) all.push(...rowsOf(await api.get("/crm/leads/junk", { params: { ...params, page, limit: 100 } })));
    return { data: all.map(mapLead), meta: pageMeta(firstPage) };
  },
  async restoreJunk(uuid: string) { return unwrap(await api.patch(`/crm/leads/junk/${uuid}/restore`)); },
  async deleteJunk(uuid: string) { return unwrap(await api.delete(`/crm/leads/junk/${uuid}`)); },
  async bulkJunkAction(path: string, uuids: string[]) { return unwrap(await api.post(`/crm/leads/junk/${path}`, { uuids })); },
  async transferList(params: ApiRecord = {}) { return api.get("/crm/leads/transfer-list", { params }); },
  async listAllTransfers(params: ApiRecord = {}) {
    const firstPage = await api.get("/crm/leads/transfer-list", { params: { ...params, page: 1, limit: 100 } });
    const all = rowsOf(firstPage);
    const totalPages = Math.max(1, Number(pageMeta(firstPage).totalPages ?? 1));
    for (let page = 2; page <= totalPages; page += 1) all.push(...rowsOf(await api.get("/crm/leads/transfer-list", { params: { ...params, page, limit: 100 } })));
    return { data: all, meta: pageMeta(firstPage) };
  },
};

export const crmDirectoryApi = {
  async parties(params: ApiRecord = {}) {
    const response = await api.get("/crm/parties", { params: { ...params, page: 1, limit: 100 } });
    const meta = pageMeta(response); const all = rowsOf(response);
    for (let page = 2; page <= Number(meta.totalPages ?? 1); page += 1) all.push(...rowsOf(await api.get("/crm/parties", { params: { ...params, page, limit: 100 } })));
    return all.map((row: any) => ({ uuid: row.uuid, name: row.name, phone: row.phone, email: row.email ?? "", nid: row.nidNumber ?? "", address: row.address ?? "", type: String(row.partyType ?? "Other").toLowerCase(), tags: typeof row.tags === "string" ? row.tags.split(",").map((tag: string) => tag.trim()).filter(Boolean) : row.tags ?? [], assignee: row.assignee?.name ?? [row.assignee?.firstName, row.assignee?.lastName].filter(Boolean).join(" ") ?? "", assigneeUuid: row.assignedToUuid, created_at: row.createdAt?.slice?.(0, 10) ?? row.createdAt }));
  },
  async saveParty(payload: ApiRecord, uuid?: string) {
    const data = { name: payload.name, phone: payload.phone, email: payload.email || undefined, nidNumber: payload.nid || undefined, address: payload.address || undefined, partyType: payload.type?.[0]?.toUpperCase() + payload.type?.slice(1), tags: payload.tagsInput || "" };
    return unwrap(uuid ? await api.patch(`/crm/parties/${uuid}`, data) : await api.post("/crm/parties", data));
  },
  async deleteParty(uuid: string) { return unwrap(await api.delete(`/crm/parties/${uuid}`)); },
  async assignParty(uuid: string, assigneeUuid: string, note?: string) { return unwrap(await api.post(`/crm/parties/${uuid}/assignments`, { assigneeUuid, note })); },
  async logPartyCommunication(uuid: string, payload: ApiRecord) {
    const channels: Record<string, string> = { call: "Call", sms: "SMS", email: "Email", whatsapp: "WhatsApp", meeting: "Meeting" };
    return unwrap(await api.post(`/crm/parties/${uuid}/communications`, { channel: channels[payload.channel] ?? payload.channel, direction: payload.direction === "in" ? "Inbound (Received)" : "Outbound (Sent)", occurredAt: new Date(payload.at).toISOString(), summary: payload.content }));
  },
  async partyUsers() { return rowsOf(await api.get("/crm/parties/users/dropdown")); },
  async pipelines(params: ApiRecord = {}) { return api.get("/crm/lead/pipeline", { params }); },
  async pipelineProjects() { return rowsOf(await api.get("/crm/lead/pipeline/dropdowns/projects")); },
  async createPipeline(payload: ApiRecord) { return unwrap(await api.post("/crm/lead/pipeline", payload)); },
  async updatePipeline(uuid: string, payload: ApiRecord) { return unwrap(await api.patch(`/crm/lead/pipeline/entries/${uuid}`, payload)); },
  async deletePipeline(uuid: string) { return unwrap(await api.delete(`/crm/lead/pipeline/entries/${uuid}`)); },
};
export { first, rowsOf, unwrap };
