// Industry-specific API wrappers — mirrors the SafeBase backend routes
// in /tmp/safebase_ref/backend/routes/{hospitality,transport,healthcare,retail,inline_actions}.py.
//
// PERMISSIONS: enforced by the backend `*_gate` (require_feature) deps. If
// a non-{industry} user calls these endpoints they get 403 — mobile UI just
// surfaces the friendly error from api.client. No client-side gating.

import { api } from "@/src/api/client";

// =================== HOSPITALITY ===================
export type EquipmentType =
  | "fridge" | "coolroom" | "cold_display" | "freezer"
  | "bain_marie" | "hot_display" | "hot_holding" | "dishwasher";

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

export interface FssRecord {
  fss_id: string;
  worker_name: string;
  worker_id?: string;
  certificate_number: string;
  issuing_rto: string;
  issued_at?: string;
  expires_at?: string;
  jurisdiction?: string;
  is_primary_fss?: boolean;
  notes?: string;
  _days_to_expiry?: number;
  _expiring_soon?: boolean;
  _expired?: boolean;
}

export interface HaccpEntry {
  ccp_id: string;
  hazard?: string;          // biological / chemical / physical
  ccp_step: string;
  critical_limit?: string;
  measured_value: number | string;
  within_limit: boolean;
  corrective_action?: string;
  verified_by?: string;
  recorded_at: string;
}

export interface Allergen {
  item_id: string;
  menu_item: string;
  contains: string[];
  may_contain: string[];
  notes?: string;
  updated_at?: string;
}

export interface CleaningTask {
  task_id: string;
  area: string;
  frequency: string;         // daily/weekly/monthly
  method?: string;
  chemical?: string;
  responsible?: string;
  last_completed_at?: string | null;
  last_completed_by?: string | null;
  status: "open" | "completed";
}

export interface Supplier {
  supplier_id: string;
  name: string;
  category?: string;
  abn?: string;
  contact_email?: string;
  contact_phone?: string;
  approval_certificates?: string[];
  last_audit_at?: string;
  notes?: string;
}

export interface LiquorCert {
  cert_id: string;
  worker_name: string;
  worker_id?: string;
  certificate_type: string;   // RSA / RSG / Approved Manager
  certificate_number?: string;
  jurisdiction?: string;
  issued_at?: string;
  expires_at?: string;
  _days_to_expiry?: number;
  _expired?: boolean;
}

export interface InspectionPack {
  pack_id: string;
  generated_at: string;
  covers_period_days: number;
  manifest: Record<string, number>;
}

export const HospitalityApi = {
  // Temperature
  listTemps: () => api.get<{ rows: TemperatureLog[]; total: number }>("/hospitality/temperature-logs"),
  tempStats: () => api.get<TempStats>("/hospitality/temperature-logs/stats"),
  createTemp: (b: { equipment: string; equipment_type: EquipmentType; temp_c: number; taken_at?: string; taken_by?: string; corrective_action?: string }) =>
    api.post<TemperatureLog>("/hospitality/temperature-logs", b),

  // FSS register
  listFss: () => api.get<{ rows: FssRecord[]; total: number }>("/hospitality/fss-register"),
  createFss: (b: { worker_name: string; certificate_number: string; issuing_rto: string; worker_id?: string; issued_at?: string; expires_at?: string; jurisdiction?: string; is_primary_fss?: boolean; notes?: string }) =>
    api.post<FssRecord>("/hospitality/fss-register", b),

  // HACCP CCP log
  listHaccp: () => api.get<{ rows: HaccpEntry[]; total: number; breach_count: number }>("/hospitality/haccp-ccp"),
  createHaccp: (b: { ccp_step: string; measured_value: number | string; hazard?: string; critical_limit?: string; within_limit?: boolean; corrective_action?: string; verified_by?: string }) =>
    api.post<HaccpEntry>("/hospitality/haccp-ccp", b),

  // Allergens
  listAllergens: () => api.get<{ rows: Allergen[]; total: number }>("/hospitality/allergens"),
  upsertAllergen: (b: { menu_item: string; contains?: string[]; may_contain?: string[]; notes?: string; item_id?: string }) =>
    api.post<Allergen>("/hospitality/allergens", b),

  // Cleaning
  listCleaning: () => api.get<{ rows: CleaningTask[]; total: number }>("/hospitality/cleaning-tasks"),
  createCleaning: (b: { area: string; frequency: string; method?: string; chemical?: string; responsible?: string }) =>
    api.post<CleaningTask>("/hospitality/cleaning-tasks", b),
  completeCleaning: (taskId: string, completed_by?: string) =>
    api.post<{ task_id: string; status: string }>(`/hospitality/cleaning-tasks/${taskId}/complete`, { completed_by }),

  // Suppliers
  listSuppliers: () => api.get<{ rows: Supplier[]; total: number }>("/hospitality/suppliers"),
  createSupplier: (b: { name: string; category?: string; abn?: string; contact_email?: string; contact_phone?: string; approval_certificates?: string[]; last_audit_at?: string; notes?: string }) =>
    api.post<Supplier>("/hospitality/suppliers", b),

  // Liquor (RSA / RSG / Approved Manager)
  listLiquor: () => api.get<{ rows: LiquorCert[]; total: number }>("/hospitality/liquor-certs"),
  createLiquor: (b: { worker_name: string; certificate_type: string; certificate_number?: string; jurisdiction?: string; issued_at?: string; expires_at?: string; worker_id?: string }) =>
    api.post<LiquorCert>("/hospitality/liquor-certs", b),

  // Council inspection pack
  generateInspectionPack: (covers_period_days = 30) =>
    api.post<InspectionPack>("/hospitality/inspection-pack", { covers_period_days }),
};

// =================== TRANSPORT ===================
export interface FleetVehicle {
  vehicle_id: string;
  rego: string;
  make?: string;
  model?: string;
  vehicle_class?: string;
  gvm_kg?: number;
  combo_gcm_kg?: number;
  last_service_at?: string;
  next_service_due?: string;
  rego_expires_at?: string;
  nhvr_accreditation?: string[];
}

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

export interface FatigueLog {
  log_id: string;
  driver_name: string;
  driver_id?: string;
  vehicle_rego: string;
  work_hours: number;
  continuous_rest_hours: number;
  standard: "standard" | "bfm" | "afm";
  day_date: string;
  breach: boolean;
  breach_reasons: string[];
  source: "manual" | "ewd";
}

export interface FitnessForDuty {
  declaration_id: string;
  driver_name: string;
  driver_id?: string;
  hours_slept_24h: number;
  alcohol_last_8h: boolean;
  on_medication_affecting: boolean;
  unwell: boolean;
  fit_to_drive: boolean;
  declared_at: string;
}

export interface LoadRestraintRecord {
  record_id: string;
  vehicle_rego: string;
  load_description: string;
  load_weight_kg?: number;
  restraint_method?: string;
  number_of_straps?: number;
  friction_modifier?: string;
  performance_standard_met: boolean;
  checked_by?: string;
  created_at: string;
}

export interface MassDeclaration {
  decl_id: string;
  vehicle_rego: string;
  scheme: string;            // GML / CML / HML / PBS
  declared_mass_kg: number;
  allowed_mass_kg: number;
  overweight: boolean;
  route?: string;
  consigner?: string;
  created_at: string;
}

export interface CorDueDiligence {
  entry_id: string;
  party: string;
  hazard?: string;
  action: string;
  evidence_link?: string;
  reviewed_by?: string;
  next_review_at?: string;
  created_at: string;
}

export interface NhvrOccurrence {
  occurrence_id: string;
  occurrence_type: string;
  summary: string;
  vehicle_rego: string;
  driver_name?: string;
  occurred_at: string;
  location?: string;
  notify_nhvr_by: string;
  nhvr_notified_at?: string | null;
  status: "pending" | "notified" | "closed";
}

export const TransportApi = {
  // Fleet
  listVehicles: () => api.get<{ rows: FleetVehicle[]; total: number }>("/transport/vehicles"),
  createVehicle: (b: { rego: string; make?: string; model?: string; vehicle_class?: string; gvm_kg?: number; combo_gcm_kg?: number; last_service_at?: string; next_service_due?: string; rego_expires_at?: string; nhvr_accreditation?: string[] }) =>
    api.post<FleetVehicle>("/transport/vehicles", b),

  // Pre-trip
  listPreTrip: () => api.get<{ rows: PreTripInspection[]; total: number }>("/transport/pretrip-inspections"),
  createPreTrip: (b: { vehicle_rego: string; driver_name: string; driver_id?: string; checklist: Record<string, boolean>; notes?: string; odometer_km?: number; inspected_at?: string }) =>
    api.post<PreTripInspection>("/transport/pretrip-inspections", b),

  // Fatigue
  listFatigue: () => api.get<{ rows: FatigueLog[]; total: number }>("/transport/fatigue-logs"),
  listFatigueBreaches: () => api.get<{ rows: FatigueLog[]; total: number }>("/transport/fatigue-logs/breaches"),
  createFatigue: (b: { driver_name: string; work_hours: number; continuous_rest_hours?: number; vehicle_rego?: string; driver_id?: string; standard?: "standard" | "bfm" | "afm"; day_date?: string; source?: "manual" | "ewd" }) =>
    api.post<FatigueLog>("/transport/fatigue-logs", b),

  // FFD
  listFfd: () => api.get<{ rows: FitnessForDuty[]; total: number }>("/transport/fitness-for-duty"),
  createFfd: (b: { driver_name: string; hours_slept_24h: number; alcohol_last_8h?: boolean; on_medication_affecting?: boolean; unwell?: boolean; fit_to_drive?: boolean; driver_id?: string }) =>
    api.post<FitnessForDuty>("/transport/fitness-for-duty", b),

  // Load restraint
  listLoadRestraint: () => api.get<{ rows: LoadRestraintRecord[]; total: number }>("/transport/load-restraint"),
  createLoadRestraint: (b: { vehicle_rego: string; load_description: string; load_weight_kg?: number; restraint_method?: string; number_of_straps?: number; friction_modifier?: string; performance_standard_met?: boolean; checked_by?: string }) =>
    api.post<LoadRestraintRecord>("/transport/load-restraint", b),

  // Mass declarations
  listMass: () => api.get<{ rows: MassDeclaration[]; total: number }>("/transport/mass-declarations"),
  createMass: (b: { vehicle_rego: string; declared_mass_kg: number; allowed_mass_kg?: number; scheme?: string; route?: string; consigner?: string }) =>
    api.post<MassDeclaration>("/transport/mass-declarations", b),

  // CoR
  listCor: () => api.get<{ rows: CorDueDiligence[]; total: number }>("/transport/cor-due-diligence"),
  createCor: (b: { party: string; action: string; hazard?: string; evidence_link?: string; reviewed_by?: string; next_review_at?: string }) =>
    api.post<CorDueDiligence>("/transport/cor-due-diligence", b),

  // NHVR
  listNhvr: () => api.get<{ rows: NhvrOccurrence[]; total: number }>("/transport/nhvr-occurrences"),
  createNhvr: (b: { occurrence_type: string; summary: string; occurred_at: string; vehicle_rego?: string; driver_name?: string; location?: string }) =>
    api.post<NhvrOccurrence>("/transport/nhvr-occurrences", b),

  // Inline actions
  pauseDriver: (driverId: string, reason: string) =>
    api.post<{ ok: boolean; pause: any }>(`/transport/drivers/${driverId}/pause`, { reason }),
};

// =================== HEALTHCARE ===================
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

export interface WorkerScreen {
  screen_id: string;
  worker_name: string;
  worker_id?: string;
  screening_type: "ndis" | "aged_care" | "wwcc" | "police_check";
  clearance_number?: string;
  jurisdiction?: string;
  issued_at?: string;
  expires_at?: string;
  outcome: "cleared" | "barred" | "pending";
  notes?: string;
  _days_to_expiry?: number;
  _expired?: boolean;
}

export interface SirsIncident {
  incident_id: string;
  category: string;
  priority: "one" | "two";
  summary: string;
  occurred_at: string;
  consumer_initials?: string;
  service_code?: string;
  notify_by_24h: string;
  notify_by_30d: string;
  acqsc_submitted_at?: string | null;
  submission_reference?: string;
  status: "pending" | "submitted";
}

export interface NdisReportable {
  incident_id: string;
  category: string;
  summary: string;
  occurred_at: string;
  participant_initials?: string;
  is_high_risk: boolean;
  notify_commission_by: string;
  commission_submitted_at?: string | null;
  status: "pending" | "submitted";
}

export interface AcqscEvidence {
  evidence_id: string;
  standard: number; // 1-8
  title: string;
  description?: string;
  evidence_type?: "policy" | "procedure" | "record" | "training";
  linked_doc_ref?: string;
  next_review_at?: string;
}

export interface CareMinute {
  log_id: string;
  consumer_initials: string;
  minutes: number;
  care_type: "rn" | "direct_care" | "allied_health";
  clinician?: string;
  date: string;
  notes?: string;
}

export const HealthcareApi = {
  // AHPRA
  listAhpra: () => api.get<{ rows: AhpraRecord[]; total: number }>("/healthcare/ahpra-register"),
  listAhpraExpiring: (days = 30) => api.get<{ rows: AhpraRecord[]; total: number }>(`/healthcare/ahpra-register/expiring?days=${days}`),
  createAhpra: (b: { worker_name: string; profession: string; registration_number: string; registration_type?: string; conditions?: string[]; issued_at?: string; expires_at?: string }) =>
    api.post<AhpraRecord>("/healthcare/ahpra-register", b),
  remindAhpra: (clinicianOrRegId: string) =>
    api.post<{ ok: boolean; reminder: any }>(`/healthcare/ahpra-register/${clinicianOrRegId}/remind`, {}),

  // Worker screening
  listScreening: () => api.get<{ rows: WorkerScreen[]; total: number }>("/healthcare/worker-screening"),
  createScreening: (b: { worker_name: string; screening_type: string; clearance_number?: string; jurisdiction?: string; issued_at?: string; expires_at?: string; outcome?: string; notes?: string }) =>
    api.post<WorkerScreen>("/healthcare/worker-screening", b),

  // SIRS
  listSirs: () => api.get<{ rows: SirsIncident[]; total: number }>("/healthcare/sirs-incidents"),
  createSirs: (b: { category: string; summary: string; occurred_at: string; consumer_initials?: string; service_code?: string }) =>
    api.post<SirsIncident>("/healthcare/sirs-incidents", b),
  submitSirs: (incidentId: string, submission_reference?: string) =>
    api.post<{ incident_id: string; status: string }>(`/healthcare/sirs-incidents/${incidentId}/submit`, { submission_reference }),

  // NDIS reportable
  listNdis: () => api.get<{ rows: NdisReportable[]; total: number }>("/healthcare/ndis-reportable"),
  createNdis: (b: { category: string; summary: string; occurred_at: string; participant_initials?: string }) =>
    api.post<NdisReportable>("/healthcare/ndis-reportable", b),

  // ACQSC evidence
  listAcqsc: () => api.get<{ rows: AcqscEvidence[]; total: number; coverage: Record<string, number> }>("/healthcare/acqsc-evidence"),
  createAcqsc: (b: { standard: number; title: string; description?: string; evidence_type?: string; linked_doc_ref?: string; next_review_at?: string }) =>
    api.post<AcqscEvidence>("/healthcare/acqsc-evidence", b),

  // Care minutes
  listCareMinutes: () => api.get<{ rows: CareMinute[]; total: number; total_minutes: number }>("/healthcare/care-minutes"),
  createCareMinutes: (b: { consumer_initials: string; minutes: number; care_type: string; clinician?: string; date?: string; notes?: string }) =>
    api.post<CareMinute>("/healthcare/care-minutes", b),
};

// =================== RETAIL ===================
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

export interface QuickInduct {
  induct_id: string;
  casual_name: string;
  casual_id?: string;
  store_location?: string;
  answers: Record<string, string>;
  passed: boolean;
  missing_answers: string[];
  inducted_at: string;
  expires_at?: string | null;
  inducted_by?: string;
}

export interface QuickInductMeta {
  questions: { key: string; q: string }[];
  valid_days: number;
}

export interface CustomerIncident {
  incident_id: string;
  incident_type: "injury" | "aggression" | "theft" | "slip" | "other";
  severity: "minor" | "moderate" | "serious";
  summary: string;
  occurred_at: string;
  location?: string;
  customer_initials?: string;
  staff_involved?: string;
  police_called: boolean;
  ambulance_called: boolean;
  cctv_ref?: string;
  follow_up_action?: string;
  status: "open" | "closed";
}

export interface RosterEligibility {
  worker_id: string;
  can_roster: boolean;
  blockers: string[];
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

  // Quick induct
  quickInductMeta: () => api.get<QuickInductMeta>("/retail/quick-induct/meta"),
  listQuickInduct: () => api.get<{ rows: QuickInduct[]; total: number }>("/retail/quick-induct"),
  createQuickInduct: (b: { casual_name: string; answers: Record<string, string>; casual_id?: string; store_location?: string; inducted_by?: string }) =>
    api.post<QuickInduct>("/retail/quick-induct", b),
  quickInductStatus: (casualId: string) =>
    api.get<{ casual_id: string; can_roster: boolean; reason: string; induct?: QuickInduct }>(`/retail/quick-induct/${casualId}/status`),

  // Customer incidents
  listCustomerIncidents: () => api.get<{ rows: CustomerIncident[]; total: number }>("/retail/customer-incidents"),
  createCustomerIncident: (b: { incident_type: string; summary: string; occurred_at: string; severity?: string; location?: string; customer_initials?: string; staff_involved?: string; police_called?: boolean; ambulance_called?: boolean; cctv_ref?: string; follow_up_action?: string }) =>
    api.post<CustomerIncident>("/retail/customer-incidents", b),

  // Roster eligibility
  rosterEligibility: (workerId: string) =>
    api.get<RosterEligibility>(`/retail/roster-eligibility/${workerId}`),
};
