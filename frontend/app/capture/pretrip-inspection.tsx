import { CaptureFormScreen } from "@/src/components/CaptureFormScreen";

export default function PreTripInspection() {
  return (
    <CaptureFormScreen
      testIdPrefix="pretrip"
      eyebrow="Transport · Pre-trip"
      title="Pre-trip inspection"
      subtitle="Heavy vehicle pre-start check. Tick what's been visually inspected and is in working order."
      submitLabel="Submit inspection"
      endpoint="/transport/pretrip-inspections"
      successMessage="Pre-trip inspection logged."
      fields={[
        { key: "rego", label: "Vehicle rego", type: "text", required: true, placeholder: "e.g. AB12CD" },
        { key: "odometer_km", label: "Odometer (km)", type: "number", required: true, placeholder: "e.g. 348210" },
        { key: "tyres_ok", label: "Tyres — tread, pressure, no damage", type: "boolean", defaultValue: true },
        { key: "lights_ok", label: "Lights, indicators & reflectors working", type: "boolean", defaultValue: true },
        { key: "brakes_ok", label: "Brakes — air system, hand brake, pedal feel", type: "boolean", defaultValue: true },
        { key: "load_ok", label: "Load restraint — Load Restraint Guide 3rd Ed. compliant", type: "boolean", defaultValue: true },
        { key: "leaks_ok", label: "No fluid leaks visible", type: "boolean", defaultValue: true },
        { key: "defects", label: "Defects / notes", type: "longtext", placeholder: "Describe any defects to report." },
      ]}
    />
  );
}
