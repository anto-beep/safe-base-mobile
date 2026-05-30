// Industry-specific resource catalogue. Curated to match the SafeBase web
// app's per-industry feature pages. The mobile app filters to the
// signed-in user's industry so they never see content for industries they
// aren't in.
//
// Resource kinds:
//   • template  — downloadable form / register / register pack on the web
//   • guide     — step-by-step compliance reference
//   • regulator — outbound link to the national regulator
//   • register  — in-app module (deep-links to /module/<slug> or similar)

import type { IndustryKey } from "./rolesByIndustry";

export type ResourceKind = "template" | "guide" | "regulator" | "register";

export interface ResourceItem {
  id: string;
  title: string;
  sub: string;
  kind: ResourceKind;
  href: string; // internal route OR external URL
  external?: boolean;
}

const WEB = "https://safe-systems.preview.emergentagent.com";

export const RESOURCES_BY_INDUSTRY: Record<IndustryKey, ResourceItem[]> = {
  trades: [
    { id: "swms-template",        title: "SWMS template pack",                  sub: "15 trade-specific Safe Work Method Statements",      kind: "template",  href: `${WEB}/dashboard/library/swms`, external: true },
    { id: "jsa-builder",          title: "JSA builder",                          sub: "Job Safety Analysis worksheet",                       kind: "template",  href: "/library/forms" },
    { id: "toolbox-talks",        title: "Toolbox talks",                        sub: "52 weekly toolbox topics (hazard of the week)",       kind: "guide",     href: "/safety/toolbox_talks" },
    { id: "swa-codes",            title: "Safe Work Australia codes of practice", sub: "Construction WHS COPs (federal + state)",            kind: "regulator", href: "https://www.safeworkaustralia.gov.au/law-and-regulation/codes-of-practice", external: true },
    { id: "trade-licences",       title: "Trade licence register",               sub: "State licence reciprocity matrix (electrical, plumbing, gas)", kind: "register", href: "/module/safety-credentials" },
    { id: "hazardous-substances", title: "Hazardous substances register",        sub: "SDS-driven chemical register",                         kind: "register",  href: "/safety/substances" },
    { id: "plant-pre-use",        title: "Plant pre-use checks",                 sub: "EWP / excavator / skid-steer daily inspections",     kind: "register",  href: "/safety/plant" },
  ],
  hospitality: [
    { id: "fsanz-3-2-2",     title: "FSANZ 3.2.2 / 3.2.2A starter pack",    sub: "Food Safety Standards register pack",                  kind: "template",  href: `${WEB}/dashboard/library/food-safety`, external: true },
    { id: "haccp",           title: "HACCP CCP register",                    sub: "Critical control points + corrective actions",         kind: "register",  href: "/hospitality/haccp" },
    { id: "temp-logs",       title: "Temperature log register",              sub: "Fridge / freezer / hot-hold (FSANZ 3.2.2)",            kind: "register",  href: "/hospitality/temperature-logs" },
    { id: "allergens",       title: "Allergen declaration matrix",           sub: "Menu allergens + cross-contact controls",              kind: "register",  href: "/hospitality/allergens" },
    { id: "liquor-rsa",      title: "Liquor / RSA compliance",               sub: "Licence + RSA register by state",                      kind: "register",  href: "/hospitality/liquor" },
    { id: "food-recall",     title: "Food recall plan template",             sub: "FSANZ + state health dept playbook",                   kind: "template",  href: `${WEB}/dashboard/library/recall`, external: true },
    { id: "foodsafety-anz",  title: "Food Standards Australia New Zealand", sub: "Regulator portal",                                      kind: "regulator", href: "https://www.foodstandards.gov.au", external: true },
  ],
  transport: [
    { id: "hvnl-fatigue",   title: "HVNL fatigue work-rest planner",      sub: "Standard / BFM / AFM hours templates",            kind: "template",  href: "/transport/fatigue" },
    { id: "pretrip",        title: "Daily pre-trip inspection",            sub: "NHVR-aligned pre-departure check",                kind: "register",  href: "/transport/pretrip" },
    { id: "load-restraint", title: "Load Restraint Guide 3rd Ed.",         sub: "Performance standards calculator",                kind: "register",  href: "/transport/load-restraint" },
    { id: "mass-decl",      title: "Mass declarations (GML/CML/HML/PBS)", sub: "Per-trip mass compliance declarations",            kind: "register",  href: "/transport/mass" },
    { id: "cor-policy",     title: "CoR due diligence pack",                sub: "Chain of Responsibility primary-duty kit",        kind: "template",  href: "/transport/cor" },
    { id: "ffd",            title: "Fitness-for-duty declaration",          sub: "Pre-shift driver sign-on",                        kind: "register",  href: "/transport/fitness-for-duty" },
    { id: "nhvr",           title: "National Heavy Vehicle Regulator",      sub: "Notifiable occurrence reporting + portal",        kind: "regulator", href: "https://www.nhvr.gov.au", external: true },
  ],
  healthcare: [
    { id: "ahpra",            title: "AHPRA registration register",          sub: "Practitioner registrations + conditions tracking",  kind: "register",  href: "/healthcare/ahpra" },
    { id: "worker-screening", title: "Worker screening register",            sub: "NDIS WSC / WWCC / NPC",                              kind: "register",  href: "/healthcare/worker-screening" },
    { id: "sirs-ndis",        title: "SIRS + NDIS reportable incidents",    sub: "Aged care + disability service reporting",          kind: "register",  href: "/healthcare/sirs" },
    { id: "care-minutes",     title: "Care minutes log",                     sub: "Aged Care direct-care evidence",                    kind: "register",  href: "/healthcare/care-minutes" },
    { id: "acqsc-evidence",   title: "ACQSC evidence pack",                  sub: "Aged Care Quality Standards artefact builder",      kind: "template",  href: "/healthcare/acqsc" },
    { id: "ahpra-portal",     title: "AHPRA regulator portal",                sub: "Look up practitioners + lodge notifications",       kind: "regulator", href: "https://www.ahpra.gov.au", external: true },
    { id: "acqsc-portal",     title: "Aged Care Quality & Safety Commission", sub: "Regulator portal (audit + complaint lodgement)",  kind: "regulator", href: "https://www.agedcarequality.gov.au", external: true },
  ],
  retail: [
    { id: "lone-worker",         title: "Lone-worker check-in register",       sub: "After-hours / single-staff venue check-ins",        kind: "register",  href: "/retail/lone-worker" },
    { id: "customer-incidents", title: "Customer incident log",                sub: "Slip / aggression / theft incident reports",        kind: "register",  href: "/retail/customer-incidents" },
    { id: "quick-induct",        title: "Quick induct QR",                       sub: "Casual / contractor pre-shift induction",           kind: "template",  href: "/retail/quick-induct" },
    { id: "roster-eligibility", title: "Roster eligibility check",              sub: "Right-to-work + licences before rostering",         kind: "register",  href: "/retail/roster-eligibility" },
    { id: "shopfloor-checks",    title: "Shop-floor compliance walk",            sub: "Daily store opening checklist",                     kind: "template",  href: "/library/forms" },
    { id: "fair-work",           title: "Fair Work Ombudsman",                  sub: "Award + roster compliance reference",                kind: "regulator", href: "https://www.fairwork.gov.au", external: true },
  ],
};

export function resourcesFor(industry?: string | null): ResourceItem[] {
  if (!industry) return [];
  const key = industry as IndustryKey;
  return RESOURCES_BY_INDUSTRY[key] ?? [];
}
