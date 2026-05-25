import { CaptureFormScreen } from "@/src/components/CaptureFormScreen";

export default function LoneWorkerCheckIn() {
  return (
    <CaptureFormScreen
      testIdPrefix="lone-worker"
      eyebrow="Retail · Lone worker"
      title="Lone-worker check-in"
      subtitle="Confirm you're safe and on shift. We'll alert your owner if your next check-in is missed."
      submitLabel="Submit check-in"
      endpoint="/retail/lone-worker/checkin"
      successMessage="Check-in logged. Stay safe out there."
      fields={[
        {
          key: "status",
          label: "How are you tracking?",
          type: "select",
          required: true,
          options: [
            { value: "ok", label: "All good" },
            { value: "uncomfortable", label: "Feeling uncomfortable" },
            { value: "incident", label: "Needs follow-up" },
          ],
        },
        {
          key: "location",
          label: "Location / store",
          type: "text",
          placeholder: "e.g. Bourke St, Floor 2",
        },
        {
          key: "next_checkin_min",
          label: "Next check-in (minutes from now)",
          type: "number",
          defaultValue: 60,
        },
        {
          key: "notes",
          label: "Notes (optional)",
          type: "longtext",
          placeholder: "Anything to flag for your manager?",
        },
      ]}
    />
  );
}
