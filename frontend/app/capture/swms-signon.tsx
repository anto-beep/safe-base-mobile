import { CaptureFormScreen } from "@/src/components/CaptureFormScreen";

export default function SwmsSignOn() {
  return (
    <CaptureFormScreen
      testIdPrefix="swms"
      eyebrow="Trades · SWMS sign-on"
      title="SWMS pre-start sign-on"
      subtitle="Acknowledge the Safe Work Method Statement before starting on site."
      submitLabel="Sign on"
      endpoint="/swms"
      successMessage="SWMS sign-on recorded. Have a safe shift."
      fields={[
        { key: "site_name", label: "Site", type: "text", required: true, placeholder: "e.g. 14 Collins St" },
        {
          key: "swms_id",
          label: "SWMS reference",
          type: "text",
          placeholder: "e.g. SWMS-2026-014",
        },
        {
          key: "tasks",
          label: "Tasks today",
          type: "longtext",
          placeholder: "Working at heights, electrical, hot works…",
        },
        { key: "ppe_ok", label: "I have the required PPE", type: "boolean", defaultValue: true },
        { key: "hazards_reviewed", label: "Hazards & controls reviewed with crew", type: "boolean", defaultValue: true },
        { key: "fit_for_work", label: "I am fit for work", type: "boolean", defaultValue: true },
        { key: "signed_by", label: "Signed by", type: "text", required: true, placeholder: "Your full name" },
      ]}
      transform={(v) => ({ ...v, action: "sign_on" })}
    />
  );
}
