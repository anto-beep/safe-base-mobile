// The legacy quick-capture incident form has been superseded by the full
// 5-stage IncidentWorkflow flow that mirrors the SafeBase web app.
//
// We redirect users (and any Capture-tab buttons that pointed here) straight
// to /incident/new \u2014 the parity-checked 6-step submission wizard with photos.

import { Redirect } from "expo-router";

export default function IncidentReportRedirect() {
  return <Redirect href="/incident/new" />;
}
