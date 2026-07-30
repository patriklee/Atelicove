# Iconoir migration audit

Audit date: 2026-07-29

Scope: `atelicovefrontend` only. Final frontend-wide verification completed on 2026-07-29.

## Summary

- **Migration status: complete.** Iconoir is the standard UI icon system throughout frontend source.
- `iconoir-react` is installed at `7.11.1` (`package.json` requests `^7.11.1`).
- The unused `@mui/icons-material` dependency was removed from `package.json` and `package-lock.json` after a full frontend search confirmed there were no imports.
- No Font Awesome, Lucide, Heroicons, React Icons, inline SVG components, CSS-generated icons, or emoji UI icons were found.
- No unused direct icon imports were found.
- There are **no remaining direct non-Iconoir icon imports** in frontend source.
- There are **no remaining non-Iconoir UI glyph locations**. The **2 browser-native picker indicators** are intentionally retained.
- Shared Iconoir usage is centralized in `src/shared/icons` and is consumed by global navigation, authentication, shared alerts, reusable forms, shared archive/document components, and shared back navigation.

## 1. Icon systems in use

| System | Status | Where |
| --- | --- | --- |
| `iconoir-react` 7.11.1 | Installed and in use | `src/shared/icons/iconMap.js`, consumed through `src/shared/icons` |
| `@mui/icons-material` | Removed | No source, mock, configuration, or test imports remain |
| MUI component default glyphs | Replaced in icon-bearing controls | Shared adapters provide Iconoir icons for alerts, selects, sort labels, and icon buttons |
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
- Workers pages use `AppAlert` and `AppSelect`; Companies pages use `AppAlert` and `AppTableSortLabel`.
- Documents use `AppAlert` and `AppSelect`; all Archive routes use the shared Iconoir-ready `ArchiveTable`.
- Settings uses `AppAlert`; authentication uses `AppIconButton` for password visibility and otherwise contains no icon controls.
- Reusable company, project, worker, work-order, and document forms use `AppSelect`.
- `src/shared/components/navigation/BackNavigation.js` uses `AppIcon` with semantic `back`.

## 3. Direct non-Iconoir icon migration

All 40 exports imported by the semantic map were verified against the installed `iconoir-react` runtime; no invalid exports remain.

Direct source migration is complete. `AdminDashboard.js` now uses the shared semantic map for projects, work orders, companies, workers, search, warnings, add-worker actions, disclosure arrows, calendar navigation, and deadline status. Theme-token color inheritance is applied through MUI containers around `AppIcon`.

`@mui/icons-material` was the only old icon dependency present. Font Awesome, Lucide, Heroicons, React Icons, and other custom icon libraries were not installed or referenced, so no other packages required removal.

## 4. MUI-generated non-Iconoir glyphs

MUI controls previously rendered implicit Material SVG glyphs. Shared Iconoir adapters now supply the relevant icon slots while preserving MUI behavior.

### Alert severity icons — migration complete

Suggested mapping: success → `CheckCircle`, info → `InfoCircle`, warning → `WarningTriangle`, error → `WarningCircle`.

All frontend alerts now use the established `AppAlert` adapter.

### Select dropdown indicators — migration complete

Worker management and all reusable forms now use `AppSelect` with the verified Iconoir `NavArrowDown` indicator.

### Table sort indicators — migration complete

Work Orders and Companies now use `AppTableSortLabel`, which preserves MUI's active direction and inactive hover/focus behavior while supplying the verified Iconoir `SortDown` export.

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

No custom in-page utility icons remain. The PNG files are the default React logo and are retained only as raster/multi-size product-identity assets; they should eventually be replaced by an Atelicove favicon/PWA icon set. Iconoir is not an appropriate substitute for product branding.

## 7. Shared conventions and future contributor guidance

1. Add verified Iconoir exports only to `src/shared/icons/iconMap.js`; feature code should import the semantic `icons` map and shared adapters from `src/shared/icons`.
2. Use `AppIcon` defaults for `currentColor`, a `1.7` stroke width, and the shared `compact` (17px), `standard` (19px), and `large` (36px) sizes. Use a custom size only when the existing visual context materially requires it.
3. Use `AppIconButton` for icon-only actions. Its accessible `label` is required; keep tooltips unless the surrounding control already provides sufficient visible context.
4. Keep decorative icons hidden from assistive technology. Provide an `AppIcon` label only when the icon itself carries standalone meaning.
5. Use `AppAlert`, `AppSelect`, and `AppTableSortLabel` instead of raw MUI controls that would restore Material glyphs.
6. Preserve theme-driven `currentColor` behavior for active, hover, focus, disabled, warning, error, success, and information states.
7. Configure common autocomplete popup/clear icons through the shared semantic map.
8. Keep dashboard icon selection in its existing data/config patterns (`OperationsOverview`, `QuickActions`, and `SectionHeading`) rather than scattering repeated JSX.
9. Keep product branding as purpose-built raster/vector artwork rather than substituting a generic Iconoir glyph.

There are no duplicated local icon wrapper components to delete.

## 8. High-risk migration areas

- **Shared back navigation:** one component change affects company, project, worker, and work-order detail pages. Preserve `navigate(-1)`, direct-load fallback replacement, button text, and `aria-label`.
- **Password visibility:** migrated through `AppIconButton`; targeted coverage verifies the input type and dynamic accessible label.
- **Dashboard calendar controls:** migrated with preserved previous/next handlers and accessible names; native date/month input behavior remains unchanged.
- **Dashboard styling:** migrated through shared `currentColor` behavior and existing MUI theme tokens.
- **MUI component slots:** select, sort, alert, autocomplete, and chip icons participate in control state and hit targets. Replace via supported component props/theme defaults, not by overlaying decorative SVGs.
- **Dynamic alert severity:** several alerts use runtime severity. The icon map must cover all four MUI severities.
- **Product icons:** favicon and PWA assets require brand artwork and multiple raster sizes; a generic Iconoir glyph would weaken product identity.

## 9. Post-migration follow-ups

1. Keep new icon-bearing controls on the established shared adapters and semantic map.
2. Handle favicon/PWA brand assets as a separate branding task.
3. Keep native date/month indicators unless a picker redesign is explicitly approved.
4. Include focused accessibility coverage whenever a new icon-only action is introduced.

## Ambiguous mappings and blockers

- Dashboard ambiguities were resolved consistently with the sidebar: work orders use `ClipboardCheck`, worker totals use `Group`, and company creation uses `Building` with its visible action label.
- No technical blockers or unresolved UI-icon mappings remain.

## 10. Final verification

- All 122 files under `src` were included in the final search.
- `src/shared/icons/iconMap.js` is the only source file that imports `iconoir-react` directly.
- Raw MUI `Alert`, `IconButton`, `Select`, and `TableSortLabel` icon-bearing controls appear only inside their shared Iconoir adapters.
- All 40 Iconoir exports used by the semantic map exist in the installed runtime.
- No legacy icon-library imports, inline utility SVGs, CSS-generated icons, emoji controls, Unicode navigation controls, text chevrons, or raw replacement characters remain.
- Every icon-only application control uses `AppIconButton` with an accessible label. Decorative icons inherit `aria-hidden`, `focusable="false"`, `currentColor`, and the shared stroke width.
- The remaining exceptions are the two browser-native date/month picker indicators and the public favicon/PWA raster assets described above.
