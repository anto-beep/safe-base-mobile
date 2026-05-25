import { AdminListScreen } from "@/src/components/AdminListScreen";

export default function AdminAuditLogs() {
  return (
    <AdminListScreen
      title="Audit logs"
      eyebrow="Write trail"
      endpoint="/internal-admin/audit-logs"
      testIdBase="admin-audit"
      primary={(x) => x.action ?? x.event ?? "Event"}
      sub={(x) => `${x.actor ?? x.admin_email ?? "—"} · ${x.target ?? ""} · ${x.created_at ?? ""}`}
      tail={(x) => x.outcome?.toUpperCase?.() ?? null}
    />
  );
}
