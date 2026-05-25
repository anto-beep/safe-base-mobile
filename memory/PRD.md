# SafeBase Mobile — PRD

## 1. Product

The SafeBase mobile companion app is a native (Expo SDK 54) React Native
client for the existing SafeBase compliance SaaS. It serves **both**:

- **Owners** — live industry dashboards, inline actions (pause driver, send
  AHPRA reminder, send licence reminder, ack lone-worker check-in), an inbox
  of regulator/team alerts, and a Claude-backed concierge chat.
- **Workers** — daily capture flows: lone-worker check-in, pre-trip
  inspection, fitness-for-duty, temperature log, incident report, SWMS
  sign-on.

The app is **industry-aware** — every screen swaps accent colour, copy and
recommended captures by `user.industry`:
- Trades → `#FFCC00`
- Hospitality → `#F59E0B`
- Transport → `#0DC4B5`
- Healthcare → `#2196A6`
- Retail → `#A855F7`

## 2. Architecture

- **Frontend:** Expo Router (SDK 54), TypeScript, file-based routes, dark
  brutalist design tokens (0px corners, 1px borders, monospace eyebrows).
- **Backend:** the existing external SafeBase FastAPI service at
  `https://safe-systems.preview.emergentagent.com/api/*` (configured via
  `EXPO_PUBLIC_SAFEBASE_API`). The mobile app **does not** modify
  `/app/backend/server.py` (the local stub) — it points entirely at the
  external service.
- **State:** lightweight `AuthContext` + `expo-secure-store` for the JWT,
  `AsyncStorage` for non-secrets (chat session id, push token id, user
  snapshot).
- **Push:** `expo-notifications` registers an Expo push token and forwards it
  to `POST /api/device-tokens/register`. On sign-out we soft-deactivate via
  `DELETE /api/device-tokens/{id}`.
- **Auth:** email/password against `/api/auth/login` and `/api/auth/register`.
  Google sign-in via Emergent's hosted flow at `auth.emergentagent.com` —
  `session_id` is forwarded to `/api/auth/google-session`.

## 3. Route map

| Route                              | Purpose                                |
|------------------------------------|----------------------------------------|
| `/`                                | Boot redirect (auth gate)              |
| `/login`                           | Email/password + Google sign-in        |
| `/register`                        | Sign-up (with industry picker)         |
| `/forgot-password`                 | Reset link                             |
| `/(tabs)`                          | Bottom-tab shell                       |
| `/(tabs)/index`                    | Industry-aware Home dashboard          |
| `/(tabs)/capture`                  | Capture hub (industry-prioritised)     |
| `/(tabs)/notifications`            | Inbox + deep-linking                   |
| `/(tabs)/chat`                     | Concierge chat (Claude 4.5)            |
| `/(tabs)/profile`                  | Profile, industry switcher, logout     |
| `/capture/lone-worker-checkin`     | Retail capture                         |
| `/capture/pretrip-inspection`      | Transport capture                      |
| `/capture/fitness-for-duty`        | Transport capture                      |
| `/capture/temperature-log`         | Hospitality / Healthcare capture       |
| `/capture/incident-report`         | All industries                         |
| `/capture/swms-signon`             | Trades / Transport capture             |

## 4. Backend endpoints used

Auth: `/auth/login`, `/auth/register`, `/auth/me`, `/auth/logout`,
`/auth/forgot-password`, `/auth/google-session`, `/auth/me/industry`.

Home: `/compliance/score`, `/notifications`, `/dashboard/widget/{credential-expiry|temp-alert|fatigue-alert|ahpra-expiry|lone-worker}`.

Inline actions: `/transport/drivers/{id}/pause`,
`/healthcare/ahpra-register/{id}/remind`, `/licences/{id}/remind`,
`/retail/lone-worker/{id}/acknowledge`.

Capture: `/retail/lone-worker/checkin`, `/transport/pretrip-inspections`,
`/transport/fitness-for-duty`, `/hospitality/temperature-logs`, `/incidents`,
`/swms`.

Notifications: `/notifications`, `/notifications/{id}/read`,
`/notifications/read-all`.

Chat: `/concierge/chat`.

Push: `/device-tokens/register`, `/device-tokens/{id}`.

## 5. Design language

- Dark brutalist: `#0A0A0A` base, `#141414` surfaces, `#27272A` 1px borders.
- 0px corners everywhere.
- Monospace eyebrow labels (`/ DASHBOARD`, `/ TRADES`).
- Industry accent applied to primary buttons, active tab icon, input focus
  ring, alert-tile left border, score number, chat user bubble.

## 6. Push notifications

- Permission requested **contextually**, only after sign-in.
- Token registered on first run via `usePushRegistration(true)` in
  `/app/(tabs)/_layout.tsx`.
- Deregister on logout (`deregisterPush()` in profile screen).
- Android channel `default` is registered with high importance and the
  SafeBase yellow LED colour.

## 7. Known external dependency

The external SafeBase preview at `safe-systems.preview.emergentagent.com` was
returning HTTP 404 on `/api/*` at build time. The mobile app fails-soft (all
errors surfaced to the user) and will start working end-to-end the moment
that preview is woken.

## 8. Iteration history

### Iter1 — MVP shipped (Feb 25 2026)
- Auth flow (login / register / forgot-password / Google sign-in)
- 5 bottom tabs (Home / Capture / Inbox / Concierge / Profile)
- Industry-aware home dashboard with live `IndustryAlertTile` and inline
  actions
- Compliance-score card + quick-capture grid (industry-specific)
- 6 capture flows (lone-worker, pre-trip, fitness-for-duty, temperature log,
  incident report, SWMS sign-on)
- Notifications inbox with deep-linking
- Concierge chat with persistent `session_id`
- Profile with industry switcher and sign-out
- Expo push registration wired to `/api/device-tokens/register`
- All test-IDs in place for QA automation
