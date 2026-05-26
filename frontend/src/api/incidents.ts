// SafeBase Mobile — Incidents (5-stage workflow) API client.
// Backend reference: /tmp/safebase_ref/backend/incident_workflow.py.
// Every shape here mirrors the web app at /tmp/safebase_ref/frontend/src/pages/incident/*.

import { api } from "@/src/api/client";

export interface IncidentSubmission {
  involved_type?: "" | "me" | "other" | "property" | "near_miss";
  involved_people?: { name: string; role?: string; source?: string }[];
  description?: string;
  category?: string;
  was_hurt?: "" | "yes" | "no";
  body_parts?: string[];
  injury_natures?: string[];
  treatment_given?: "" | "yes" | "no";
  treatments?: string[];
  ambulance?: "" | "yes" | "no";
  hospital?: "" | "yes" | "no";
  hospital_name?: string;
  work_stopped?: "" | "yes" | "no";
  first_aider?: string;
  treatment_notes?: string;
  site?: string;
  site_location?: string;
  location_type?: "on_site" | "off_site" | "home";
  state?: string;
  date?: string;
  time?: string;
  commuting?: "yes" | "no";
  shift_duration?: string;
  witnessed?: "" | "yes" | "no";
  witnesses?: { name: string; contact?: string }[];
  other_info?: string;
  photos?: string[]; // base64 data URIs uploaded from mobile camera/library
}

export interface Incident {
  incident_id: string;
  user_id: string;
  reference: string;
  title: string;
  stage: "reported" | "triage" | "investigation" | "actions" | "closed";
  stages_done: string[];
  stage_timestamps: Record<string, string>;
  created_at: string;
  created_by: string;
  created_by_name?: string;
  urgent: boolean;
  urgent_keywords: string[];
  submission: IncidentSubmission;
  triage: any;
  investigation: any;
  actions: any;
  close_out: any;
  severity?: number | null;
  incident_type?: string | null;
  notifiable: boolean;
  notifiable_category?: string | null;
  site?: string | null;
  state?: string | null;
  audit_log: { at: string; user_id: string; user_name?: string; field: string; old?: any; new?: any }[];
  linked_risk_id?: string | null;
  linked_swms_ids?: string[];
  linked_toolbox_ids?: string[];
  linked_inspection_ids?: string[];
  reopened: boolean;
  lifecycle?: {
    nodes: { stage: string; ts?: string; status: "future" | "current" | "done"; days_from_prev?: number }[];
    current: string;
    overdue: boolean;
    total_days?: number;
  };
}

export interface IncidentStats {
  total_ytd: number;
  notifiable: number;
  lost_time: number;
  medical_treatment: number;
  near_miss: number;
  first_aid: number;
  avg_close_days: number;
  open_over_30: number;
  total_open: number;
}

export const Incidents = {
  list: () => api.get<Incident[]>("/incident-workflow"),
  stats: () => api.get<IncidentStats>("/incident-workflow/stats"),
  get: (id: string) => api.get<Incident>(`/incident-workflow/${id}`),
  create: (body: { title?: string; incident_type?: string | null; submission: IncidentSubmission }) =>
    api.post<Incident>("/incident-workflow", body),
  patchTriage: (id: string, body: any) => api.patch<Incident>(`/incident-workflow/${id}/triage`, body),
  patchInvestigation: (id: string, body: any) =>
    api.patch<Incident>(`/incident-workflow/${id}/investigation`, body),
  patchActions: (id: string, body: any) => api.patch<Incident>(`/incident-workflow/${id}/actions`, body),
  closeOut: (id: string, body: { lessons_learned: string; signed_off_by: string; close_checklist?: any; signed_off_at?: string }) =>
    api.patch<Incident>(`/incident-workflow/${id}/close-out`, body),
  reopen: (id: string, body: { reason: string }) => api.post<Incident>(`/incident-workflow/${id}/reopen`, body),
  acceptRiskDraft: (id: string, body: any) =>
    api.post<Incident>(`/incident-workflow/${id}/accept-risk-draft`, body),
  // AI assistance — used by Submission step 2 and Investigation root-cause.
  aiCategorise: (description: string) =>
    api.post<{ category: string; fallback?: boolean }>("/incident-workflow/ai/categorise", { description }),
  aiRootCause: (body: { description: string; category?: string; contributing_factors?: string[] }) =>
    api.post<{ root_cause: string; fallback?: boolean }>("/incident-workflow/ai/root-cause", body),
  aiSummary: (body: { description: string; triage?: any; investigation?: any }) =>
    api.post<{ summary: string; fallback?: boolean }>("/incident-workflow/ai/summary", body),
  aiLessons: (body: { description: string; investigation?: any; actions?: any }) =>
    api.post<{ lessons_learned: string; fallback?: boolean }>("/incident-workflow/ai/lessons-learned", body),
  aiSuggestRiskDraft: (id: string) =>
    api.post<any>(`/incident-workflow/${id}/ai/suggest-risk-draft`),
};

export interface WorkerSummary {
  worker_id: string;
  name: string;
  trade?: string;
  user_id: string;
  created_at: string;
}

export const Workers = {
  list: () => api.get<WorkerSummary[]>("/workers"),
};
