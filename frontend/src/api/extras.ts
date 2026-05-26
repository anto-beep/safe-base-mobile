// Extra API wrappers for Phase 1F-1I (Common stack, Safety extras, Workflows
// extras, Library, Apps & Add-ons, Settings). The base SafeBase backend lives
// at /api/* on the external safe-systems pod. Field shapes mirror
// /tmp/safebase_ref/backend/server.py and routes/*.py.

import { api } from "@/src/api/client";

// ---------- TEAM (settings/team) ----------
export interface TeamMember { invite_id: string; email: string; role: string; status: string; created_at?: string; }
export const TeamApi = {
  list: () => api.get<TeamMember[]>("/team"),
  invite: (b: { email: string; role: string }) => api.post<TeamMember>("/team/invite", b),
  patch: (id: string, b: Partial<TeamMember>) => api.patch<TeamMember>(`/team/${id}`, b),
  remove: (id: string) => api.del(`/team/${id}`),
};

// ---------- ONBOARDING ----------
export interface Onboarding { steps?: Record<string, boolean>; current_step?: string; complete?: boolean; }
export const OnboardingApi = {
  get: () => api.get<Onboarding>("/onboarding"),
  put: (b: Onboarding) => api.put<Onboarding>("/onboarding", b),
};

// ---------- DOCUMENTS ----------
export interface SafeBaseDoc { document_id: string; title: string; type?: string; created_at?: string; status?: string; download_url?: string; }
export const DocumentsApi = {
  list: () => api.get<SafeBaseDoc[]>("/documents"),
  get: (id: string) => api.get<SafeBaseDoc>(`/documents/${id}`),
  remove: (id: string) => api.del(`/documents/${id}`),
  generate: (b: { type: string; title?: string; payload?: any }) => api.post<SafeBaseDoc>("/documents/generate", b),
};

// ---------- COMPLIANCE INBOX ----------
export interface InboxItem { id: string; tone?: "info" | "warning" | "critical"; title: string; body?: string; link?: string; created_at?: string; }
export const InboxApi = {
  list: () => api.get<InboxItem[]>("/compliance-inbox"),
  summary: () => api.get<{ unread: number; by_tone?: Record<string, number> }>("/compliance-inbox/summary"),
};

// ---------- REGULATOR PIPELINE ----------
export interface RegulatorCase { case_id?: string; regulator: string; status: string; created_at?: string; summary?: string; due_at?: string; }
export const RegulatorApi = {
  pending: () => api.get<{ cases: RegulatorCase[] }>("/regulator-pipeline/pending"),
  matrices: () => api.get<any>("/regulator-pipeline/matrices"),
  triage: (b: any) => api.post<RegulatorCase>("/regulator-pipeline/triage", b),
  draft: (b: any) => api.post<RegulatorCase>("/regulator-pipeline/draft", b),
  markSubmitted: (caseId: string) => api.post<{ ok: boolean }>(`/regulator-pipeline/mark-submitted/${caseId}`, {}),
};

// ---------- AUTOMATIONS ----------
export interface Automation { automation_id: string; name: string; trigger?: string; action?: string; enabled?: boolean; runs?: number; }
export const AutomationsApi = {
  recipes: () => api.get<any[]>("/automations/recipes"),
  list: () => api.get<Automation[]>("/automations"),
  create: (b: any) => api.post<Automation>("/automations", b),
  test: (id: string) => api.post<{ ok: boolean }>(`/automations/${id}/test`, {}),
  runs: (id: string) => api.get<any[]>(`/automations/${id}/runs`),
  analytics: () => api.get<any>("/automations/analytics/summary"),
};

// ---------- WEBHOOKS ----------
export interface WebhookSub { sid: string; url: string; events: string[]; enabled?: boolean; }
export interface WebhookDelivery { delivery_id: string; sid: string; event: string; status: string; created_at?: string; }
export const WebhooksApi = {
  events: () => api.get<string[]>("/webhooks/events"),
  list: () => api.get<WebhookSub[]>("/webhooks/subscriptions"),
  create: (b: { url: string; events: string[] }) => api.post<WebhookSub>("/webhooks/subscriptions", b),
  deliveries: () => api.get<WebhookDelivery[]>("/webhooks/deliveries"),
  test: (sid: string) => api.post<{ ok: boolean }>(`/webhooks/test/${sid}`, {}),
};

// ---------- API KEYS ----------
export interface ApiKey { key_id: string; label: string; created_at?: string; last_used_at?: string; integration_target?: string; }
export const ApiKeysApi = {
  list: () => api.get<ApiKey[]>("/api-keys"),
  create: (b: { label: string; integration_target?: string }) => api.post<ApiKey & { secret?: string }>("/api-keys", b),
  targets: () => api.get<string[]>("/api-keys/integration-targets"),
};

// ---------- ACADEMY ----------
export interface Course { course_id: string; title: string; duration_min?: number; tags?: string[]; }
export interface Enrolment { enrolment_id: string; course_id: string; progress?: number; completed?: boolean; }
export const AcademyApi = {
  courses: () => api.get<Course[]>("/academy/courses"),
  myEnrolments: () => api.get<Enrolment[]>("/academy/enrolments"),
  enrol: (course_id: string) => api.post<Enrolment>("/academy/enrolments", { course_id }),
  progress: (id: string, progress: number) => api.post<Enrolment>(`/academy/enrolments/${id}/progress`, { progress }),
};

// ---------- PARTNER ----------
export interface PartnerClient { client_id: string; name: string; industry?: string; status?: string; created_at?: string; }
export interface PartnerBranding { logo_url?: string; primary_colour?: string; subdomain?: string; from_email?: string; dns_verified?: boolean; }
export const PartnerApi = {
  clients: () => api.get<PartnerClient[]>("/partner/clients"),
  addClient: (b: { name: string; industry?: string }) => api.post<PartnerClient>("/partner/clients", b),
  summary: () => api.get<{ total_clients: number; active_clients?: number; revenue_mtd?: number }>("/partner/summary"),
  getBranding: () => api.get<PartnerBranding>("/partner/branding"),
  putBranding: (b: PartnerBranding) => api.put<PartnerBranding>("/partner/branding", b),
  verifyDns: () => api.post<{ verified: boolean }>("/partner/branding/verify-dns", {}),
  testEmail: () => api.post<{ ok: boolean }>("/partner/branding/test-email", {}),
};

// ---------- TRADE INDUCT / VENUE INDUCT ----------
export interface InductionProgram { program_id: string; name: string; code?: string; questions?: any[]; created_at?: string; }
export const TradeInductApi = {
  programs: () => api.get<InductionProgram[]>("/tradeinduct/programs"),
  defaultQuestions: () => api.get<any[]>("/tradeinduct/default-questions"),
  create: (b: { name: string; questions?: any[] }) => api.post<InductionProgram>("/tradeinduct/programs", b),
  remove: (id: string) => api.del(`/tradeinduct/programs/${id}`),
  submissions: (id: string) => api.get<any[]>(`/tradeinduct/programs/${id}/submissions`),
};

// ---------- TRADE CHECK / VENUE CHECK ----------
export interface TradeListing { listing_id: string; business_name: string; trade?: string; state?: string; verified?: boolean; rating?: number; }
export const TradeCheckApi = {
  required: (industry?: string) => api.get<any>(`/tradecheck/required-credentials${industry ? `?industry=${industry}` : ""}`),
  stats: () => api.get<{ verified_count: number; total: number }>("/tradecheck/stats"),
  listings: () => api.get<TradeListing[]>("/tradecheck/listings"),
  my: () => api.get<TradeListing | null>("/tradecheck/my"),
};

// ---------- MOBILE WORKER ----------
export interface WorkerSummary { upcoming_shifts?: any[]; expiring_credentials?: any[]; recent_checkins?: any[]; assigned_swms?: any[]; }
export const WorkerSelfApi = {
  summary: () => api.get<WorkerSummary>("/worker/my-summary"),
  checkin: (b: { site?: string; latitude?: number; longitude?: number; notes?: string }) => api.post<any>("/worker/checkin", b),
  checkins: () => api.get<any[]>("/worker/checkins"),
};

// ---------- DEMO REQUESTS (admin / marketing) ----------
export interface DemoRequest { request_id: string; name: string; email: string; company?: string; industry?: string; created_at?: string; }
export const DemoApi = {
  // POST /demo/request is public; mobile only reads the list via internal-admin
  submit: (b: { name: string; email: string; company?: string; industry?: string; message?: string }) =>
    api.post<DemoRequest>("/demo/request", b, { authOptional: true }),
};
