import { CaptureFormScreen } from "@/src/components/CaptureFormScreen";

export default function TemperatureLog() {
  return (
    <CaptureFormScreen
      testIdPrefix="temp-log"
      eyebrow="Hospitality · Temp log"
      title="Temperature log"
      subtitle="Record fridge, freezer, hot-hold or dishwasher rinse readings. Logged to your HACCP plan."
      submitLabel="Log reading"
      endpoint="/hospitality/temperature-logs"
      successMessage="Temperature reading logged."
      fields={[
        {
          key: "equipment",
          label: "Equipment",
          type: "text",
          required: true,
          placeholder: "e.g. Fridge 1 (kitchen)",
        },
        {
          key: "unit_type",
          label: "Type",
          type: "select",
          defaultValue: "fridge",
          options: [
            { value: "fridge", label: "Fridge" },
            { value: "freezer", label: "Freezer" },
            { value: "hot_hold", label: "Hot-hold" },
            { value: "dishwasher", label: "Dishwasher rinse" },
          ],
        },
        {
          key: "temp_c",
          label: "Temperature (°C)",
          type: "number",
          required: true,
          placeholder: "e.g. 3.4",
        },
        {
          key: "in_range",
          label: "Reading within target range",
          type: "boolean",
          defaultValue: true,
        },
        { key: "notes", label: "Notes (optional)", type: "longtext" },
      ]}
    />
  );
}
