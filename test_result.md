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
    - "Phase 1E-1I MEGA E2E — first live test against awake backend"
    - "Phase 1E per-industry (26 screens): Hospitality 8, Transport 8, Healthcare 6, Retail 4 + Capture rework + Modules sidebar"
    - "Phase 1F Settings stack: business/team/billing/notifications/onboarding"
    - "Phase 1G Workflows: workflows/index hub + workflows/[type]"
    - "Phase 1H Library + Safety: library/[type], safety/[module]"
    - "Phase 1I Apps & Add-ons (9): academy, api-keys, automations, branding, mobile-worker, partner, tradecheck, tradeinduct, webhooks"
    - "Locked-tile gating per industry/entitlements (Capture + Modules)"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

frontend_phase1e_to_1i:
  - task: "Capture tab — industry-aware quick-capture tiles + LockedTile gating"
    file: "app/(tabs)/capture.tsx, src/components/LockedTile.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Modules tab — sidebar parity with web (industry + cross-industry)"
    file: "app/(tabs)/modules.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Hospitality canonical screens (8): temperature-logs, fss-register, haccp, allergens, cleaning, suppliers, liquor, inspection-pack"
    file: "app/hospitality/*.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Transport canonical screens (8): pretrip, vehicles, fatigue, fitness-for-duty, load-restraint, mass, cor, nhvr"
    file: "app/transport/*.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Healthcare canonical screens (6): ahpra, worker-screening, sirs, ndis, acqsc, care-minutes"
    file: "app/healthcare/*.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Retail canonical screens (4): lone-worker, quick-induct, customer-incidents, roster-eligibility"
    file: "app/retail/*.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Settings stack (5): business, team, billing, notifications, onboarding"
    file: "app/settings/*.tsx, src/api/extras.ts"
    implemented: true
    working: "NA"
    priority: "medium"
    needs_retesting: true
  - task: "Workflows hub + dynamic type screen"
    file: "app/workflows/index.tsx, app/workflows/[type].tsx"
    implemented: true
    working: "NA"
    priority: "medium"
    needs_retesting: true
  - task: "Library dynamic type screen"
    file: "app/library/[type].tsx"
    implemented: true
    working: "NA"
    priority: "medium"
    needs_retesting: true
  - task: "Safety dynamic module screen"
    file: "app/safety/[module].tsx"
    implemented: true
    working: "NA"
    priority: "medium"
    needs_retesting: true
  - task: "Apps & Add-ons (9): academy, api-keys, automations, branding, mobile-worker, partner, tradecheck, tradeinduct, webhooks"
    file: "app/addons/*.tsx, src/api/extras.ts"
    implemented: true
    working: "NA"
    priority: "medium"
    needs_retesting: true
  - task: "API client improvements — 403/404/401 friendly handling"
    file: "src/api/client.ts"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true

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
      MEGA SCAFFOLDING PASS — Phase 1E through 1I shipped between
      iter 3 and this iteration WITHOUT runtime E2E (backend was 404 the
      entire session). Backend is now confirmed awake (POST /api/auth/login
      → 200 + JWT for trades.demo). Please run a comprehensive E2E pass
      against http://localhost:3000.

      Scope (≈43 net-new screens + 2 reworked tab roots):
        Phase 1E — per-industry canonical screens (26):
          Hospitality (8): temperature-logs, fss-register, haccp, allergens,
            cleaning, suppliers, liquor, inspection-pack
          Transport (8): pretrip, vehicles, fatigue, fitness-for-duty,
            load-restraint, mass, cor, nhvr
          Healthcare (6): ahpra, worker-screening, sirs, ndis, acqsc,
            care-minutes
          Retail (4): lone-worker, quick-induct, customer-incidents,
            roster-eligibility
        Phase 1F — Settings stack (5): business, team, billing,
          notifications, onboarding
        Phase 1G — Workflows hub: workflows/index.tsx, workflows/[type].tsx
        Phase 1H — Library + Safety: library/[type].tsx, safety/[module].tsx
        Phase 1I — Apps & Add-ons (9 under app/addons/): academy, api-keys,
          automations, branding, mobile-worker, partner, tradecheck,
          tradeinduct, webhooks
        Capture tab REWORKED — industry-aware quick tiles + LockedTile
        Modules tab REWORKED — sidebar parity with web

      How to test:
        1. Sign in as trades.demo@safebase.com.au / Demo@1234. Capture +
           Modules tabs should show trades tiles; cross-industry tiles
           (workflows/library/safety/settings/apps) should all open and
           hit real /api/* endpoints. Hospitality/Transport/Healthcare/
           Retail tiles MUST appear locked (LockedTile) for the trades user.
        2. Sign in as hospitality.demo@safebase.com.au / Demo@1234.
           Capture should expose hospitality temp-log + lone-worker tiles;
           hospitality modules (temperature-logs, fss, haccp, allergens,
           cleaning, suppliers, liquor, inspection-pack) must open and
           render real data or empty-states. Industry accent = #E11D48.
        3. Spot check Transport/Healthcare/Retail demo accounts if time
           permits; minimally confirm at least 1 list screen per industry
           loads or shows a friendly 403 (NOT a crash).
        4. Validate cross-industry screens for every signed-in user:
             - /workflows (hub) lists catalog + active instances
             - /library/[type] for at least documents and 1 other type
             - /safety/[module] for at least 1 module
             - /settings/business + /settings/team load
             - /addons/automations + /addons/webhooks + /addons/api-keys load
        5. Verify 403/404 paths show a friendly Card (per the api/client.ts
           improvements), not a raw axios crash.
        6. Re-confirm no Iteration 1/2 regressions: trades accent #FFA630,
           industry-switcher testID present, Alert.alert shim still
           functional on web.

      Native-only (NA for web preview): native SQLite, push delivery,
      Google OAuth, biometric. Mark these NA in the report.

      Known third-party mocks: push-token registration uses a web stub.

      Credentials file: /app/memory/test_credentials.md.

  - agent: "testing"
    message: |
      Iteration 8 (frontend, web preview): ~82% green (41/43 screens mount).
      HIGH issues found:
        - /addons/api-keys → red-screen crash `(targets ?? ["generic"]).map is
          not a function`. ApiKeysApi.targets() returned non-array.
        - /library/[type] for documents/policies → fell through to "Process
          library" title with raw type in body.
        - /safety/[module] for unmapped slugs (swms etc.) → silent fallback
          to Inspections chrome + backend "Unknown safety module" error.
      MED:
        - /addons/tradecheck rendered "3 of undefined businesses verified".
        - src/api/client.ts friendly 403/401 copy was suppressed by
          backendDetail precedence.
        - Capture-tab non-owned-industry tiles were hidden (spec said
          locked-tile).
        - hospitality.demo login flaked once (retest needed).
      Regression: all amber/red/yellow accents still correct, no text-node,
      all 4 industries × all per-industry screens still mount.

  - agent: "main"
    message: |
      Iteration 8 fixes applied (7 total):
        1. app/addons/api-keys.tsx → Array.isArray(t) guard on targets.
        2. app/library/[type].tsx → added META entries for documents,
           policies, forms, templates + prettify() fallback for any other
           slug (icon: library-outline, generic friendly copy).
        3. app/safety/[module].tsx → if CONFIG[slug] is undefined, render
           a friendly 'Available on web' Card with prettified title +
           Open-on-web button. All hooks lifted above early return to
           satisfy Rules of Hooks. SafetyApi calls now use moduleKeyTyped
           cast so types are clean.
        4. app/addons/tradecheck.tsx → `typeof stats.total === "number"`
           guard before rendering the verified-count subtitle.
        5. src/api/client.ts → new preferFriendly precedence: 401, 403,
           5xx always use the friendly copy; 404 and other statuses still
           prefer backend detail when present.
        6. app/(tabs)/capture.tsx → added 'Other industries' eyebrow + grid
           of LockedTile cards for the 4 non-owned industries. Mirrors the
           Modules sidebar pattern. Per user "show locked tiles" directive.
        7. src/api/client.ts (bonus) → exposed `api.put` (was missing —
           safebase.ts/extras.ts had calls that would have crashed on
           settings/business put, settings/notifications put, onboarding
           put, partner branding put).

  - agent: "testing"
    message: |
      Iteration 10: 10/12 verified green.
        - 4-tab layout (Home/Modules/Capture/Settings) confirmed, Profile
          merged into Settings.
        - Trial banner renders correctly with countdown and routes to
          /billing.
        - Settings tab: identity, plan summary card (3/5 unlocked, 3 trial),
          Account + Plan sections, Talk to support, Sign out.
        - Billing dashboard: 5 industry cards with status pills correctly
          driven from /billing/my-subscriptions.
        - Plans sheet opens with monthly/annual toggle.
        - Capture & Modules tabs gated by BillingContext.isUnlocked;
          unlocked extras (trial/active) render inline with TRIAL pill;
          locked industries fall to LockedTile leading to /billing.
        - Accessibility widget NOW WORKS: html font-size goes 16→20.8 on
          Larger; <style id="safebase-a11y-style"> tag injects on web; the
          dyslexia/high-contrast/emphasize-links rules append correctly.
        - No console errors, no red screens, accents preserved.
      Issues found:
        - MED (frontend): duplicate "Start free trial" + "View plans" CTAs
          on EXPIRED billing cards (both render).
        - BACKEND DATA: /billing/plans?industry=transport returns plans:[]
          (backend seed gap — main agent can't fix; coordinate w/ SafeBase
          team).
        - LOW: tabBarTestID doesn't propagate to web tab buttons (cosmetic
          for automation).

  - agent: "main"
    message: |
      Iteration 14 — user requested 5 things:
        1. Trial banner covers back button → fix
        2. Banner colour should match industry, not universal blue
        3. Tapping banner / opening /billing should show only THAT
           industry's plans
        4. Add the web app's /plan-rightsizer tool to mobile
        5. Industry-specific resources only — trades user sees only
           trades resources

      Files shipped:
        - src/components/TrialBanner.tsx — rewritten: no longer
          position:absolute. Background uses INDUSTRY_ACCENT[industry];
          urgent (≤3 days) overrides to destructive red. Foreground
          colour picked by luminance for legibility. Deep-links to
          /billing?industry=<trial-industry>.
        - app/_layout.tsx — Stack now wrapped in a flex column with the
          TrialBanner as a sibling above it. The banner therefore takes
          its natural height in the layout tree and CANNOT overlap any
          screen chrome.
        - app/billing/index.tsx — single-industry rendering:
            • reads ?industry=X from query, falls back to user's primary
              industry, then to "trades"
            • renders ONE billing card (the focused industry) instead of
              all five
            • horizontal industry-switcher chip row at the top with
              TRIAL · ND badges and ACTIVE badges
            • new "Not sure which plan?" helper row at the bottom that
              opens /plan-rightsizer
        - app/plan-rightsizer/index.tsx — NEW 3-question client-side
          wizard mirroring the web tool:
            Step 1 — industry (5 tap-tiles; pre-selected from query/user)
            Step 2 — team size (numeric input + buckets 1/5/15/50+)
            Step 3 — locations (numeric input + buckets 1/2/5/10+)
            Result — recommendation card pulled from
            /billing/plans?industry=X. Picks the smallest annual tier
            whose worker_cap ≥ team size; multi-location workspaces are
            bumped one tier. Result card shows annual price + monthly
            twin + worker cap + a "Continue to upgrade" CTA that lands
            on /billing?industry=<industry>.
        - src/data/resourcesByIndustry.ts — curated per-industry resource
          catalogue (trades 7, hospitality 7, transport 7, healthcare 7,
          retail 6). Each entry has kind: template/guide/regulator/
          register, an internal route or external URL.
        - app/resources/index.tsx — NEW screen that renders ONLY the
          signed-in user's industry resources. Kind-badge pill in
          appropriate colour (template=authority, guide=success,
          regulator=destructive, register=warning). External entries
          open via Linking.openURL.
        - app/(tabs)/settings.tsx — Plan section now exposes the two new
          rows: "Find your right plan" → /plan-rightsizer; "Industry
          resources" → /resources.

      Live verification on http://localhost:3000 as trades.demo:
        • Banner position: relative, height 37px, bg #FFA630 (trades
          amber — was universal authority blue before)
        • Banner CTA → /billing?industry=trades; exactly 1 card rendered;
          switching to Healthcare via chip → 1 card billing-card-
          healthcare; no other industry cards leak.
        • /plan-rightsizer?industry=healthcare loads; team size step
          renders with buckets 1/5/15/50+; flow reaches recommendation
          step and pulls plans from backend.
        • /resources renders exactly 7 trades resources for trades.demo
          with "TRADES & CONSTRUCTION" eyebrow and trades amber.

      Files shipped:
        - src/data/rolesByIndustry.ts — canonical ROLES_BY_INDUSTRY const
          (trades 12, hospitality 12, transport 11, healthcare 13,
          retail 11), with TypeScript types + getRolesFor helper +
          landingRouteForVariant helper.
        - app/register.tsx — fully rewritten as 3-step wizard
          (StepIndustry / StepRole / StepAccount). Persists wizard
          state to AsyncStorage under "safebase.register.wizard" so
          a backgrounded app resumes mid-flow. Clears stale roleId
          when industry changes.
        - src/context/AuthContext.tsx — RegisterInput extended with
          role_id / role_label / role_variant / permission_role /
          marketing_opt_in. SafeBaseUser interface extended with
          role_variant + role_title.
        - app/(tabs)/_layout.tsx — Modules tab now gated on
          role_variant === "worker" (not role) because backend always
          sets the registering user's `role` to "owner" (they own the
          workspace) regardless of variant.

      Backend probe confirmed:
        POST /api/auth/register with full payload {role_id, role_label,
        role_variant, permission_role, marketing_opt_in} returns 200 +
        {token, user}. user.role is always "owner" (workspace owner);
        user.role_variant carries the actual variant ("worker" / etc.)

      Acceptance criteria — verified via Playwright on web preview:
        ✅ Trades → 12 roles (testIDs match spec)
        ✅ Hospitality → 12 roles
        ✅ Transport → 11 roles
        ✅ Healthcare → 13 roles
        ✅ Retail → 11 roles
        ✅ Going back + changing industry rebuilds the role list
           (no stale roleId across industry changes)
        ✅ Submit fires POST /api/auth/register with all spec fields
           (verified by intercepting fetch in the page)
        ✅ Worker variant → worker dashboard. After registering an
           Electrician, tabs render as Home/Capture/Settings only —
           Modules tab is hidden. Home page shows WORKER eyebrow,
           "My Credentials", "Recent Check-ins", simplified Capture.
        ✅ Continue button disabled until valid selection on every step
        ✅ "Back to industry" link on Step 2
        ✅ "STEP 2 OF 3 · YOUR ROLE" indicator on Step 2

      Bonus:
        - Trial banner fires on the worker's post-signup landing
          ("14 days left in your Trades & Construction free trial"),
          per the trial auto-activation backend behaviour.

      Root cause was twofold:
        1. Race condition — during the brief window between auth-success
           and the first /billing/my-subscriptions response, useBilling()
           returns ready=false and anyTrialActive=false. The Modules /
           Capture tabs interpreted that as "no trial" and rendered
           LockedTile pills with "UPGRADE TO UNLOCK". The pills then
           disappeared once subs loaded, but the flash was visible.
        2. Billing dashboard EXPIRED cards always rendered "Upgrade to
           unlock" CTA, even when other industries were mid-trial. For
           trades.demo this fired on the Hospitality card (status:
           "canceling" with ends_at in the past → kind="expired").

      Fix:
        - app/(tabs)/modules.tsx — new local `unlockAll = anyTrialActive
          || !ready`. Pass to every Section as `trial`. Bottom locked-
          extras section now gated on `ready && !anyTrialActive`.
        - app/(tabs)/capture.tsx — same `unlockAll` derived flag.
          availableIndustries / lockedIndustries pivot on it.
        - app/billing/index.tsx — added `anyTrialActive` from useBilling.
          CTA label now: `st.kind === "expired" && !anyTrialActive
          ? "Upgrade to unlock" : "View plans & upgrade"`. While ANY trial
          is active anywhere, EVERY billing card uses "View plans &
          upgrade" copy.
        - src/utils/storage/index.ts (native) — secureSet now guards
          undefined values to silence the iOS "Values must be strings"
          SecureStore warning that fired during transient logout flows.

      Audit results post-fix on http://localhost:3000 as trades.demo
      (trades 12d trial, transport 14d trial, retail 14d trial,
      hospitality expired/canceling, healthcare none):
        - Home tab: 0 "UPGRADE TO UNLOCK" / 0 "Upgrade to unlock"
        - Modules tab: 0 / 0
        - Capture tab: 0 / 0
        - Settings tab: 0 / 0
        - /billing: 0 / 0 (4 "View plans & upgrade", 1 "Start free trial"
          for Healthcare — the legit never-tried opt-in CTA).
      Result: the upgrade-locking framing is invisible anywhere while a
      free trial is active, as the spec demands.

      Fix applied (3-layer):
        1. src/context/BillingContext.tsx — isUnlocked(industry) now
           returns true for ALL industries when anyTrialActive is true
           (was per-industry only). statusFor() preserved.
        2. app/(tabs)/modules.tsx — passes trial={anyTrialActive} into
           every Section. Section component renders locked:true tiles as
           regular TouchableOpacity (no LockedTile) when trial===true.
        3. app/(tabs)/capture.tsx — needs no code change; lockedIndustries
           filter naturally yields [] when isUnlocked returns true for all.

      Verified post-fix on http://localhost:3000 as trades.demo (has 3
      active trials: trades 12d, transport 14d, retail 14d):
        - Modules tab UPGRADE TO UNLOCK pill count: 0 (was 34)
        - Modules tab START FREE TRIAL pill count: 0 (was 1)
        - Capture tab UPGRADE TO UNLOCK pill count: 0 (was 35)
        - Capture tab START FREE TRIAL pill count: 0 (was 2)
        - Trial banner still renders: "12 days left in your Trades &
          Construction free trial · Tap to upgrade"
        - All 5 industry sections render with fully tappable tiles
        - Settings plan summary: 3/5 Unlocked / 3 In trial / 0 Paid

      Note: A previous testing_agent (iter 11 first pass) misdiagnosed an
      "auth token not propagating" bug. Verified manually that auth IS
      working — localStorage has safebase.jwt + safebase.user, billing API
      call captured Authorization: Bearer header, Settings tab correctly
      shows 3 in-trial industries. The earlier confusion was a stale Metro
      bundle (CI mode disables auto-reload) — fixed by a full expo restart.

      NEW MODULES:
        - src/api/billing.ts — typed wrappers for /billing/plans,
          /billing/my-subscriptions, /billing/start-trial,
          /billing/checkout-industry, /billing/change, /billing/cancel,
          /auth/permissions. Confirmed live shapes (see test_result.md).
        - src/context/BillingContext.tsx — provider fetches subscriptions +
          permissions after auth. Exposes statusFor(industry),
          isUnlocked(industry), earliestExpiringTrial, startTrial(),
          cancel(), change(), refresh().
        - src/components/TrialBanner.tsx — sticky top bar that shows
          "N days left in your {industry} trial · Tap to upgrade" when at
          least one trial is active. Hidden on pre-auth / billing.
        - app/billing/index.tsx — full billing dashboard listing all 5
          industries with their per-industry status, start-trial button,
          plans sheet (monthly/annual toggle), upgrade → Stripe Checkout
          via expo-web-browser, cancel button.

      MODIFIED:
        - app/_layout.tsx — wraps app in <BillingProvider/> and mounts
          <TrialBanner/> globally.
        - app/(tabs)/_layout.tsx — replaced "Profile" tab with "Settings"
          tab (per user B2: 4 tabs total). Profile route still mounted
          (href:null) so deeplinks survive.
        - app/(tabs)/settings.tsx — NEW: 4th-tab landing with sections
          (Account: Profile/Business/Team/Onboarding, Plan: Billing/
          Notifications), plan summary card, sign-out CTA.
        - app/(tabs)/capture.tsx — uses BillingContext.isUnlocked. Primary
          industry's tiles always render; unlocked extras (paid or trial)
          render inline with a TRIAL · ND LEFT pill; locked industries
          show LockedTile variant="trial" linking to /billing.
        - app/(tabs)/modules.tsx — same gating. Settings section removed
          (now its own tab). Unlocked extra industries render their full
          modules inline.
        - src/components/LockedTile.tsx — new "trial" variant (authority
          blue, "START FREE TRIAL" pill) vs "upgrade" (warning yellow).
          Default href is now /billing instead of /module/addons.
        - src/context/AccessibilityContext.tsx — now ACTUALLY applies
          prefs: Text/TextInput defaultProps (fontFamily, scale), and on
          web injects a global <style> tag for fontScale, highContrast,
          dyslexiaFont, emphasizeLinks, reduceMotion.

frontend_phase1k_billing_and_a11y:
  - task: "BillingProvider integration (subscriptions + permissions)"
    file: "src/context/BillingContext.tsx, src/api/billing.ts"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "TrialBanner sticky countdown across screens"
    file: "src/components/TrialBanner.tsx, app/_layout.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Billing dashboard with start-trial / upgrade / cancel / plans sheet"
    file: "app/billing/index.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Capture tab uses BillingContext (primary always; trials inline; LockedTile trial variant for un-subscribed)"
    file: "app/(tabs)/capture.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Modules tab uses BillingContext; Settings section removed"
    file: "app/(tabs)/modules.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Settings tab replaces Profile tab (4-tab layout)"
    file: "app/(tabs)/_layout.tsx, app/(tabs)/settings.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "LockedTile trial variant"
    file: "src/components/LockedTile.tsx"
    implemented: true
    working: "NA"
    priority: "medium"
    needs_retesting: true
  - task: "Accessibility widget actually applies prefs (Text defaults + web CSS)"
    file: "src/context/AccessibilityContext.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
        - /addons/api-keys mounts; ChipGroup populated; no crash.
        - /library/documents → "Document library", /library/policies →
          "Policy library", /library/forms → "Form library".
        - /safety/swms → friendly 'Available on web' Card; /safety/
          inspections still mounts IndustryListShell.
        - /addons/tradecheck subtitle no longer says "undefined".
        - trades.demo opening /hospitality/temperature-logs surfaces
          "You don't have access to this feature on this account."
        - Capture tab shows 'Other industries' with 4 LockedTile cards
          for both trades.demo and hospitality.demo.
        - /settings/onboarding mounts; api.put exposed.
      Regression sweep green. Hospitality.demo login that flaked in
      iter 8 succeeded cleanly this run. retest_needed: false.

      Mocked (carry-over, NA on web): expo-notifications push token web
      stub, native SQLite offline queue web stub.

  - agent: "main"
    message: |
      PHASE 1D (canonical per-industry screens) delivered + home
      redesign per user spec.

      DESIGN CHANGE
        - app/(tabs)/index.tsx — Removed the SAFEBASE wordmark / ink
          headerBar. The logged-in surface is now industry-led: slim
          neutral header bar holding only the IndustrySwitcher + a
          notifications bell with unread badge.

      CANONICAL INDUSTRY SCREENS (4 net-new, full create-entry parity
      with the web; PERMISSIONS = backend-enforced, mobile surfaces
      friendly 403 message so users see exactly what their web account
      sees):

        1. /app/hospitality/temperature-logs.tsx — TemperatureLog list +
           stats + create form. Equipment + 8 equipment types (fridge /
           coolroom / cold_display / freezer / bain_marie / hot_display /
           hot_holding / dishwasher), temp °C input, taken-by, corrective
           action (mandatory on FSANZ Std 3.2.2 breach). Local preview of
           the cold ≤5 / frozen ≤-15 / hot ≥60 rule then server-authoritative
           on save.
        2. /app/transport/pretrip.tsx — Pre-trip inspection list + create.
           NHVR-canonical 19-item checklist across 6 groups (Tyres / Lights /
           Brakes / Load restraint / Fluids / Cabin & safety; Cabin = 4 items
           seatbelt/mirrors/horn/extinguisher). Defaults every item to PASS
           so the driver only taps defects. Computes defects + fit_to_drive
           locally and on submit; server is authoritative.
        3. /app/healthcare/ahpra.tsx — AHPRA register list + create + Iter57
           inline remind action (POST /api/healthcare/ahpra-register/{reg_id}/remind).
           Profession chips (10 disciplines), registration type chips (5),
           issued + expires dates, status pills (ACTIVE / EXPIRING / EXPIRED)
           computed from the backend _days_to_expiry helper.
        4. /app/retail/lone-worker.tsx — Active lone-worker shifts +
           check-in form + Iter57 acknowledge action (POST /api/retail/lone-worker/{checkin_id}/acknowledge)
           + escalate fallback. Wellbeing chips (OK / unwell / distressed),
           interval chips (30 / 60 / 120 / 180 min). Overdue + escalation
           tints render directly from backend _overdue / _should_escalate
           flags.

      Supporting:
        - /src/api/industry.ts — typed wrappers for HospitalityApi /
          TransportApi / HealthcareApi / RetailApi (with Iter57 actions
          pauseDriver, remindAhpra, acknowledge, escalate).
        - app/(tabs)/modules.tsx routeFor() — hospitality/temperature,
          transport/pretrip, healthcare/ahpra, retail/lone-worker tiles
          all jump to their native screens.

      PERMISSIONS PARITY VERIFIED
        Trades demo opening the 4 industry screens shows a clean 403
        message rendered inside a Card (not a crash). Backend gates each
        endpoint via require_feature. Users see exactly what their web
        permissions allow.

frontend_phase1d:
  - task: "Home — remove SAFEBASE wordmark; slim industry header"
    file: "app/(tabs)/index.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Hospitality Temperature Logs (list + stats + create)"
    file: "app/hospitality/temperature-logs.tsx, src/api/industry.ts"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Transport Pre-trip inspection (18-item checklist + create)"
    file: "app/transport/pretrip.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Healthcare AHPRA register (list + create + Iter57 remind)"
    file: "app/healthcare/ahpra.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
  - task: "Retail Lone-worker shifts (active list + check-in + Iter57 acknowledge + escalate)"
    file: "app/retail/lone-worker.tsx"
    implemented: true
    working: "NA"
    priority: "high"
    needs_retesting: true
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