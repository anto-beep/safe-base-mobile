# SafeBase Mobile — PRD

## 1. Product

The SafeBase mobile companion app is a native (Expo SDK 54) React Native
client for the existing SafeBase compliance SaaS. It serves **three** distinct
audiences with three distinct nav trees:

1. **Owners / customer admins** — live industry dashboards, inline actions
   (pause driver, send AHPRA reminder, send licence reminder, ack lone-worker
   check-in), notifications inbox with polling, module browser mirroring the
   web, and Claude-backed concierge chat.
2. **Workers** — trimmed daily-shift home (credentials + recent check-ins +
   capture quick-tiles). No modules tab.
3. **SafeBase internal staff** — a completely separate auth context (different
   JWT secret, different storage key) with KPI dashboard, accounts, mocked
   Stripe subscriptions, feature flags and audit logs.

The app is **industry-aware** — every owner screen swaps accent colour, copy
and recommended captures by `user.industry`:
- Trades → `#FFCC00`
- Hospitality → `#F59E0B`
- Transport → `#0DC4B5`
- Healthcare → `#2196A6`
- Retail → `#A855F7`

## 2. Architecture

- **Frontend:** Expo Router (SDK 54), TypeScript, file-based routes, dark
  brutalist design tokens (0px corners, 1px borders, monospace eyebrows).
- **Logo:** typographic mark — yellow tile (`#FFCC00`) + Ionicons `cube` + the
  `SAFEBASE` wordmark — rendered as a component (`src/components/Logo.tsx`).
  No image dependency.
- **Backend:** the existing external SafeBase FastAPI service at
  `https://safe-systems.preview.emergentagent.com/api/*` (configurable via
  `EXPO_PUBLIC_SAFEBASE_API`). The mobile app **does not** modify the local
  backend — it points entirely at the external service.
- **State:** `AuthContext` (customer) + `AdminAuthContext` (SafeBase staff) +
  `AccessibilityContext`. JWTs in `expo-secure-store`, snapshots in
  `AsyncStorage`.
- **Push:** `expo-notifications` registers a token and forwards it to
  `POST /api/device-tokens/register`. Soft-deactivates on logout.
- **Notifications polling:** `useNotificationPolling()` hits `/notifications`
  every 60 s while the app is foregrounded (and re-fires on
  background→foreground transition). Unread badge on the home header bell.
- **Offline-first capture:** native uses `expo-sqlite` + `@react-native-community/netinfo`
  to queue every capture POST under a stable `client_event_id` and replay it
  with header `Idempotency-Key: <client_event_id>` when connectivity returns.
  On web (no SQLite WASM bundled) the queue degrades to a direct POST.
- **Biometric unlock:** `expo-local-authentication`. After a successful
  password sign-in the user can toggle Face ID / fingerprint on in
  `profile.tsx`. The current JWT is stashed under a biometric-protected
  secure-store key (`safebase.biometric.secret_jwt`) and auto-prompted at the
  top of the login screen on next launch.

## 3. Route map

### Customer tree
| Route                              | Purpose                                |
|------------------------------------|----------------------------------------|
| `/`                                | Boot redirect (auth gate)              |
| `/login`                           | Email + password + Google + Biometric  |
| `/register`                        | Sign-up (with industry picker)         |
| `/forgot-password`                 | Reset link                             |
| `/(tabs)`                          | Bottom-tab shell (Home, Modules, Capture, Profile) |
| `/(tabs)/index`                    | Industry-aware Home (worker variant if `role=worker`) |
| `/(tabs)/modules`                  | Module grid mirroring the web          |
| `/(tabs)/capture`                  | Capture hub                            |
| `/(tabs)/profile`                  | Industry switcher, biometric toggle, logout |
| `/chat`                            | Concierge chat (accessed via FAB)      |
| `/notifications`                   | Inbox (accessed via header bell)       |
| `/module/[slug]`                   | Generic module browser → deep-links to web for full CRUD |
| `/capture/lone-worker-checkin`     | Retail capture (offline-queued)        |
| `/capture/pretrip-inspection`      | Transport capture (offline-queued)     |
| `/capture/fitness-for-duty`        | Transport capture (offline-queued)     |
| `/capture/temperature-log`         | Hospitality capture (offline-queued)   |
| `/capture/incident-report`         | All-industry capture (offline-queued)  |
| `/capture/swms-signon`             | Trades capture                         |

### Admin tree (separate JWT context)
| Route                              | Purpose                                |
|------------------------------------|----------------------------------------|
| `/admin-login`                     | Internal staff sign-in + TOTP          |
| `/(admin)`                         | KPI dashboard + activity feed          |
| `/(admin)/accounts`                | Customer accounts list                 |
| `/(admin)/subscriptions`           | Stripe-mirror subscriptions            |
| `/(admin)/feature-flags`           | Global toggles                         |
| `/(admin)/audit-logs`              | Write-action audit trail               |

### Global overlays (auto-mounted when a customer is signed in)
- **Floating concierge FAB** (bottom-right) — opens `/chat`. Detects
  `offer_lead_capture: true` from `/api/concierge/chat` and pops a
  lead-capture sheet that POSTs `/api/concierge/lead`.
- **Accessibility FAB** (bottom-left) — opens an a11y sheet (text size,
  high contrast, reduce motion, dyslexia font, emphasize links).
  Persists to `/api/accessibility/preferences`.

## 4. Backend endpoints used

Auth: `/auth/login`, `/auth/register`, `/auth/me`, `/auth/logout`,
`/auth/forgot-password`, `/auth/google-session`, `/auth/me/industry`.

Home: `/compliance/score`, `/notifications`, `/dashboard/widget/{credential-expiry|temp-alert|fatigue-alert|ahpra-expiry|lone-worker}`, `/worker/my-summary`.

Inline actions: `/transport/drivers/{id}/pause`,
`/healthcare/ahpra-register/{id}/remind`, `/licences/{id}/remind`,
`/retail/lone-worker/{id}/acknowledge`.

Captures (all with `client_event_id` + `Idempotency-Key` header):
`/retail/lone-worker/checkin`, `/transport/pretrip-inspections`,
`/transport/fitness-for-duty`, `/hospitality/temperature-logs`, `/incidents`,
`/swms`.

Modules: `/incidents`, `/workers`, `/documents`, `/tradeinduct/programs`,
`/safety/summary`, `/safety/risks`, `/reports`, `/compliance-inbox`,
`/automations`, `/regulator-pipeline/pending`, `/api-keys`, `/addons/active`,
+ 13 industry-specific list endpoints.

Notifications: `/notifications`, `/notifications/{id}/read`,
`/notifications/read-all` (60 s polling).

Chat: `/concierge/chat`, `/concierge/lead`.

Accessibility: `/accessibility/preferences`.

Push: `/device-tokens/register`, `/device-tokens/{id}`.

Admin (separate JWT): `/internal-admin/login`, `/verify-2fa`, `/me`,
`/logout`, `/dashboard/kpi`, `/dashboard/activity-feed`, `/accounts`,
`/subscriptions`, `/feature-flags`, `/audit-logs`.

## 5. Iteration history

### Iter1 — MVP shipped (Feb 25 2026)
- Auth (login / register / forgot-password / Google sign-in)
- 5 tabs (Home / Capture / Inbox / Concierge / Profile)
- Industry-aware home with `IndustryAlertTile` and inline actions
- 6 capture flows
- Concierge chat
- Expo push registration

### Iter3 — Full colour system overhaul (Feb 26 2026)
Re-aligned the entire palette to the web app spec (`SafeBase Mobile — Colour
System` brief). The dark brutalist look from Iter1/2 was replaced by the
editorial light theme used on safebase.com.au:

- **New identity tokens** (`src/theme/colors.ts`):
  - `ink` `#0A0A0A` · `background` `#FFFFFF` · `warning` `#FFCC00`
  - `authority` `#002FA7` · `muted` `#F5F5F4` · `border` `#E5E5E5`
  - `destructive` `#DC2626` · `success` `#059669`
  - Status tints: `warnTint #FEF3C7` · `dangerTint #FEE2E2` · `successTint #ECFDF5`
- **`activeAccent()` resolver + `useAccent()` hook** swaps the accent at
  runtime based on auth state:
  - Pre-login → `authority` (blue)
  - Internal admin signed in → `warning` (yellow)
  - Customer signed in → `industry` colour
  - High contrast → `warning` (WCAG-AAA override)
- **Back-compat `COLORS.*` shim** points every legacy import at the new
  light values, so every screen re-themed without touching call-sites
  (white surfaces, ink text, light borders, light muted surfaces).
- **`fgForAccent()`** auto-picks `#FFFFFF` text on authority-blue / destructive
  buttons and `#0A0A0A` ink on yellow/amber/teal/purple industry accents.
- **Pre-login screens** (`/login`, `/register`, `/forgot-password`,
  `/admin-login`) all switched to authority blue for primary CTAs, links,
  focus rings and `/ SIGN IN`-style eyebrows.
- **Admin tree** uses `warning` accent everywhere — visually distinct from
  pre-login blue and post-login industry colours.
- **Home header** swapped to a solid `ink` bar with the inverted (white)
  wordmark + industry-coloured bell badge.
- **Concierge chat** header is `ink` with `warning` logo + back arrow, send
  button is `warning` yellow square with ink icon. Industry-neutral.
- **Concierge FAB** always `ink` + `warning` chip; **accessibility FAB**
  always `authority` blue (per spec, never industry-themed — stays
  recognisable everywhere).
- **Logo** always wears the yellow tile (`warning`) — the brand mark is
  industry-immune. Wordmark flips ink↔white via the `invert` prop for use
  on dark hero bars (home header) vs light surfaces (every other screen).

### Iter2 — Full v1 build (Feb 25 2026)
Brought the app from MVP to the full §12 Definition of Done from the build
brief:

- **Typographic logo** replaces all image references (`src/components/Logo.tsx`).
- **Biometric unlock** (Face ID / fingerprint) with auto-prompt on launch.
  Stashed JWT decrypted via `expo-local-authentication`.
- **Internal Admin** — separate `AdminAuthContext`, separate JWT storage key
  (`safebase.admin.jwt`), `/admin-login` with TOTP verification, full 5-tab
  admin tree (KPI / Accounts / Subscriptions / Feature flags / Audit logs).
- **Worker role split** — `(tabs)/index.tsx` branches on `user.role` to
  render `WorkerHome` (credentials + check-ins + 2 capture tiles) instead of
  the owner dashboard. The Modules tab is hidden for workers via Expo Router's
  `href: null`.
- **Offline-first capture** — `src/lib/offline-queue.ts` (native) +
  `offline-queue.web.ts` (web stub) with NetInfo-driven background sync.
  Every capture POST carries `Idempotency-Key`.
- **Modules tab** — universal `(tabs)/modules.tsx` lists 12 core modules
  (Incidents, Workers, Docs, Inductions, Safety, Risks, Reports, Inbox,
  Automations, Regulator pipeline, API keys, Add-ons) + 13 industry-specific
  modules (food safety, allergens, fleet, fatigue, pre-trip, care minutes,
  AHPRA, SIRS, lone worker, store incidents, SWMS library, TradeCheck).
  Generic `/module/[slug]` browser fetches the appropriate list endpoint and
  links out to the web app for full CRUD.
- **Industry switcher pill** — header chip on the Home screen, opens a
  bottom sheet, calls `PATCH /api/auth/me/industry`. Hidden when the user
  only has one industry.
- **Accessibility sheet** — bottom-left FAB → modal with font scale, high
  contrast, reduce motion, dyslexia font, emphasize links. Persists locally
  and POSTs to `/api/accessibility/preferences`.
- **Floating concierge FAB** — bottom-right `TALK TO ME` chip on every
  customer screen, opens `/chat`. Lead-capture sheet auto-opens when the
  backend returns `offer_lead_capture: true`, POSTs to `/api/concierge/lead`.
- **60s notifications polling** — `useNotificationPolling()` hook drives the
  unread-count badge on the Home header bell.
- **`Idempotency-Key` header** added to the API client (used on every queued
  capture).

## 6. Known external dependency

The external SafeBase preview at `safe-systems.preview.emergentagent.com` was
returning HTTP 404 on `/api/*` at build time. The mobile app fails-soft (all
errors surfaced to the user). The moment the preview is woken, all
endpoints — auth, dashboard widgets, modules, inline actions, concierge,
admin — start responding.
