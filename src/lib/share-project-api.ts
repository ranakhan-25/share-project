import api from "@/lib/api";

const ROOT = "/realbizpro/api/v1/share-project";

export type ShareApiProject = {
  uuid: string;
  name: string;
  description: string;
  location?: string;
  thumbnailUrl?: string;
  totalInvestmentAmount: number | string;
  totalShares: number;
  pricePerShare: number | string;
  minimumInvestment: number | string;
  expectedAnnualReturn?: number | string;
  startDate?: string;
  endDate?: string;
  status: string;
  rejectionReason?: string | null;
  categoryId: number;
  category?: { id: number; name: string };
  images?: { url: string }[];
  documents?: { title?: string; url: string }[];
  submissions?: { type?: string; createdAt?: string; submittedAt?: string }[];
  statusHistory?: { toStatus?: string; note?: string; createdAt?: string }[];
};

function unwrap<T>(payload: unknown): T {
  if (!payload || typeof payload !== "object") return payload as T;
  const root = payload as Record<string, unknown>;
  return ("data" in root ? root.data : root) as T;
}

export async function getPublicProjects(page = 1, limit = 100) {
  const response = await api.get(`${ROOT}/public/projects?page=${page}&limit=${limit}`);
  return unwrap<{ data: ShareApiProject[]; meta?: { total: number; page: number; limit: number; totalPages?: number } }>(response.data);
}

export async function getPublicProject(uuid: string) {
  const response = await api.get(`${ROOT}/public/projects/${encodeURIComponent(uuid)}`);
  return unwrap<ShareApiProject>(response.data);
}

export async function getOwnerProjects(status?: string, page = 1, limit = 100) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) query.set("status", status);
  const response = await api.get(`${ROOT}/owner/projects?${query.toString()}`);
  return unwrap<{ data: ShareApiProject[]; meta?: { total: number; page: number; limit: number } }>(response.data);
}

export async function getOwnerProject(uuid: string) {
  const response = await api.get(`${ROOT}/owner/projects/${encodeURIComponent(uuid)}`);
  return unwrap<ShareApiProject>(response.data);
}

export async function getPublicCategories() {
  const response = await api.get(`${ROOT}/public/categories`);
  return unwrap<Array<{ id: number; uuid: string; code: string; name: string }>>(response.data);
}

export async function createOwnerProject(dto: Record<string, unknown>) {
  const response = await api.post(`${ROOT}/owner/projects`, dto);
  return unwrap<ShareApiProject>(response.data);
}

export async function updateOwnerProject(uuid: string, dto: Record<string, unknown>) {
  const response = await api.put(`${ROOT}/owner/projects/${encodeURIComponent(uuid)}`, dto);
  return unwrap<ShareApiProject>(response.data);
}

export async function submitOwnerProject(uuid: string) {
  const response = await api.post(`${ROOT}/owner/projects/${encodeURIComponent(uuid)}/submit`);
  return unwrap<ShareApiProject>(response.data);
}

export async function resubmitOwnerProject(uuid: string) {
  const response = await api.post(`${ROOT}/owner/projects/${encodeURIComponent(uuid)}/resubmit`);
  return unwrap<ShareApiProject>(response.data);
}

export async function getOwnerSubmissionHistory(uuid: string) {
  const response = await api.get(`${ROOT}/owner/projects/${encodeURIComponent(uuid)}/submissions`);
  return unwrap<unknown[]>(response.data);
}

export async function getShareUserProfile() {
  const response = await api.get("/realbizpro/api/v1/share-user/profile");
  return unwrap<Record<string, unknown>>(response.data);
}

export async function updateShareUserProfile(dto: { name?: string; phone?: string }) {
  const response = await api.patch("/realbizpro/api/v1/share-user/profile", dto);
  return unwrap<Record<string, unknown>>(response.data);
}

export async function logoutShareUser() {
  await api.post("/realbizpro/api/v1/share-user/logout", {});
}

export async function getShareProjectUserDashboard() {
  const response = await api.get(`${ROOT}/user/dashboard`);
  return unwrap<Record<string, unknown>>(response.data);
}

export async function getShareProjectPortfolio() {
  const response = await api.get(`${ROOT}/user/portfolio`);
  return unwrap<Record<string, unknown[]>>(response.data);
}

export async function getShareProjectNotifications() {
  const response = await api.get(`${ROOT}/user/notifications`);
  return unwrap<Array<Record<string, unknown>>>(response.data);
}

export async function prepareShareProjectInvestment(projectUuid: string, quantity: number) {
  const response = await api.post(`${ROOT}/user/investments/prepare`, { projectUuid, quantity });
  return unwrap<Record<string, unknown>>(response.data);
}
