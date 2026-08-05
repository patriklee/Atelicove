# Atelicove branding assets

`atelicove-mark-master.svg` is the canonical geometry source. Community and Cloud exports use the same `0 0 160 180` viewBox and identical path data; only fills and opacity values differ. Do not edit edition geometry directly.

## Choose an asset

- `community/atelicove-mark.svg`: Community sidebar, compact headers, and documentation badges.
- `community/atelicove-logo.svg`: Community login, landing page, README, and documentation lockups.
- `community/atelicove-splash-mark.svg`: Community startup animation only.
- `cloud/*`: the equivalent future Cloud Edition assets. Do not mix editions in one product surface.
- `public/favicon.svg`: simplified Community browser mark.
- `public/favicon-16x16.png` and `public/favicon-32x32.png`: raster favicon fallbacks.
- `public/apple-touch-icon.png`: 180 px mobile shortcut icon.
- `public/app-icon-192.png` and `public/app-icon-512.png`: installable-app icons referenced by the web manifest.

The edition statements “Earth-Held. Self-Hosted.” and “Always Connected.” are supporting copy, not part of the primary logo lockup.

## Palette

Community uses the existing canonical theme tokens: Ivory `#F9F8F7`, Almond `#EDEAE4`, Mist `#ADB8BB`, Sage `#6F8F72`, Moss `#77997E`, Navy `#153147`, and Noir `#232A2F`. Cloud keeps the neutral supporting petals and uses restrained blue accents (`#416F8F`, `#274F6B`, and `#8FA7B4`).

The lockup requests the application's existing Plus Jakarta Sans font with system fallbacks. It does not embed a font.

## Usage rules

- Keep clear space around the mark equal to at least one quarter of its rendered width.
- Use the standalone mark at 24 px or larger; use the full lockup at 240 px or larger.
- Do not stretch, rotate, recolor, outline, add shadows, or change the petal geometry.
- Prefer ivory or white backgrounds and preserve the transparent background of the SVG assets.
- Decorative instances may set `aria-hidden="true"`; meaningful instances need an accessible name from their surrounding markup.

The splash assets expose `atelicove-mark`, `petal-center`, `petal-upper-left`, `petal-upper-right`, `petal-lower-left`, and `petal-lower-right`. Every petal group uses the shared lower-center growth point (`80px 158px`) as its transform origin. Timing and animation belong in the consuming CSS or React component.

The favicon PNGs were rendered from `public/favicon.svg`. Apple and PWA icons were rendered from `community/atelicove-mark.svg` onto an Ivory square canvas with safe padding. Exports use exact target pixel dimensions and lossless PNG output. No project dependency or asset-generation script is required; regenerate them with any production SVG renderer while preserving those source files, dimensions, backgrounds, and padding.
