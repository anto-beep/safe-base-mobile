import { CaptureFormScreen } from "@/src/components/CaptureFormScreen";

export default function IncidentReport() {
  return (
    <CaptureFormScreen
      testIdPrefix="incident"
      eyebrow="Incident report"
      title="Report an incident"
      subtitle="Hazard, injury or near-miss. SafeBase routes it to the right regulator workflow."
      submitLabel="Submit report"
      endpoint="/incidents"
      successMessage="Incident logged. Owner has been notified."
      fields={[
        { key: "title", label: "Short title", type: "text", required: true, placeholder: "e.g. Slip in kitchen" },
        {
          key: "severity",
          label: "Severity",
          type: "select",
          required: true,
          defaultValue: "minor",
          options: [
            { value: "near_miss", label: "Near-miss" },
            { value: "minor", label: "Minor" },
            { value: "serious", label: "Serious" },
            { value: "critical", label: "Critical / notifiable" },
          ],
        },
        {
          key: "category",
          label: "Category",
          type: "select",
          defaultValue: "injury",
          options: [
            { value: "injury", label: "Injury" },
            { value: "property", label: "Property damage" },
            { value: "near_miss", label: "Near-miss" },
            { value: "customer", label: "Customer incident" },
            { value: "regulator", label: "Regulator notifiable" },
          ],
        },
        { key: "location", label: "Location", type: "text", placeholder: "Site / room / vehicle" },
        {
          key: "description",
          label: "What happened?",
          type: "longtext",
          required: true,
          placeholder: "Describe what happened, who was involved, and immediate actions taken.",
        },
      ]}
      transform={(v, user) => ({
        ...v,
        industry: user?.industry,
      })}
    />
  );
}
