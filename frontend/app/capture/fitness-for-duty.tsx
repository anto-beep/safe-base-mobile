import { CaptureFormScreen } from "@/src/components/CaptureFormScreen";

export default function FitnessForDuty() {
  return (
    <CaptureFormScreen
      testIdPrefix="fitness"
      eyebrow="Transport · Fitness for duty"
      title="Fitness-for-duty declaration"
      subtitle="Pre-shift declaration. Required under the fatigue management scheme."
      submitLabel="Sign declaration"
      endpoint="/transport/fitness-for-duty"
      successMessage="Declaration logged."
      fields={[
        {
          key: "fit_for_duty",
          label: "I declare I am fit for duty",
          type: "boolean",
          defaultValue: true,
        },
        {
          key: "rest_hours",
          label: "Hours of rest before this shift",
          type: "number",
          required: true,
          placeholder: "e.g. 8",
        },
        {
          key: "medication",
          label: "Taking medication that may impair driving?",
          type: "select",
          required: true,
          defaultValue: "no",
          options: [
            { value: "no", label: "No" },
            { value: "yes", label: "Yes — discussed with supervisor" },
          ],
        },
        {
          key: "alcohol_drugs",
          label: "Free of alcohol & illicit drugs",
          type: "boolean",
          defaultValue: true,
        },
        {
          key: "fatigue_scheme",
          label: "Fatigue scheme",
          type: "select",
          defaultValue: "standard",
          options: [
            { value: "standard", label: "Standard (12h)" },
            { value: "bfm", label: "BFM (14h)" },
            { value: "afm", label: "AFM (15h)" },
          ],
        },
        { key: "notes", label: "Notes", type: "longtext" },
      ]}
    />
  );
}
