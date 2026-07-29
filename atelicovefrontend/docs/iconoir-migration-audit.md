# Iconoir migration audit

Audit date: 2026-07-29

Scope: `atelicovefrontend` only. The inventory is maintained as each frontend feature migration is completed.

## Summary

- `iconoir-react` is already installed at `7.11.1` (`package.json` requests `^7.11.1`).
- `@mui/icons-material` is also installed at `6.4.8` and is the only directly imported non-Iconoir icon library.
- No Font Awesome, Lucide, Heroicons, React Icons, inline SVG components, CSS-generated icons, or emoji UI icons were found.
- No unused direct icon imports were found.
- There are **no remaining direct non-Iconoir icon imports** in frontend source.
- There are approximately **15 remaining page-specific MUI-generated glyph locations**, plus **2 intentionally retained browser-native picker indicators**, for approximately **17 remaining review locations total**.
- Shared Iconoir usage is centralized in `src/shared/icons` and is consumed by global navigation, authentication, shared alerts, reusable forms, shared archive/document components, and shared back navigation.

## 1. Icon systems in use

| System | Status | Where |
| --- | --- | --- |
| `iconoir-react` 7.11.1 | Installed and in use | `src/shared/icons/iconMap.js`, consumed through `src/shared/icons` |
| `@mui/icons-material` 6.4.8 | Installed but no longer imported by frontend source | Dependency removal can be considered after all feature passes |
| MUI component default glyphs | In use indirectly through `@mui/material` | Remaining page-specific alerts, one select, and sort labels listed below |
| Browser-native form indicators | In use | Date and month inputs in `AdminDashboard.js` |
| Raster/PWA icons | In use outside page UI | `public/favicon.ico`, `public/logo192.png`, `public/logo512.png` |

The public raster assets and manifest metadata are still the Create React App defaults (`"React App"` / `"Create React App Sample"`). They are product identity assets, not suitable for replacement with a generic Iconoir UI glyph. Replace them later with custom Atelicove brand artwork.

## 2. Shared Iconoir foundation and existing usage

The shared foundation now contains:

- `src/shared/icons/AppIcon.js`: contextual size defaults, inherited `currentColor`, stroke width, class/style forwarding, decorative `aria-hidden`, and labeled standalone-icon support.
- `src/shared/icons/AppIconButton.js`: MUI `IconButton` integration with a required accessible label convention, tooltip support, focus styling, and disabled-tooltip handling.
- `src/shared/icons/AppAlert.js`: centralized Iconoir severity mapping for reusable MUI alerts.
- `src/shared/icons/AppSelect.js`: MUI-compatible Iconoir dropdown indicator with preserved select behavior and styling hooks.
- `src/shared/icons/AppTableSortLabel.js`: MUI-compatible Iconoir sort indicator with preserved active state, direction rotation, focus behavior, and click handling.
- `src/shared/icons/iconMap.js`: verified semantic Iconoir mappings.
- `src/shared/icons/index.js`: public exports.

### Representative consumers

- `src/features/admin/AdminSidebar.js` uses `AppIcon` and semantic mappings for its 20 configured navigation entries, disclosure chevron, brand mark, and logout action.
- `src/features/admin/AdminHomePage.js` uses `AppIconButton` for the responsive navigation trigger.
- `src/Components/LoginPage.js` uses `AppIconButton` for password visibility.
- `src/Components/ArchiveTable.js` and `src/features/documents/WorkOrderDocuments.js` use `AppAlert`.
- Projects pages and summary states use `AppAlert`; Project Studio and reusable project forms are free of non-Iconoir utility glyphs.
- Work Orders pages use `AppAlert` and `AppTableSortLabel`; reusable forms, assignment actions, archive views, and document controls use the shared Iconoir foundation.
- Reusable company, project, worker, work-order, and document forms use `AppSelect`.
- `src/shared/components/navigation/BackNavigation.js` uses `AppIcon` with semantic `back`.

## 3. Direct non-Iconoir icon migration

All proposed names in this document were verified in the installed `iconoir-react/dist/index.d.ts`.

Direct source migration is complete. `AdminDashboard.js` now uses the shared semantic map for projects, work orders, companies, workers, search, warnings, add-worker actions, disclosure arrows, calendar navigation, and deadline status. Theme-token color inheritance is applied through MUI containers around `AppIcon`.

## 4. MUI-generated non-Iconoir glyphs

These files do not import `@mui/icons-material` directly, but the MUI controls render their own Material SVG glyphs. A complete visual migration needs explicit Iconoir slots or centralized theme/component adapters.

### Remaining alert severity icons — 13 locations in 8 page-specific files

Suggested mapping: success → `CheckCircle`, info → `InfoCircle`, warning → `WarningTriangle`, error → `WarningCircle`.

| File | Locations |
| --- | ---: |
| `src/features/admin/Settings.js` | 2 |
| `src/features/companies/ActiveCompanies.js` | 1 |
| `src/features/companies/CompanySummary.js` | 2 |
| `src/features/companies/ManageCompanies.js` | 2 |
| `src/features/documents/Documents.js` | 1 |
| `src/features/workers/ActiveWorkers.js` | 1 |
| `src/features/workers/ManageWorkers.js` | 2 |
| `src/features/workers/WorkerSummary.js` | 2 |
Use the established `AppAlert` adapter when migrating these page-specific call sites.

### Remaining select dropdown indicator — 1 page-specific location

Suggested replacement: `NavArrowDown`.

`src/features/workers/ManageWorkers.js` contains the remaining direct MUI `Select`. Migrate it to the established `AppSelect` adapter during the worker-page pass.

### Table sort indicators — 1 location in 1 file

Suggested replacement: `SortUp` / `SortDown`, driven by the existing direction state.

| File | Locations |
| --- | ---: |
| `src/features/companies/ActiveCompanies.js` | 1 |
Work Orders now use `AppTableSortLabel`, which preserves MUI's active direction and inactive hover/focus behavior while supplying the verified Iconoir `SortDown` export.

### Autocomplete indicators — Dashboard migration complete

Both `AdminDashboard.js` autocomplete controls now use shared Iconoir `NavArrowDown` and `Xmark` glyphs while retaining MUI’s popup/clear button semantics, focus behavior, and disabled states.

### Deletable chip indicator — shared migration complete

`src/features/workOrders/components/WorkOrderAssignmentPanel.js` now provides Iconoir `Xmark` through `AppIcon` while preserving MUI Chip’s delete hit target and keyboard behavior.

## 5. Unicode, emoji, inline SVG, CSS, and local wrappers

- No Unicode arrows, emoji, or single-character UI substitutes (`>`, `<`, `v`, `^`, `+`, `×`, or symbol ellipses) were found as icon controls.
- Text ellipses occur only in loading/progress copy such as `Loading...`, `Creating...`, `Saving…`, and `Loading operational overview…`; these are prose/status text and should not be migrated to icons.
- The middle dot in project comment metadata is a text separator, not an icon.
- The em dash returned by `formatDateTime` for missing data is a table placeholder, not an icon.
- No inline `<svg>`, custom SVG React components, SVG/data URLs, image-backed in-page icons, CSS files, pseudo-elements, or `content:`-generated glyphs were found.
- No local `Icon`, `Glyph`, `Chevron`, or `Arrow` wrapper components were found.
- `BackNavigation` is the only shared icon-bearing navigation component and should remain shared.

## 6. Browser-native and image icons

### Browser-native picker indicators

`src/features/admin/dashboard/AdminDashboard.js` uses native `type="date"` and `type="month"` inputs. Their calendar/dropdown indicators are browser-provided, not Material or Iconoir icons.

Recommendation: keep these indicators native unless the project intentionally replaces the native picker interaction. Styling or suppressing them is browser-specific and can affect keyboard access, picker activation, localization, and mobile behavior.

### Public app icons

- `public/favicon.ico`
- `public/logo192.png`
- `public/logo512.png`
- References in `public/index.html` and `public/manifest.json`

The PNG files are the default React logo. These should remain custom raster/multi-size product assets and eventually be replaced by an Atelicove favicon/PWA icon set. Iconoir has no role as a generic substitute for product identity.

## 7. Repeated patterns to centralize

1. Use the new shared icon sizing/accessibility convention rather than adding local wrappers. Keep semantic labels and event handlers in their owning controls.
2. Use the centralized `AppAlert` severity-to-Iconoir mapping.
3. Use the centralized `AppSelect` dropdown icon behavior.
4. Centralize table sort direction icons rather than configuring all 11 headers independently.
5. Configure common autocomplete popup/clear icons once where practical.
6. Keep dashboard icon selection in its existing data/config patterns (`OperationsOverview`, `QuickActions`, and `SectionHeading`) rather than scattering repeated JSX.

There are no duplicated local icon wrapper components to delete.

## 8. High-risk migration areas

- **Shared back navigation:** one component change affects company, project, worker, and work-order detail pages. Preserve `navigate(-1)`, direct-load fallback replacement, button text, and `aria-label`.
- **Password visibility:** migrated through `AppIconButton`; targeted coverage verifies the input type and dynamic accessible label.
- **Dashboard calendar controls:** migrated with preserved previous/next handlers and accessible names; native date/month input behavior remains unchanged.
- **Dashboard styling:** migrated through shared `currentColor` behavior and existing MUI theme tokens.
- **MUI component slots:** select, sort, alert, autocomplete, and chip icons participate in control state and hit targets. Replace via supported component props/theme defaults, not by overlaying decorative SVGs.
- **Dynamic alert severity:** several alerts use runtime severity. The icon map must cover all four MUI severities.
- **Product icons:** favicon and PWA assets require brand artwork and multiple raster sizes; a generic Iconoir glyph would weaken product identity.

## 9. Recommended migration order

1. Extend the established shared Iconoir convention only when a repeated requirement appears; avoid parallel wrappers.
2. Continue top-down with Workers.
3. Continue with Companies, Documents, Archive, then Settings and Authentication.
4. Use `AppAlert` for remaining page-specific alerts and `AppSelect` for the worker-page select.
5. Use the established shared sort-label adapter for the remaining company sort control.
6. Run focused component tests for each migrated feature.
7. Handle favicon/PWA brand assets as a separate branding task. Keep native date/month indicators unless a picker redesign is explicitly approved.

## Ambiguous mappings and blockers

- Dashboard ambiguities were resolved consistently with the sidebar: work orders use `ClipboardCheck`, worker totals use `Group`, and company creation uses `Building` with its visible action label.
- No technical blocker prevents the migration. The main constraint is that this frontend currently has no centralized MUI theme override file, so implicit MUI glyph migration needs a deliberate shared adapter/theme location rather than scattered overrides.
