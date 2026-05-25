import { AdminListScreen } from "@/src/components/AdminListScreen";

export default function AdminAccounts() {
  return (
    <AdminListScreen
      title="Accounts"
      eyebrow="Customer accounts"
      endpoint="/internal-admin/accounts"
      testIdBase="admin-accounts"
      primary={(x) => x.company_name ?? x.name ?? x.email ?? "Account"}
      sub={(x) => [x.industry, x.email, `${x.user_count ?? "—"} users`].filter(Boolean).join(" · ")}
      tail={(x) => x.status?.toUpperCase?.() ?? null}
    />
  );
}
