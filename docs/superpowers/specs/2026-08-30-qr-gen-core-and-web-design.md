# QR Generator — Core Library & Web App Design

Date: 2026-08-30
Status: Approved (pending user review of this doc)

## Vision

An open-source, qr.io-style QR code generator. Key differentiator: the
business logic (content encoding + styled QR rendering) lives in a
standalone, framework-agnostic TypeScript package that anyone can copy
directly into their own backend (NestJS, Express, or anywhere else that
runs Node/TS), not just consume through our hosted app.

## Scope for this spec

- Static QR codes only (no dynamic/redirect QR, no scan analytics, no
  database, no server-side accounts or storage). Dynamic QR is a
  clearly separate future add-on if ever pursued.
- Content types: URL/plain text, WiFi credentials, vCard/contact,
  email/SMS/tel action links.
- Styling: custom colors, dot/eye shape presets, center logo overlay,
  frame/CTA text, and a "subtle blend" artistic mode where an uploaded
  image is blended faintly behind/around the QR modules without
  compromising scan reliability.
- Export formats: SVG and PNG.
- License: MIT.
- Git workflow: `dev` is the default/integration branch, `release` is
  the deploy branch. No `main`/`master`.

## Repo structure

pnpm workspace monorepo:

```
qr-gen/
  packages/
    core/        # @qr-gen/core — portable, framework-agnostic engine
    web/         # Next.js app consuming @qr-gen/core
  LICENSE (MIT)
  README.md
```

`core` has no dependency on React/Next or any server framework, so it
can be copied wholesale into another codebase. `core` is deliberately
unaware that `web` exists.

## `@qr-gen/core` design

Public API surface is intentionally small — this is the piece someone
copies into their own backend:

```ts
generateQR(content: QRContent, style: StyleOptions): {
  svg: string
  toPng(): Promise<Uint8Array>
}
```

Internally, four independently testable units:

1. **Content encoders** — pure functions mapping a typed `QRContent`
   input (`url`, `wifi`, `vcard`, `email`/`sms`/`tel`) to the exact
   payload string to encode (e.g. correctly escaped
   `WIFI:S:...;T:...;P:...;;`). No QR-specific logic here.
2. **QR matrix generation** — wraps an existing, well-tested QR
   encoding library (e.g. `qrcode-generator`, MIT-licensed) to turn a
   payload string + error-correction level into the raw module matrix.
   Reed-Solomon encoding is not reimplemented.
3. **Renderer** — takes the matrix + `StyleOptions` (colors, dot/eye
   shape, logo image, frame/CTA text, optional background-image blend)
   and produces an SVG string. SVG is the source of truth. PNG export
   rasterizes that SVG (server-side via `resvg`/`sharp`, client-side
   via canvas/native browser APIs).
4. **Style presets & validation** — safety guards so styling can't
   produce an unscannable code: if a logo or background image is
   present, error-correction level is forced to `H` and logo size is
   capped to a safe percentage of the code area.

### Artistic/image-blend mode

Targets "subtle blend": high error-correction (level H), the source
image shown faintly behind/around modules with modules still clearly
dominant. This favors scan reliability over strong halftone-style
artistic effect, matching how production tools like
`qr-code-styling` behave.

## `apps/web` design

Fully client-side single-page editor. No backend, no database, no
server-side storage — uploaded logos/images never leave the browser.
Statically deployable (e.g. Vercel static export or any static host).

Flow:

1. User selects a content type and fills a form → the corresponding
   encoder builds the payload.
2. Style panel: colors, dot/eye shape presets, optional logo upload,
   optional frame/CTA text, optional image upload for blend mode.
3. Live SVG preview re-renders (debounced) via the same `generateQR()`
   used anywhere else.
4. Download as SVG (direct) or PNG (rasterized client-side).

Framework: Next.js.

## Testing strategy

- `core`: unit tests per encoder (correct payload strings, escaping
  edge cases), snapshot tests for generated SVG across style
  combinations, and scannability round-trip tests (generate → decode
  with a QR reader library → assert decoded content matches input) for
  every preset — especially logo and image-blend modes, since those
  carry the most scan-reliability risk.
- `web`: component tests for editor forms, plus Playwright e2e flows
  (fill form → see preview → download) covering at least one case per
  content type.

## Out of scope (explicitly deferred)

- Dynamic/redirect QR codes and scan analytics (requires a database
  and redirect server — a materially different, less portable system).
- PDF export.
- Strong/halftone artistic QR mode (only the subtle-blend variant is
  in scope now).
- User accounts, saved QR history, team/collaboration features.
