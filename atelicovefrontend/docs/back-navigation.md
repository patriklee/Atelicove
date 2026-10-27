# Back navigation

The frontend uses React Router 7's BrowserRouter and MUI. BackNavigation retains the existing Button, back icon and theme, with an explicit keyboard focus outline. AdminHomePage and WorkerHomePage render it above their routed content in the shared PageContainer. Page-specific Back controls were removed; breadcrumbs, tabs and other intentional controls remain unchanged.

BackNavigationProvider sits immediately below BrowserRouter. It annotates the current browser history entry with a small safety marker when a router PUSH comes from the same application area (admin or worker). REPLACE carries forward the existing entry's safety when appropriate. POP leaves entry metadata alone. The router owns the history stack and user state; there is no duplicate stack, storage service or dependency. The one-entry ref is only used to classify transitions.

The button calls navigate(-1) only when the router index and safety marker agree. Direct visits, unknown history (including entries created before this feature), invalid markers, login redirects and cross-role transitions use a role-specific fallback with replace: /admin or /worker/my-assignments. Metadata survives refresh. A refresh after a direct visit still uses the fallback. Browser Back/Forward remain native. The optional fallback prop accepts only application-local paths in the current role area; shell integration uses the default landing pages.

## Coverage and exclusions

All nested admin and worker pages receive one shell-level Back control, including lists, details, management, archives, billing, settings and Project Studio. The admin Dashboard (/admin, including trailing slash) and worker landing page (/worker and /worker/my-assignments) are excluded. Login, unauthorized, root redirects and catch-all redirects are outside the shells or resolve to landing pages and do not gain a control. In-page loading and data errors retain the shell control so the user can leave the current application page.

Documents has only a list/download route; there is no Document Details route to test. Existing details for workers, companies, projects and work orders now use the shell control, including MyWorkOrderDetail's admin rendering of WorkOrderDetail.

## State and safeguards

History traversal restores the exact prior pathname, query string, hash and router location state. URL-based filters, pagination, sorting, tabs and selections therefore survive. Data held only in a page's React state still resets on unmount, as it does with browser Back today (for example Companies sorting). No global state system or form draft persistence was added. No route-leaving unsaved-changes safeguard was found. Back is an explicit user action using the existing router; it does not auto-navigate, bypass form confirmation dialogs or add new redirects during editing. Unsaved local form values can be lost when users choose to leave a page, as with existing sidebar/browser navigation.

## Focused validation

- BackNavigation.test.js: 9 passing tests using the real BrowserRouter/history API (the test imports its re-exported implementation from react-router for compatibility with CRA's older Jest resolver). Covers Dashboard -> Workers -> Worker Details -> Back; Companies -> Company Details -> Back; list-to-list navigation involving Documents; query/hash and selected record state; native Back/Forward; direct entry; unknown/invalid history; refresh-style router remount; login replace; safe application replace; worker fallback.
- BackNavigationShell.test.js: 11 passing placement cases, including both landing pages, trailing slash Dashboard, workers, company details, Documents, settings, assignments and worker project editing.
- PageLayout.test.js: 2 passing shared layout tests.
- Focused ESLint and git diff --check pass. Tests simulate routing and shell placement; no interactive browser or live API end-to-end verification was performed.

## Files

Modified:
- src/app/AppRoutes.js
- src/shared/components/navigation/BackNavigation.js
- src/shared/components/navigation/BackNavigation.test.js
- src/features/admin/AdminHomePage.js
- src/features/workers/WorkerHomePage.js
- src/features/companies/CompanySummary.js
- src/features/companies/ManageCompanies.js
- src/features/workers/WorkerSummary.js
- src/features/workers/ManageWorkers.js
- src/features/projects/ProjectSummary.js
- src/features/workOrders/WorkOrderDetail.js
- src/features/workOrders/MyWorkOrderDetail.js

Created:
- src/features/admin/BackNavigationShell.test.js
- docs/back-navigation.md
