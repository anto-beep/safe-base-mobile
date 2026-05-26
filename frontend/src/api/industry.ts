// Industry-specific API wrappers — mirrors the SafeBase backend routes
// in /tmp/safebase_ref/backend/routes/{hospitality,transport,healthcare,retail,inline_actions}.py.
//
// PERMISSIONS: enforced by the backend `*_gate` (require_feature) deps. If
// a non-{industry} user calls these endpoints they get 403 — mobile UI just
// surfaces the friendly error from api.client. No client-side gating.

import { api } from "@/src/api/client";

// ---------- HOSPITALITY ----------
export type EquipmentType = "fridge" | "coolroom" | "cold_display" | "freezer" | "bain_marie" | "hot_display" | "hot_holding" | "dishwasher";
export interface TemperatureLog {
  log_id: string;
  equipment: string;
  equipment_type: EquipmentType;
  temp_c: number;
  taken_at: string;
  taken_by?: string;
  corrective_action?: string;
  in_range: boolean;
  out_of_range_reason?: string | null;
  account_id?: string;
}
export interface TempStats {
  total_30d: number;
  breaches_30d: number;
  breach_rate_pct: number;
  by_equipment: Record<string, { total: number; breaches: number }>;
  recent_breaches: TemperatureLog[];
}
export const HospitalityApi = {
  listTemps: () => api.get<{ rows: TemperatureLog[]; total: number }>("/hospitality/temperature-logs"),
  tempStats: () => api.get<TempStats>("/hospitality/temperature-logs/stats"),
  createTemp: (b: { equipment: string; equipment_type: EquipmentType; temp_c: number; taken_at?: string; taken_by?: string; corrective_action?: string }) =>
    api.post<TemperatureLog>("/hospitality/temperature-logs", b),
};

// ---------- TRANSPORT (Pre-trip inspection) ----------
export interface PreTripInspection {
  inspection_id: string;
  vehicle_rego: string;
  driver_name: string;
  driver_id?: string;
  checklist: Record<string, boolean>;
  defects: string[];
  fit_to_drive: boolean;
  notes?: string;
  odometer_km?: number;
  inspected_at: string;
}
export const TransportApi = {
  listPreTrip: () => api.get<{ rows: PreTripInspection[]; total: number }>("/transport/pretrip-inspections"),
  createPreTrip: (b: { vehicle_rego: string; driver_name: string; driver_id?: string; checklist: Record<string, boolean>; notes?: string; odometer_km?: number; inspected_at?: string }) =>
    api.post<PreTripInspection>("/transport/pretrip-inspections", b),
  pauseDriver: (driverId: string, reason: string) =>
    api.post<{ ok: boolean; pause: any }>(`/transport/drivers/${driverId}/pause`, { reason }),
};

// ---------- HEALTHCARE (AHPRA + remind) ----------
export interface AhpraRecord {
  reg_id: string;
  worker_name: string;
  worker_id?: string;
  profession: string;
  registration_number: string;
  registration_type?: string;
  conditions?: string[];
  issued_at?: string;
  expires_at?: string;
  last_checked_at?: string;
  status?: string;
  _days_to_expiry?: number;
  _expiring_soon?: boolean;
  _expired?: boolean;
}
export const HealthcareApi = {
  listAhpra: () => api.get<{ rows: AhpraRecord[]; total: number }>("/healthcare/ahpra-register"),
  createAhpra: (b: { worker_name: string; profession: string; registration_number: string; registration_type?: string; conditions?: string[]; issued_at?: string; expires_at?: string }) =>
    api.post<AhpraRecord>("/healthcare/ahpra-register", b),
  // The Iter57 inline action lives at /healthcare/ahpra-register/{clinician_id}/remind
  // but the canonical record above uses reg_id. Pass the registration's reg_id.
  remindAhpra: (clinicianOrRegId: string) =>
    api.post<{ ok: boolean; reminder: any }>(`/healthcare/ahpra-register/${clinicianOrRegId}/remind`, {}),
};

// ---------- RETAIL (Lone-worker) ----------
export interface LoneWorkerCheckin {
  checkin_id: string;
  worker_name: string;
  worker_id?: string;
  location: string;
  shift_start?: string;
  shift_end?: string;
  checked_in_at: string;
  next_checkin_due: string;
  wellbeing: "ok" | "unwell" | "distressed";
  escalated: boolean;
  escalation_reason?: string | null;
  ended?: boolean;
  _overdue?: boolean;
  _overdue_min?: number;
  _should_escalate?: boolean;
}
export const RetailApi = {
  listActive: () => api.get<{ rows: LoneWorkerCheckin[]; total: number }>("/retail/lone-worker/active"),
  listAll: () => api.get<{ rows: LoneWorkerCheckin[]; total: number }>("/retail/lone-worker/logs"),
  checkin: (b: { worker_name: string; location: string; worker_id?: string; shift_start?: string; shift_end?: string; next_checkin_min?: number; wellbeing?: "ok" | "unwell" | "distressed" }) =>
    api.post<LoneWorkerCheckin>("/retail/lone-worker/checkin", b),
  escalate: (checkinId: string, reason: string) =>
    api.post<{ checkin_id: string; escalated: boolean }>(`/retail/lone-worker/escalate`, { checkin_id: checkinId, reason }),
  acknowledge: (shiftId: string, note?: string) =>
    api.post<{ ok: boolean }>(`/retail/lone-worker/${shiftId}/acknowledge`, { note }),
};
