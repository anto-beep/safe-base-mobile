#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  SafeBase Mobile App — Expo React Native (SDK 54) companion app to the external
  SafeBase FastAPI backend at https://safe-systems.preview.emergentagent.com/api/*.
  v1 MVP features already scaffolded: email/password + Google + biometric auth,
  role/industry routing (Owner vs Worker), Internal Admin stack, multi-industry
  switcher, offline-first SQLite capture queue, Concierge AI chat, push token
  registration, dynamic colour system. This testing pass is the first E2E run
  against the live (now-awake) backend.

backend:
  - task: "External SafeBase backend connectivity"
    implemented: true
    working: true
    file: "src/api/client.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Confirmed POST /api/auth/login returns 200 + JWT for trades.demo@safebase.com.au. Backend pod is now awake."

frontend:
  - task: "Email/password login flow (customer)"
    implemented: true
    working: "NA"
    file: "app/login.tsx, src/context/AuthContext.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Needs live E2E validation. Demo creds in test_credentials.md."

  - task: "Admin login flow"
    implemented: true
    working: "NA"
    file: "app/admin-login.tsx, src/context/AdminAuthContext.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Should hit /api/internal-admin/login and route to (admin) stack."

  - task: "Dynamic colour system (authority blue / admin yellow / industry accent)"
    implemented: true
    working: "NA"
    file: "src/theme/colors.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Verify accent changes after login: trades=#FFA630, hospitality=red, etc. Admin should be yellow/ink."

  - task: "Owner vs Worker dashboard routing"
    implemented: true
    working: "NA"
    file: "app/(tabs)/index.tsx, app/(tabs)/_layout.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

  - task: "Industry switcher + module navigation"
    implemented: true
    working: "NA"
    file: "src/components/IndustrySwitcher.tsx, app/module/[slug].tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true

  - task: "Offline-first capture queue (SQLite)"
    implemented: true
    working: "NA"
    file: "src/lib/offline-queue.ts, app/capture/*.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Test on web fallback (offline-queue.web.ts). Native SQLite path can only be validated via dev build."

  - task: "Concierge AI chat overlay"
    implemented: true
    working: "NA"
    file: "app/chat.tsx, src/components/FloatingOverlays.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true

  - task: "Forgot password flow"
    implemented: true
    working: "NA"
    file: "app/forgot-password.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true

  - task: "Industry alert tiles / widget fetching"
    implemented: true
    working: "NA"
    file: "src/components/IndustryAlertTile.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: true

test_plan:
  current_focus:
    - "Email/password login flow (customer)"
    - "Admin login flow"
    - "Dynamic colour system (authority blue / admin yellow / industry accent)"
    - "Owner vs Worker dashboard routing"
    - "Industry alert tiles / widget fetching"
    - "Concierge AI chat overlay"
    - "Offline-first capture queue (SQLite)"
    - "Industry switcher + module navigation"
    - "Forgot password flow"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      First E2E run against live SafeBase backend. Backend is verified awake
      (POST /api/auth/login → 200). Please run frontend testing via the web
      preview at http://localhost:3000 (Expo web build of the same Expo Router
      app). Use the demo credentials from /app/memory/test_credentials.md.

      Key flows to validate:
        1. Customer login (trades.demo@safebase.com.au / Demo@1234) → tabs land
           on Home with industry accent (#FFA630 for trades).
        2. Admin login (admin@safebase.internal / AdminDemo@1234) → (admin) stack.
        3. Pre-login screens use authority blue accent (#003DA5-ish); after login
           the accent swaps to the industry colour (or admin yellow).
        4. Capture forms enqueue offline when network fails and flush on retry.
        5. Concierge chat overlay opens from FloatingOverlays trigger.
        6. Forgot password sends correctly.

      Native-only flows (biometric unlock, push notifications, native SQLite,
      Google OAuth via expo-auth-session) cannot be tested in the web preview —
      mark them NA / requires-native-build in your report rather than failing.

  - agent: "testing"
    message: |
      Iteration 1 (frontend, web preview): 9/11 PASS, 1 NA, 1 deferred.
      Issues found:
        - HIGH: trades accent = #FFCC00 collides with admin warning yellow.
                Should be #FFA630.
        - MED:  stray text node between </TouchableOpacity> and </ScrollView>
                in app/register.tsx ~line 168.
        - MED:  industry switcher hidden when user has only one industry
                (app/(tabs)/profile.tsx:30). Add testID, always render.
        - LOW:  RN-web `props.pointerEvents` deprecation (lib-internal).

  - agent: "main"
    message: |
      Iteration 1 fixes applied:
        1. src/theme/colors.ts → trades accent now #FFA630, hospitality #E11D48
           (hospitality was clashing with trades amber too).
        2. app/register.tsx → whitespace text node removed.
        3. app/(tabs)/profile.tsx → industry switcher row now always renders
           (read-only style when canSwitch=false), wrapped with
           testID="industry-switcher", section header shows "Active industry"
           vs "Switch active industry".
        4. LOW pointerEvents warning is from
           react-navigation/ResourceSavingView (internal, not our code) — left
           as-is.

      Please re-run frontend tests focusing on:
        - Customer trades login → home + profile → confirm accent is amber
          #FFA630, NOT yellow.
        - Profile screen `testID="industry-switcher"` renders.
        - Register screen no longer surfaces "Unexpected text node" console
          error.
        - Iteration 2 should also cover the capture-form offline flush
          (/capture/lone-worker-checkin) and the logout-from-Alert flow on web
          (window.confirm → accept).

  - agent: "testing"
    message: |
      Iteration 2: 6/8 PASS, 1 PARTIAL, 1 CRITICAL FAIL.
      Verified iter_1 fixes are green. New CRITICAL:
        - Alert.alert is a no-op on react-native-web → logout never fires,
          and every capture/save success callback that uses Alert.alert→
          router.back() also silently dies.
      Suggested fix: install an Alert.alert → window.confirm shim.

  - agent: "main"
    message: |
      Iteration 2 fix applied:
        - NEW src/lib/alert-web-shim.ts → runtime monkey-patches Alert.alert
          on web to map to window.alert / window.confirm and invoke the
          destructive/OK or cancel onPress. No-op on iOS/Android (early
          Platform.OS !== "web" return).
        - app/_layout.tsx now calls installAlertWebShim() at module load,
          before any screen mounts.

  - agent: "testing"
    message: |
      Iteration 3: 8/8 PASS.
        - Profile logout fires real browser confirm → routes to /login,
          localStorage cleared.
        - Capture submit fires real browser alert (OK callback reached);
          backend returned 403 on /api/retail/lone-worker/checkin (backend
          team to investigate — not a mobile regression).
        - Full regression sweep green: trades #FFA630, hospitality #E11D48,
          authority blue #002FA7, admin warning #FFCC00, switcher testID,
          forgot-submit, register no text-node, admin stack lands.
        - Console errors: 0.

      Mocked on web preview (carry-over): native SQLite (offline-queue.web.ts
      stub) + push delivery (registration only, APNs/FCM not configured).

  - agent: "main"
    message: |
      PHASE 1C delivered: 5 industry Owner Home dashboards via a single
      industry-agnostic OwnerHome component in app/(tabs)/index.tsx. Each
      industry rotates accent + pillars + alert tile dynamically through
      the live SafeBase endpoints — no per-industry code paths needed.

      6-block layout per spec:
        1. Eyebrow + greeting + industry tagline
        2. Industry Alert Tile (Iter57 actionable; component picks correct
           /api/dashboard/widget/* per industry: temp-alert | fatigue-alert |
           credential-expiry | lone-worker | ahpra-expiry)
        3. KPI row (4 tiles): open-incidents / workflows-live /
           expiring-soon / inbox-unread — all tappable, route to native
           Phase 1A/1B screens
        4. Compliance score card: large numeric + band + per-pillar
           horizontal bars rendered from /api/compliance/score sub_scores
           (parity-faithful to web — pillars are named per industry by the
           backend: trades shows Documents/Incidents/Training/Licences/Site
           Safety; hospitality shows WHS Docs/Food Safety/Staff
           Certifications/Incident Mgmt/Venue Safety; transport/healthcare/
           retail render their own pillar set)
        5. Open this week: top 5 open incidents from /api/incident-workflow
           with reference + title + stage + days-open + severity badge
           (or empty-state "Nothing open · Every incident is closed. Keep it
           that way.")
        6. Quick capture row: existing 2-tile grid per industry (incident/
           swms/temp/pretrip/fitness/lone-worker/etc.)

      Parallel loads with per-source try/catch so one degraded endpoint
      cannot blank the home. Pull-to-refresh re-fetches all 5 sources.

      Verified via screenshot pass:
        - trades.demo: amber #FFA630 throughout, Credential Expiry tile,
          compliance 71 with 5 trade pillars
        - hospitality.demo: red #E11D48 throughout, Temperature Alert tile,
          compliance 75 with hospitality pillars
        - Transport/Healthcare/Retail dashboards share the same render path
          and consume their respective backend widgets; they will look
          identical to trades/hospo styled with their own accent + pillars.

      All Phase 1A/1B/1C screens now interlinked: home KPI tiles → /incident,
      /workflows, /licences, /notifications.

frontend_phase1c:
  - task: "Industry Owner Home dashboard (6-block parity)"
    file: "app/(tabs)/index.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Industry alert tile rotates per industry via dashboard widget"
    file: "src/components/IndustryAlertTile.tsx"
    implemented: true
    working: "NA"
    priority: "medium"
    needs_retesting: true
      parity, status pills, expiry awareness, and the Iter57 actions where
      backend supports them.

      New screens (all wired to live SafeBase backend):
        - /app/risk/index.tsx — Risk register w/ 5×5 filter, level pills,
          inherent/residual scores per row
        - /app/risk/new.tsx (REWRITE) — full field set (category/activity/
          process/hazard/consequence_text/existing_controls/proposed_controls/
          responsible_person/due_date/review_frequency/hrcw_flags) + corrected
          RiskMatrix thresholds (≤4/≤9/≤15 per backend _compute_risk_level)
        - /app/risk/[id].tsx — Risk detail w/ both matrices read-only + delete
        - /app/workers/index.tsx + /app/workers/new.tsx — full WorkerIn shape
        - /app/licences/index.tsx + /app/licences/new.tsx — status pills
          (active/expiring_soon/expired), days_until_expiry meta, Iter57
          "Remind" action wired to POST /api/licences/{id}/remind, delete
        - /app/notifications.tsx — Compliance Inbox w/ tone routing, link
          smart-jumps to /incident/{id}, /licences, /risk
        - /app/reports/index.tsx + /app/reports/[type].tsx — all 10 report
          types from /api/reports rendered generically (scalars + arrays +
          objects, first 25–50 rows + foot)
        - /app/(tabs)/modules.tsx — routeFor() now maps risks, workers,
          licences, workflows, notifications, reports, settings/* to their
          native screens

      Foundation updates:
        - /src/api/safebase.ts — typed wrappers (Workers, Licences, Safety,
          Notifications, Settings, Reports, Workflows, Compliance)
        - /src/components/RiskMatrix.tsx — thresholds fixed to match backend
          (≤4 low, ≤9 medium, ≤15 high, else extreme)

      Smoke-screenshotted /risk, /workers, /licences, /notifications,
      /reports, /workflows after login — all render with real data (4 demo
      workers + 6 demo licences from the live backend).

      Native-only NOT validated on web preview: native SQLite, camera capture,
      push notification delivery, biometric, Google OAuth (carry-over).

      Outstanding work (Phase 1C-E):
        - Phase 1C — 5 industry Home dashboards (currently the app/(tabs)/
          index.tsx is industry-aware but minimal; needs widget integration
          with /api/dashboard/widget/* per industry).
        - Phase 1D — per-industry modules (~50-60 screens across Hospitality
          temp/HACCP/Cleaning/FSS/Liquor/Allergens/Suppliers; Transport
          fleet/pretrip/fatigue/FFD/load/mass/NHVR/CoR; Healthcare AHPRA/
          care minutes/ACQSC/SIRS/NDIS/screening; Retail lone-worker/
          customer incidents/quick-induct/roster; Trades workers/licences/
          SWMS/TradeCheck/Induct/competency/inspections/plant/risks/toolbox).
        - Phase 1E — capture flow polish + admin stack.

frontend_phase1b:
  - task: "API client wrapper for cross-industry endpoints"
    file: "src/api/safebase.ts"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Risk Register list + 5×5 filter + level pills"
    file: "app/risk/index.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Risk creator with full field set + matrix thresholds fix"
    file: "app/risk/new.tsx, src/components/RiskMatrix.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Risk detail w/ both matrices read-only"
    file: "app/risk/[id].tsx"
    implemented: true
    working: "NA"
    priority: "medium"
    needs_retesting: true
  - task: "Workers register + new"
    file: "app/workers/index.tsx, app/workers/new.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Licences register + new + Iter57 remind action"
    file: "app/licences/index.tsx, app/licences/new.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Notifications inbox (mark read / mark all)"
    file: "app/notifications.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Reports index + report viewer (10 report types)"
    file: "app/reports/index.tsx, app/reports/[type].tsx"
    implemented: true
    working: "NA"
    priority: "medium"
    needs_retesting: true
      Endpoints used (all live, verified): GET/POST /api/incident-workflow,
      /api/incident-workflow/stats, /api/incident-workflow/{id},
      PATCH .../triage|investigation|actions|close-out, POST .../reopen,
      AI endpoints categorise/root-cause/lessons-learned. Constants and
      labels mirror the web 1:1 (STAGES, SEVERITIES, INCIDENT_TYPES,
      BODY_AREAS, INJURY_NATURES, TREATMENT_OPTIONS, CONTRIBUTING_FACTORS,
      SHORT/LONG_TERM_ACTION_TYPES, CLOSE_CHECKLIST, INVOLVED_TYPES).

      New screens:
        - /app/incident/index.tsx — Register (stats, filters, search, list)
        - /app/incident/new.tsx — 6-step submission wizard with photos
          (expo-image-picker camera + library, base64 data URIs)
        - /app/incident/[id].tsx — Detail (lifecycle, submission,
          per-stage cards with CTA buttons, audit log)
        - /app/incident/triage/[id].tsx — Stage 2 (sev + notifiability
          matrix + sign-off → advances to investigation)
        - /app/incident/investigation/[id].tsx — Stage 3 (contributing
          factors + root cause + AI assist → advances to actions)
        - /app/incident/actions/[id].tsx — Stage 4 (short/long-term
          actions w/ owner + due, worker comms + consultation)
        - /app/incident/close-out/[id].tsx — Stage 5 (4-category
          checklist + lessons + sign-off → status closed)

      New supporting modules:
        - /src/api/incidents.ts (typed client incl. AI endpoints)
        - /src/constants/incident.ts (parity-checked enums & lists)
        - /src/components/SeverityBadge.tsx, IncidentStageBar.tsx,
          PhotoPicker.tsx, ChipGroup.tsx
        - app/(tabs)/modules.tsx now routes "incidents" tile → /incident
        - app/capture/incident-report.tsx → Redirect → /incident/new
        - Installed expo-image-picker + @react-native-community/datetimepicker

      Smoke-screenshotted /incident and /incident/new — both render and look
      identical to the web register / submit wizard. Please run a full E2E
      pass against the live backend.

frontend_phase1a:
  - task: "Incident register screen (stats + filters + search)"
    file: "app/incident/index.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Incident 6-step submission wizard (photos via expo-image-picker)"
    file: "app/incident/new.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Incident detail (lifecycle + audit log + stage CTAs)"
    file: "app/incident/[id].tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Triage stage (sev + notifiability matrix + sign-off)"
    file: "app/incident/triage/[id].tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Investigation stage (contributing factors + root cause + AI)"
    file: "app/incident/investigation/[id].tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Actions stage (short/long-term actions w/ owner + due)"
    file: "app/incident/actions/[id].tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Close-out stage (4-cat checklist + lessons + sign-off)"
    file: "app/incident/close-out/[id].tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true