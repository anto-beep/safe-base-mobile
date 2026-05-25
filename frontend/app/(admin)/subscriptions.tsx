import { AdminListScreen } from "@/src/components/AdminListScreen";

export default function AdminSubscriptions() {
  return (
    <AdminListScreen
      title="Subscriptions"
      eyebrow="Stripe mirror"
      endpoint="/internal-admin/subscriptions"
      testIdBase="admin-subs"
      primary={(x) => x.company_name ?? x.customer_email ?? `Sub ${x.subscription_id ?? ""}`}
      sub={(x) => `${x.plan ?? "—"} · A$${x.mrr_aud ?? 0}/mo · ${x.industry ?? ""}`}
      tail={(x) => x.status?.toUpperCase?.() ?? null}
    />
  );
}
