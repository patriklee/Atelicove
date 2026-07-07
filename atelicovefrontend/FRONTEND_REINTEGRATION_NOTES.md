# Atelicove frontend reintegration

This src rebuild preserves the new folder structure while restoring real feature code from `src2/Components`.

## What changed
- Restored full original feature components into `src/Components`.
- Kept route-level feature folders under `src/features/*` as wrappers that export the real components.
- Added `src/index.js` for Create React App.
- Added a shared API client with `apiFetch` and `apiDownload`.
- Added model helpers used by the original components.
- Pointed Draft Studio and Project Studio to the original ProjectsPage so those project features are available again while you continue the refactor.

## How to use
Replace your current `atelicovefrontend/src` folder with this `src` folder, then run:

```bash
npm run start:mock
```

If a new error appears, it should now be a real feature integration issue rather than missing placeholder/component files.
