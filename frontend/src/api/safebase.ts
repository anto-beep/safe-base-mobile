// Typed wrappers for all the cross-industry SafeBase endpoints used by
// Phase 1B screens. Backend reference: /tmp/safebase_ref/backend/server.py.
//
// Endpoint list (live, verified):
//   GET/POST /workers, DELETE /workers/{id}
//   GET/POST /licences, DELETE /licences/{id}, POST /licences/{id}/remind
//   GET/POST /safety/{module}, PATCH/DELETE /safety/{module}/{item_id}
//     module ∈ {toolbox_talks, plant, substances, inspections, risks, first_aid, ppe}
//   GET /safety/summary  — counts per module
//   GET /notifications, POST /notifications/{id}/read, POST /notifications/read-all
//   GET/PUT /settings/business, GET/PUT /settings/notifications
//   GET /reports, GET /reports/{type}
//   GET /workflows/catalog, GET /workflows/summary, GET /workflows/{wtype},
//     POST /workflows/{wtype}, PATCH/DELETE /workflows/{wtype}/{id},
//     POST /workflows/{wtype}/{id}/step

import { api } from "@/src/api/client";

// ---------- WORKERS ----------
export interface Worker {
  worker_id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  trade?: string;
  created_at: string;
}
export interface WorkerIn {
  name: string;
  email?: string;
  phone?: string;
  role: string;
  trade?: string;
}
export const WorkersApi = {
  list: () => api.get<Worker[]>("/workers"),
  create: (b: WorkerIn) => api.post<Worker>("/workers", b),
  remove: (id: string) => api.del(`/workers/${id}`),
};

// ---------- LICENCES ----------
export type LicenceStatus = "active" | "expiring_soon" | "expired";
export interface Licence {
  licence_id: string;
  user_id: string;
  worker_id: string;
  licence_type: string;
  licence_number: string;
  issuing_authority?: string;
  issue_date?: string;
  expiry_date: string;
  status: LicenceStatus;
  days_until_expiry?: number;
  created_at: string;
}
export interface LicenceIn {
  worker_id: string;
  licence_type: string;
  licence_number: string;
  issuing_authority?: string;
  issue_date?: string;
  expiry_date: string;
}
export const LicencesApi = {
  list: () => api.get<Licence[]>("/licences"),
  create: (b: LicenceIn) => api.post<Licence>("/licences", b),
  remove: (id: string) => api.del(`/licences/${id}`),
  remind: (id: string) => api.post<{ ok: boolean; reminder: any }>(`/licences/${id}/remind`, {}),
};

// ---------- SAFETY (generic incl. RISKS) ----------
export type SafetyModule = "toolbox_talks" | "plant" | "substances" | "inspections" | "risks" | "first_aid" | "ppe";
export interface SafetyItem {
  item_id: string;
  user_id: string;
  module: string;
  created_at: string;
  updated_at: string;
  // module-specific fields are passed through opaquely
  [k: string]: any;
}
export const SafetyApi = {
  list: (m: SafetyModule) => api.get<SafetyItem[]>(`/safety/${m}`),
  create: (m: SafetyModule, body: any) => api.post<SafetyItem>(`/safety/${m}`, body),
  patch: (m: SafetyModule, id: string, body: any) => api.patch<SafetyItem>(`/safety/${m}/${id}`, body),
  remove: (m: SafetyModule, id: string) => api.del(`/safety/${m}/${id}`),
  summary: () => api.get<Record<string, number>>("/safety/summary"),
};

// ---------- NOTIFICATIONS ----------
export type NotifTone = "info" | "warning" | "critical" | "expiry";
export interface Notification {
  notification_id?: string;
  channel?: string;
  type?: string;
  tag?: string;
  tone?: NotifTone;
  severity?: string;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  created_at?: string;
  incident_id?: string;
}
export const NotificationsApi = {
  list: () => api.get<Notification[]>("/notifications"),
  markRead: (id: string) => api.post<{ read: boolean }>(`/notifications/${id}/read`, {}),
  markAllRead: () => api.post<{ success: boolean }>("/notifications/read-all", {}),
};

// ---------- SETTINGS ----------
export interface BusinessProfile {
  user_id?: string;
  company_name?: string;
  abn?: string;
  trade_type?: string;
  primary_state?: string;
  worker_count_band?: string;
  logo_url?: string;
  primary_contact_name?: string;
  primary_contact_phone?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  whs_rep_name?: string;
  updated_at?: string;
}
export interface NotificationPrefs {
  credential_expiry_days: number[];
  credential_delivery: "email" | "sms" | "both" | "inapp";
  incident_score_threshold: number;
  weekly_summary: boolean;
  legislative_digest: "immediate" | "weekly" | "monthly";
}
export const SettingsApi = {
  getBusiness: () => api.get<BusinessProfile>("/settings/business"),
  putBusiness: (b: BusinessProfile) => api.put<BusinessProfile>("/settings/business", b),
  getNotifs: () => api.get<NotificationPrefs>("/settings/notifications"),
  putNotifs: (b: NotificationPrefs) => api.put<NotificationPrefs>("/settings/notifications", b),
};

// ---------- REPORTS ----------
export interface ReportMeta { type: string; title: string; desc: string; }
export const ReportsApi = {
  list: () => api.get<ReportMeta[]>("/reports"),
  get: (type: string) => api.get<any>(`/reports/${type}`),
};

// ---------- WORKFLOWS ----------
export type WorkflowType = "new_employee" | "annual_review" | "subcontractor" | "incident_resolution" | "swms_job_start" | string;
export interface WorkflowStep { key: string; label: string; }
export interface WorkflowCatalogItem { type: WorkflowType; steps: WorkflowStep[]; }
export interface WorkflowInstance {
  instance_id: string;
  type: WorkflowType;
  title?: string;
  notes?: string;
  entity_id?: string;
  steps: { key: string; label: string; completed: boolean; completed_at?: string; completed_by?: string }[];
  status: "not_started" | "in_progress" | "complete";
  created_at: string;
  updated_at?: string;
}
export interface WorkflowSummary {
  [type: string]: { total: number; not_started: number; in_progress: number; complete: number };
}
export const WorkflowsApi = {
  catalog: () => api.get<WorkflowCatalogItem[]>("/workflows/catalog"),
  summary: () => api.get<WorkflowSummary>("/workflows/summary"),
  list: (wt: WorkflowType) => api.get<WorkflowInstance[]>(`/workflows/${wt}`),
  create: (wt: WorkflowType, body: { title?: string; entity_id?: string; notes?: string }) =>
    api.post<WorkflowInstance>(`/workflows/${wt}`, body),
  patch: (wt: WorkflowType, id: string, body: { title?: string; notes?: string }) =>
    api.patch<WorkflowInstance>(`/workflows/${wt}/${id}`, body),
  step: (wt: WorkflowType, id: string, body: { step_key: string; completed: boolean }) =>
    api.post<WorkflowInstance>(`/workflows/${wt}/${id}/step`, body),
  remove: (wt: WorkflowType, id: string) => api.del(`/workflows/${wt}/${id}`),
};

// ---------- COMPLIANCE ----------
export const ComplianceApi = {
  score: () => api.get<{ score: number; band?: string; pillars?: Record<string, number> }>("/compliance/score"),
};
