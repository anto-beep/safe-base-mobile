import { AdminListScreen } from "@/src/components/AdminListScreen";

export default function AdminFeatureFlags() {
  return (
    <AdminListScreen
      title="Feature flags"
      eyebrow="Toggles"
      endpoint="/internal-admin/feature-flags"
      testIdBase="admin-flags"
      primary={(x) => x.key ?? x.name ?? "Flag"}
      sub={(x) => x.description ?? "Toggle to enable/disable globally"}
      tail={(x) => (x.enabled ?? x.value ? "ON" : "OFF")}
    />
  );
}
