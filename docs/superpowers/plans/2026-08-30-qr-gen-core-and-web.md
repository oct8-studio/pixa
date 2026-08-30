# QR Generator — Core Library & Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@pixa/core` (a portable, framework-agnostic TS engine for generating styled, static QR codes) and a Next.js web app that consumes it.

**Architecture:** pnpm workspace monorepo with `packages/core` (zero framework deps — encoders → matrix generation via `qrcode` → SVG renderer with style validation → PNG rasterization via `sharp`) and `packages/web` (Next.js, fully client-side, no backend/storage).

**Tech Stack:** TypeScript, pnpm workspaces, `qrcode` (matrix generation), `sharp` (PNG rasterization), `vitest` (core unit/snapshot/scan-roundtrip tests), `jsqr` (decode-for-test only), Next.js + React, Playwright (e2e).

**Spec:** `docs/superpowers/specs/2026-08-30-qr-gen-core-and-web-design.md`

## Global Constraints

- License: MIT (root `LICENSE` file, `"license": "MIT"` in every `package.json`).
- Git: work happens on `dev`; no `main`/`master`. Commit after every task.
- `core` package must have zero dependency on React/Next/any server framework — it must be copy-pasteable into another backend as-is.
- Static QR only: no dynamic/redirect QR, no database, no server-side storage anywhere in this plan.
- If a logo or image-blend is present, error-correction level is forced to `H` (never left to the caller).
- Logo size ratio capped at 0.25 of code area; image-blend opacity capped at 0.25 — these are hard caps enforced in code, not just documented.

---

### Task 1: Monorepo scaffold

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json` (root)
- Create: `.gitignore`
- Create: `LICENSE`
- Create: `README.md`
- Create: `tsconfig.base.json`

**Interfaces:**
- Produces: a pnpm workspace with `packages/*` glob, root scripts `test`, `build`, `lint` that fan out via pnpm `-r`.

- [ ] **Step 1: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - 'packages/*'
```

- [ ] **Step 2: Create root `package.json`**

```json
{
  "name": "pixa",
  "private": true,
  "license": "MIT",
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint"
  },
  "packageManager": "pnpm@9.0.0"
}
```

- [ ] **Step 3: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "resolveJsonModule": true
  }
}
```

- [ ] **Step 4: Create `.gitignore`**

```
node_modules/
dist/
.next/
*.tsbuildinfo
```

- [ ] **Step 5: Create `LICENSE`**

```
MIT License

Copyright (c) 2026 pixa contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 6: Create `README.md`**

```markdown
# pixa

Open-source, customizable QR code generator. `packages/core` is a
framework-agnostic TypeScript engine you can copy directly into your own
backend. `packages/web` is a Next.js app built on top of it.

See `docs/superpowers/specs/2026-08-30-qr-gen-core-and-web-design.md` for the design.
```

- [ ] **Step 7: Install pnpm and verify workspace resolves**

Run: `pnpm --version` (install via `corepack enable` if missing), then `pnpm install`
Expected: no errors, `node_modules/.pnpm` created at root.

- [ ] **Step 8: Commit**

```bash
git add pnpm-workspace.yaml package.json tsconfig.base.json .gitignore LICENSE README.md
git commit -m "chore: scaffold pnpm monorepo"
```

---

### Task 2: Core package scaffold + url/text/wifi encoders

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/vitest.config.ts`
- Create: `packages/core/src/content/types.ts`
- Create: `packages/core/src/content/url.ts`
- Create: `packages/core/src/content/wifi.ts`
- Test: `packages/core/src/content/wifi.test.ts`

**Interfaces:**
- Produces: `QRContent` union type; `encodeUrlOrText(content) → string`; `encodeWifi(content) → string`.

- [ ] **Step 1: Create `packages/core/package.json`**

```json
{
  "name": "@pixa/core",
  "version": "0.1.0",
  "license": "MIT",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run"
  },
  "dependencies": {
    "qrcode": "^1.5.3",
    "sharp": "^0.33.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vitest": "^1.4.0",
    "jsqr": "^1.4.0",
    "@types/qrcode": "^1.5.5"
  }
}
```

- [ ] **Step 2: Create `packages/core/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/core/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node'
  }
})
```

- [ ] **Step 4: Create `packages/core/src/content/types.ts`**

```ts
export type QRContent =
  | { type: 'url'; value: string }
  | { type: 'text'; value: string }
  | { type: 'wifi'; ssid: string; password?: string; security?: 'WPA' | 'WEP' | 'nopass'; hidden?: boolean }
  | { type: 'vcard'; firstName: string; lastName?: string; org?: string; phone?: string; email?: string; url?: string }
  | { type: 'email'; address: string; subject?: string; body?: string }
  | { type: 'sms'; phone: string; message?: string }
  | { type: 'tel'; phone: string }
```

- [ ] **Step 5: Write the failing test for wifi encoding**

Create `packages/core/src/content/wifi.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { encodeWifi } from './wifi'

describe('encodeWifi', () => {
  it('encodes a basic WPA network', () => {
    const result = encodeWifi({ type: 'wifi', ssid: 'HomeNet', password: 'secret123', security: 'WPA' })
    expect(result).toBe('WIFI:T:WPA;S:HomeNet;P:secret123;H:false;;')
  })

  it('escapes special characters in ssid and password', () => {
    const result = encodeWifi({ type: 'wifi', ssid: 'Home;Net', password: 'p:a\\ss', security: 'WPA' })
    expect(result).toBe('WIFI:T:WPA;S:Home\\;Net;P:p\\:a\\\\ss;H:false;;')
  })

  it('defaults security to WPA and marks hidden networks', () => {
    const result = encodeWifi({ type: 'wifi', ssid: 'Guest', hidden: true })
    expect(result).toBe('WIFI:T:WPA;S:Guest;P:;H:true;;')
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd packages/core && pnpm install && pnpm vitest run src/content/wifi.test.ts`
Expected: FAIL — `Cannot find module './wifi'`

- [ ] **Step 7: Create `packages/core/src/content/url.ts`**

```ts
import type { QRContent } from './types'

export function encodeUrlOrText(content: Extract<QRContent, { type: 'url' | 'text' }>): string {
  return content.value
}
```

- [ ] **Step 8: Create `packages/core/src/content/wifi.ts`**

```ts
import type { QRContent } from './types'

function escapeWifiField(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1')
}

export function encodeWifi(content: Extract<QRContent, { type: 'wifi' }>): string {
  const security = content.security ?? 'WPA'
  const hidden = content.hidden ? 'true' : 'false'
  const password = content.password ? escapeWifiField(content.password) : ''
  return `WIFI:T:${security};S:${escapeWifiField(content.ssid)};P:${password};H:${hidden};;`
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `pnpm vitest run src/content/wifi.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 10: Commit**

```bash
git add packages/core
git commit -m "feat(core): scaffold core package, add url/text and wifi encoders"
```

---

### Task 3: vcard + email/sms/tel encoders + dispatcher

**Files:**
- Create: `packages/core/src/content/vcard.ts`
- Create: `packages/core/src/content/contact-actions.ts`
- Create: `packages/core/src/content/index.ts`
- Test: `packages/core/src/content/vcard.test.ts`
- Test: `packages/core/src/content/contact-actions.test.ts`
- Test: `packages/core/src/content/index.test.ts`

**Interfaces:**
- Consumes: `QRContent` (Task 2), `encodeUrlOrText`, `encodeWifi` (Task 2).
- Produces: `encodeVCard(content) → string`, `encodeEmail(content) → string`, `encodeSms(content) → string`, `encodeTel(content) → string`, `encodeContent(content: QRContent) → string` (the single dispatcher later tasks call).

- [ ] **Step 1: Write the failing test for vcard**

Create `packages/core/src/content/vcard.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { encodeVCard } from './vcard'

describe('encodeVCard', () => {
  it('encodes a full contact card', () => {
    const result = encodeVCard({
      type: 'vcard',
      firstName: 'Ada',
      lastName: 'Lovelace',
      org: 'Analytical Engines Inc',
      phone: '+1234567890',
      email: 'ada@example.com',
      url: 'https://example.com'
    })
    expect(result).toBe(
      'BEGIN:VCARD\nVERSION:3.0\nN:Lovelace;Ada;;;\nFN:Ada Lovelace\nORG:Analytical Engines Inc\nTEL:+1234567890\nEMAIL:ada@example.com\nURL:https://example.com\nEND:VCARD'
    )
  })

  it('omits optional fields when absent', () => {
    const result = encodeVCard({ type: 'vcard', firstName: 'Ada' })
    expect(result).toBe('BEGIN:VCARD\nVERSION:3.0\nN:;Ada;;;\nFN:Ada\nEND:VCARD')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/content/vcard.test.ts`
Expected: FAIL — `Cannot find module './vcard'`

- [ ] **Step 3: Create `packages/core/src/content/vcard.ts`**

```ts
import type { QRContent } from './types'

export function encodeVCard(content: Extract<QRContent, { type: 'vcard' }>): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0']
  lines.push(`N:${content.lastName ?? ''};${content.firstName};;;`)
  lines.push(`FN:${content.firstName}${content.lastName ? ' ' + content.lastName : ''}`)
  if (content.org) lines.push(`ORG:${content.org}`)
  if (content.phone) lines.push(`TEL:${content.phone}`)
  if (content.email) lines.push(`EMAIL:${content.email}`)
  if (content.url) lines.push(`URL:${content.url}`)
  lines.push('END:VCARD')
  return lines.join('\n')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/content/vcard.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Write the failing test for contact actions**

Create `packages/core/src/content/contact-actions.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { encodeEmail, encodeSms, encodeTel } from './contact-actions'

describe('contact action encoders', () => {
  it('encodes a mailto link with subject and body', () => {
    const result = encodeEmail({ type: 'email', address: 'a@b.com', subject: 'Hi', body: 'Hello there' })
    expect(result).toBe('mailto:a@b.com?subject=Hi&body=Hello+there')
  })

  it('encodes a mailto link with no params', () => {
    expect(encodeEmail({ type: 'email', address: 'a@b.com' })).toBe('mailto:a@b.com')
  })

  it('encodes an sms link with a message', () => {
    expect(encodeSms({ type: 'sms', phone: '+1234567890', message: 'call me' })).toBe(
      'sms:+1234567890?body=call%20me'
    )
  })

  it('encodes a tel link', () => {
    expect(encodeTel({ type: 'tel', phone: '+1234567890' })).toBe('tel:+1234567890')
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `pnpm vitest run src/content/contact-actions.test.ts`
Expected: FAIL — `Cannot find module './contact-actions'`

- [ ] **Step 7: Create `packages/core/src/content/contact-actions.ts`**

```ts
import type { QRContent } from './types'

export function encodeEmail(content: Extract<QRContent, { type: 'email' }>): string {
  const params = new URLSearchParams()
  if (content.subject) params.set('subject', content.subject)
  if (content.body) params.set('body', content.body)
  const query = params.toString()
  return `mailto:${content.address}${query ? '?' + query : ''}`
}

export function encodeSms(content: Extract<QRContent, { type: 'sms' }>): string {
  return `sms:${content.phone}${content.message ? '?body=' + encodeURIComponent(content.message) : ''}`
}

export function encodeTel(content: Extract<QRContent, { type: 'tel' }>): string {
  return `tel:${content.phone}`
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `pnpm vitest run src/content/contact-actions.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 9: Write the failing test for the dispatcher**

Create `packages/core/src/content/index.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { encodeContent } from './index'

describe('encodeContent', () => {
  it('dispatches url content to the raw value', () => {
    expect(encodeContent({ type: 'url', value: 'https://example.com' })).toBe('https://example.com')
  })

  it('dispatches wifi content to WIFI: format', () => {
    expect(encodeContent({ type: 'wifi', ssid: 'Net' })).toContain('WIFI:T:WPA;S:Net;')
  })

  it('dispatches tel content to tel: format', () => {
    expect(encodeContent({ type: 'tel', phone: '+1' })).toBe('tel:+1')
  })
})
```

- [ ] **Step 10: Run test to verify it fails**

Run: `pnpm vitest run src/content/index.test.ts`
Expected: FAIL — `Cannot find module './index'`

- [ ] **Step 11: Create `packages/core/src/content/index.ts`**

```ts
import type { QRContent } from './types'
import { encodeUrlOrText } from './url'
import { encodeWifi } from './wifi'
import { encodeVCard } from './vcard'
import { encodeEmail, encodeSms, encodeTel } from './contact-actions'

export type { QRContent } from './types'

export function encodeContent(content: QRContent): string {
  switch (content.type) {
    case 'url':
    case 'text':
      return encodeUrlOrText(content)
    case 'wifi':
      return encodeWifi(content)
    case 'vcard':
      return encodeVCard(content)
    case 'email':
      return encodeEmail(content)
    case 'sms':
      return encodeSms(content)
    case 'tel':
      return encodeTel(content)
  }
}
```

- [ ] **Step 12: Run test to verify it passes**

Run: `pnpm vitest run src/content/index.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 13: Commit**

```bash
git add packages/core/src/content
git commit -m "feat(core): add vcard, email/sms/tel encoders and content dispatcher"
```

---

### Task 4: QR matrix generation

**Files:**
- Create: `packages/core/src/matrix/generate-matrix.ts`
- Test: `packages/core/src/matrix/generate-matrix.test.ts`

**Interfaces:**
- Produces: `generateMatrix(payload: string, errorCorrectionLevel: 'L'|'M'|'Q'|'H') → boolean[][]` — later tasks (renderer, public API) consume this exact signature.

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/matrix/generate-matrix.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { generateMatrix } from './generate-matrix'

describe('generateMatrix', () => {
  it('produces a square boolean matrix', () => {
    const matrix = generateMatrix('https://example.com', 'M')
    expect(matrix.length).toBeGreaterThan(0)
    for (const row of matrix) {
      expect(row.length).toBe(matrix.length)
      for (const cell of row) expect(typeof cell).toBe('boolean')
    }
  })

  it('produces a larger matrix for level H than level L for the same payload class', () => {
    const low = generateMatrix('a'.repeat(100), 'L')
    const high = generateMatrix('a'.repeat(100), 'H')
    expect(high.length).toBeGreaterThanOrEqual(low.length)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/matrix/generate-matrix.test.ts`
Expected: FAIL — `Cannot find module './generate-matrix'`

- [ ] **Step 3: Create `packages/core/src/matrix/generate-matrix.ts`**

```ts
import QRCode from 'qrcode'

export function generateMatrix(payload: string, errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'): boolean[][] {
  const qr = QRCode.create(payload, { errorCorrectionLevel })
  const { size, data } = qr.modules
  const matrix: boolean[][] = []
  for (let row = 0; row < size; row++) {
    const rowCells: boolean[] = []
    for (let col = 0; col < size; col++) {
      rowCells.push(!!data[row * size + col])
    }
    matrix.push(rowCells)
  }
  return matrix
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/matrix/generate-matrix.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/matrix
git commit -m "feat(core): add QR matrix generation wrapper"
```

---

### Task 5: Style types + validation guards

**Files:**
- Create: `packages/core/src/style/types.ts`
- Create: `packages/core/src/style/validate.ts`
- Test: `packages/core/src/style/validate.test.ts`

**Interfaces:**
- Produces: `StyleOptions` (input type), `ResolvedStyle` (output type), `resolveStyle(style?: StyleOptions) → ResolvedStyle` — the renderer (Task 6/7) and public API (Task 11) consume `ResolvedStyle` exclusively, never raw `StyleOptions`.

- [ ] **Step 1: Create `packages/core/src/style/types.ts`**

```ts
export type ModuleShape = 'square' | 'rounded' | 'circle'

export interface StyleOptions {
  foregroundColor?: string
  backgroundColor?: string
  dotShape?: ModuleShape
  eyeShape?: ModuleShape
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  logo?: { dataUrl: string; sizeRatio?: number }
  frame?: { text: string; color?: string; textColor?: string }
  imageBlend?: { dataUrl: string; opacity?: number }
}

export interface ResolvedStyle {
  foregroundColor: string
  backgroundColor: string
  dotShape: ModuleShape
  eyeShape: ModuleShape
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
  logo?: { dataUrl: string; sizeRatio: number }
  frame?: { text: string; color: string; textColor: string }
  imageBlend?: { dataUrl: string; opacity: number }
}
```

- [ ] **Step 2: Write the failing test**

Create `packages/core/src/style/validate.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { resolveStyle } from './validate'

describe('resolveStyle', () => {
  it('fills in defaults when no style given', () => {
    const resolved = resolveStyle()
    expect(resolved.foregroundColor).toBe('#000000')
    expect(resolved.backgroundColor).toBe('#ffffff')
    expect(resolved.dotShape).toBe('square')
    expect(resolved.eyeShape).toBe('square')
    expect(resolved.errorCorrectionLevel).toBe('M')
  })

  it('forces error correction to H when a logo is present', () => {
    const resolved = resolveStyle({ logo: { dataUrl: 'data:image/png;base64,x' }, errorCorrectionLevel: 'L' })
    expect(resolved.errorCorrectionLevel).toBe('H')
  })

  it('forces error correction to H when an image blend is present', () => {
    const resolved = resolveStyle({ imageBlend: { dataUrl: 'data:image/png;base64,x' } })
    expect(resolved.errorCorrectionLevel).toBe('H')
  })

  it('caps logo size ratio at 0.25', () => {
    const resolved = resolveStyle({ logo: { dataUrl: 'x', sizeRatio: 0.9 } })
    expect(resolved.logo?.sizeRatio).toBe(0.25)
  })

  it('caps image blend opacity at 0.25', () => {
    const resolved = resolveStyle({ imageBlend: { dataUrl: 'x', opacity: 0.9 } })
    expect(resolved.imageBlend?.opacity).toBe(0.25)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm vitest run src/style/validate.test.ts`
Expected: FAIL — `Cannot find module './validate'`

- [ ] **Step 4: Create `packages/core/src/style/validate.ts`**

```ts
import type { StyleOptions, ResolvedStyle } from './types'

const MAX_LOGO_RATIO = 0.25
const DEFAULT_LOGO_RATIO = 0.2
const MAX_BLEND_OPACITY = 0.25
const DEFAULT_BLEND_OPACITY = 0.15

export function resolveStyle(style: StyleOptions = {}): ResolvedStyle {
  const hasLogoOrBlend = !!style.logo || !!style.imageBlend

  return {
    foregroundColor: style.foregroundColor ?? '#000000',
    backgroundColor: style.backgroundColor ?? '#ffffff',
    dotShape: style.dotShape ?? 'square',
    eyeShape: style.eyeShape ?? 'square',
    errorCorrectionLevel: hasLogoOrBlend ? 'H' : style.errorCorrectionLevel ?? 'M',
    logo: style.logo
      ? { dataUrl: style.logo.dataUrl, sizeRatio: Math.min(style.logo.sizeRatio ?? DEFAULT_LOGO_RATIO, MAX_LOGO_RATIO) }
      : undefined,
    frame: style.frame
      ? { text: style.frame.text, color: style.frame.color ?? '#000000', textColor: style.frame.textColor ?? '#ffffff' }
      : undefined,
    imageBlend: style.imageBlend
      ? { dataUrl: style.imageBlend.dataUrl, opacity: Math.min(style.imageBlend.opacity ?? DEFAULT_BLEND_OPACITY, MAX_BLEND_OPACITY) }
      : undefined
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run src/style/validate.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/style
git commit -m "feat(core): add style types and validation guards"
```

---

### Task 6: SVG renderer — base (colors, square modules, quiet zone)

**Files:**
- Create: `packages/core/src/render/finder-pattern.ts`
- Create: `packages/core/src/render/svg-renderer.ts`
- Test: `packages/core/src/render/svg-renderer.test.ts`

**Interfaces:**
- Consumes: `boolean[][]` matrix (Task 4), `ResolvedStyle` (Task 5).
- Produces: `renderSVG(matrix: boolean[][], style: ResolvedStyle) → string` — the public API (Task 11) calls this exact signature. `isInFinderPattern(row, col, size) → boolean` used internally and by Task 7.

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/render/svg-renderer.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { renderSVG } from './svg-renderer'
import { resolveStyle } from '../style/validate'

const matrix = [
  [true, false, true],
  [false, true, false],
  [true, false, true]
]

describe('renderSVG', () => {
  it('produces a valid svg root element', () => {
    const svg = renderSVG(matrix, resolveStyle())
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg.trim().endsWith('</svg>')).toBe(true)
  })

  it('draws a background rect using the resolved background color', () => {
    const svg = renderSVG(matrix, resolveStyle({ backgroundColor: '#ff00ff' }))
    expect(svg).toContain('fill="#ff00ff"')
  })

  it('draws one rect per dark module using the resolved foreground color', () => {
    const svg = renderSVG(matrix, resolveStyle({ foregroundColor: '#123456' }))
    const darkModuleCount = matrix.flat().filter(Boolean).length
    const matches = svg.match(/fill="#123456"/g) ?? []
    expect(matches.length).toBe(darkModuleCount)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/render/svg-renderer.test.ts`
Expected: FAIL — `Cannot find module './svg-renderer'`

- [ ] **Step 3: Create `packages/core/src/render/finder-pattern.ts`**

```ts
export function isInFinderPattern(row: number, col: number, size: number): boolean {
  const inTopLeft = row < 8 && col < 8
  const inTopRight = row < 8 && col >= size - 8
  const inBottomLeft = row >= size - 8 && col < 8
  return inTopLeft || inTopRight || inBottomLeft
}
```

- [ ] **Step 4: Create `packages/core/src/render/svg-renderer.ts`**

```ts
import type { ResolvedStyle } from '../style/types'
import { isInFinderPattern } from './finder-pattern'

const MODULE_SIZE = 10
const QUIET_ZONE_MODULES = 4

function renderModuleRect(x: number, y: number, size: number, color: string): string {
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${color}" />`
}

export function renderSVG(matrix: boolean[][], style: ResolvedStyle): string {
  const gridSize = matrix.length
  const quietZone = QUIET_ZONE_MODULES * MODULE_SIZE
  const dimension = gridSize * MODULE_SIZE + quietZone * 2

  let modules = ''
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (!matrix[row][col]) continue
      const x = quietZone + col * MODULE_SIZE
      const y = quietZone + row * MODULE_SIZE
      modules += renderModuleRect(x, y, MODULE_SIZE, style.foregroundColor)
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${dimension}" height="${dimension}" viewBox="0 0 ${dimension} ${dimension}">` +
    `<rect x="0" y="0" width="${dimension}" height="${dimension}" fill="${style.backgroundColor}" />` +
    modules +
    `</svg>`
  )
}
```

Note: `isInFinderPattern` isn't used by this base renderer yet — it's imported here so Task 7 only has to change module shape selection, not add a new import.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run src/render/svg-renderer.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/render
git commit -m "feat(core): add base SVG renderer with quiet zone and colors"
```

---

### Task 7: Dot/eye shape variants

**Files:**
- Modify: `packages/core/src/render/svg-renderer.ts`
- Test: `packages/core/src/render/svg-renderer.test.ts` (extend)

**Interfaces:**
- Consumes: `isInFinderPattern` (Task 6), `ResolvedStyle.dotShape` / `ResolvedStyle.eyeShape` (Task 5).
- Produces: `renderSVG` now honors shape — signature unchanged.

- [ ] **Step 1: Write the failing test**

Append to `packages/core/src/render/svg-renderer.test.ts`:

```ts
describe('renderSVG shapes', () => {
  it('renders circle modules as <circle> when dotShape is circle', () => {
    const svg = renderSVG(matrix, resolveStyle({ dotShape: 'circle' }))
    expect(svg).toContain('<circle')
    expect(svg).not.toContain('<rect x="0" y="0"'.replace('x="0" y="0"', '')) // sanity: still has some rect (background)
  })

  it('renders rounded modules with rx/ry when dotShape is rounded', () => {
    const svg = renderSVG(matrix, resolveStyle({ dotShape: 'rounded' }))
    expect(svg).toContain('rx=')
  })

  it('applies eyeShape only to finder-pattern modules, dotShape elsewhere', () => {
    const bigMatrix: boolean[][] = Array.from({ length: 25 }, (_, row) =>
      Array.from({ length: 25 }, (_, col) => row === 12 && col === 12)
    )
    // force the single dark module (12,12) to be inside neither finder pattern for a 25x25 grid,
    // and mark one finder-pattern cell dark too
    bigMatrix[0][0] = true
    const svg = renderSVG(bigMatrix, resolveStyle({ dotShape: 'circle', eyeShape: 'square' }))
    // The center dark module (dotShape) should render as a circle, and we should also see at least one rect module (the eye).
    expect(svg).toContain('<circle')
    const rectModuleCount = (svg.match(/<rect/g) ?? []).length
    expect(rectModuleCount).toBeGreaterThanOrEqual(2) // background rect + at least one square eye module
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/render/svg-renderer.test.ts`
Expected: FAIL — circle/rounded assertions fail because renderer only emits rects.

- [ ] **Step 3: Modify `packages/core/src/render/svg-renderer.ts`**

Replace `renderModuleRect` and the modules loop with:

```ts
import type { ModuleShape } from '../style/types'

function renderModule(x: number, y: number, size: number, shape: ModuleShape, color: string): string {
  if (shape === 'circle') {
    const cx = x + size / 2
    const cy = y + size / 2
    const r = size * 0.4
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" />`
  }
  if (shape === 'rounded') {
    const radius = size * 0.3
    return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${color}" />`
  }
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${color}" />`
}
```

Update the loop inside `renderSVG`:

```ts
  let modules = ''
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (!matrix[row][col]) continue
      const x = quietZone + col * MODULE_SIZE
      const y = quietZone + row * MODULE_SIZE
      const shape = isInFinderPattern(row, col, gridSize) ? style.eyeShape : style.dotShape
      modules += renderModule(x, y, MODULE_SIZE, shape, style.foregroundColor)
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/render/svg-renderer.test.ts`
Expected: PASS (all tests from Task 6 + Task 7)

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/render/svg-renderer.ts packages/core/src/render/svg-renderer.test.ts
git commit -m "feat(core): support dot/eye module shape variants"
```

---

### Task 8: Logo overlay + frame/CTA

**Files:**
- Modify: `packages/core/src/render/svg-renderer.ts`
- Test: `packages/core/src/render/svg-renderer.test.ts` (extend)

**Interfaces:**
- Consumes: `ResolvedStyle.logo`, `ResolvedStyle.frame` (Task 5).
- Produces: `renderSVG` signature unchanged; output SVG height grows by 40 when `frame` is set.

- [ ] **Step 1: Write the failing test**

Append to `packages/core/src/render/svg-renderer.test.ts`:

```ts
describe('renderSVG logo and frame', () => {
  it('overlays a logo image centered on the code', () => {
    const svg = renderSVG(matrix, resolveStyle({ logo: { dataUrl: 'data:image/png;base64,abc' } }))
    expect(svg).toContain('<image href="data:image/png;base64,abc"')
  })

  it('adds a frame band with CTA text below the code', () => {
    const svg = renderSVG(matrix, resolveStyle({ frame: { text: 'Scan me' } }))
    expect(svg).toContain('Scan me')
    expect(svg).toContain('<text')
  })

  it('increases total svg height by 40 when a frame is present', () => {
    const withoutFrame = renderSVG(matrix, resolveStyle())
    const withFrame = renderSVG(matrix, resolveStyle({ frame: { text: 'Scan me' } }))
    const heightOf = (svg: string) => Number(svg.match(/height="(\d+)"/)?.[1])
    expect(heightOf(withFrame)).toBe(heightOf(withoutFrame) + 40)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/render/svg-renderer.test.ts`
Expected: FAIL — no `<image>` or frame band emitted yet.

- [ ] **Step 3: Modify `packages/core/src/render/svg-renderer.ts`**

Replace the final return statement of `renderSVG` with:

```ts
  let logoLayer = ''
  if (style.logo) {
    const logoSize = gridSize * MODULE_SIZE * style.logo.sizeRatio
    const logoX = quietZone + (gridSize * MODULE_SIZE - logoSize) / 2
    const logoY = quietZone + (gridSize * MODULE_SIZE - logoSize) / 2
    const padding = 4
    logoLayer =
      `<rect x="${logoX - padding}" y="${logoY - padding}" width="${logoSize + padding * 2}" height="${logoSize + padding * 2}" fill="${style.backgroundColor}" />` +
      `<image href="${style.logo.dataUrl}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" />`
  }

  const frameHeight = 40
  let frameLayer = ''
  if (style.frame) {
    frameLayer =
      `<rect x="0" y="${dimension}" width="${dimension}" height="${frameHeight}" fill="${style.frame.color}" />` +
      `<text x="${dimension / 2}" y="${dimension + frameHeight / 2 + 6}" text-anchor="middle" font-size="20" fill="${style.frame.textColor}">${style.frame.text}</text>`
  }

  const totalHeight = dimension + (style.frame ? frameHeight : 0)

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${dimension}" height="${totalHeight}" viewBox="0 0 ${dimension} ${totalHeight}">` +
    `<rect x="0" y="0" width="${dimension}" height="${dimension}" fill="${style.backgroundColor}" />` +
    modules +
    logoLayer +
    frameLayer +
    `</svg>`
  )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/render/svg-renderer.test.ts`
Expected: PASS (all tests from Tasks 6-8)

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/render/svg-renderer.ts packages/core/src/render/svg-renderer.test.ts
git commit -m "feat(core): add logo overlay and frame/CTA rendering"
```

---

### Task 9: Image blend (subtle artistic mode)

**Files:**
- Modify: `packages/core/src/render/svg-renderer.ts`
- Test: `packages/core/src/render/svg-renderer.test.ts` (extend)

**Interfaces:**
- Consumes: `ResolvedStyle.imageBlend` (Task 5, forces `errorCorrectionLevel: 'H'` — already enforced there).
- Produces: `renderSVG` signature unchanged.

- [ ] **Step 1: Write the failing test**

Append to `packages/core/src/render/svg-renderer.test.ts`:

```ts
describe('renderSVG image blend', () => {
  it('renders the blend image behind the modules at the resolved opacity', () => {
    const svg = renderSVG(matrix, resolveStyle({ imageBlend: { dataUrl: 'data:image/png;base64,xyz', opacity: 0.15 } }))
    expect(svg).toContain('<image href="data:image/png;base64,xyz"')
    expect(svg).toContain('opacity="0.15"')
    const blendIndex = svg.indexOf('data:image/png;base64,xyz')
    const firstModuleIndex = svg.indexOf('fill="#000000"', blendIndex)
    expect(blendIndex).toBeLessThan(firstModuleIndex)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/render/svg-renderer.test.ts`
Expected: FAIL — no blend image emitted.

- [ ] **Step 3: Modify `packages/core/src/render/svg-renderer.ts`**

Add before the `modules` loop runs (blend layer must be emitted before modules in the final markup so it renders behind them):

```ts
  let blendLayer = ''
  if (style.imageBlend) {
    const contentSize = gridSize * MODULE_SIZE
    blendLayer = `<image href="${style.imageBlend.dataUrl}" x="${quietZone}" y="${quietZone}" width="${contentSize}" height="${contentSize}" opacity="${style.imageBlend.opacity}" preserveAspectRatio="xMidYMid slice" />`
  }
```

Update the final return to include `blendLayer` before `modules`:

```ts
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${dimension}" height="${totalHeight}" viewBox="0 0 ${dimension} ${totalHeight}">` +
    `<rect x="0" y="0" width="${dimension}" height="${dimension}" fill="${style.backgroundColor}" />` +
    blendLayer +
    modules +
    logoLayer +
    frameLayer +
    `</svg>`
  )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/render/svg-renderer.test.ts`
Expected: PASS (all tests from Tasks 6-9)

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/render/svg-renderer.ts packages/core/src/render/svg-renderer.test.ts
git commit -m "feat(core): add subtle image-blend artistic mode"
```

---

### Task 10: Public API + PNG export + scan round-trip tests

**Files:**
- Create: `packages/core/src/generate-qr.ts`
- Create: `packages/core/src/index.ts`
- Test: `packages/core/src/generate-qr.test.ts`

**Interfaces:**
- Consumes: `encodeContent` (Task 3), `generateMatrix` (Task 4), `resolveStyle` (Task 5), `renderSVG` (Tasks 6-9).
- Produces: `generateQR(content: QRContent, style?: StyleOptions) → { svg: string; toPng(): Promise<Buffer> }` — this is the single function the README tells backend integrators to copy.

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/generate-qr.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import jsQR from 'jsqr'
import { generateQR } from './generate-qr'

async function decode(png: Buffer): Promise<string | null> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const result = jsQR(new Uint8ClampedArray(data), info.width, info.height)
  return result?.data ?? null
}

describe('generateQR scan round-trip', () => {
  it('produces svg and a decodable png for a plain url', async () => {
    const { svg, toPng } = generateQR({ type: 'url', value: 'https://example.com' })
    expect(svg).toContain('<svg')
    const png = await toPng()
    const decoded = await decode(png)
    expect(decoded).toBe('https://example.com')
  })

  it('round-trips wifi content', async () => {
    const { toPng } = generateQR({ type: 'wifi', ssid: 'HomeNet', password: 'secret123' })
    const decoded = await decode(await toPng())
    expect(decoded).toBe('WIFI:T:WPA;S:HomeNet;P:secret123;H:false;;')
  })

  it('round-trips styled QR codes (rounded/circle shapes, custom colors)', async () => {
    const { toPng } = generateQR(
      { type: 'url', value: 'https://example.com' },
      { dotShape: 'rounded', eyeShape: 'circle', foregroundColor: '#003366', backgroundColor: '#eef2ff' }
    )
    const decoded = await decode(await toPng())
    expect(decoded).toBe('https://example.com')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/generate-qr.test.ts`
Expected: FAIL — `Cannot find module './generate-qr'`

- [ ] **Step 3: Create `packages/core/src/generate-qr.ts`**

```ts
import sharp from 'sharp'
import { encodeContent, type QRContent } from './content'
import { generateMatrix } from './matrix/generate-matrix'
import { resolveStyle } from './style/validate'
import type { StyleOptions } from './style/types'
import { renderSVG } from './render/svg-renderer'

export function generateQR(content: QRContent, style: StyleOptions = {}) {
  const payload = encodeContent(content)
  const resolvedStyle = resolveStyle(style)
  const matrix = generateMatrix(payload, resolvedStyle.errorCorrectionLevel)
  const svg = renderSVG(matrix, resolvedStyle)

  return {
    svg,
    toPng: (): Promise<Buffer> => sharp(Buffer.from(svg)).png().toBuffer()
  }
}
```

- [ ] **Step 4: Create `packages/core/src/index.ts`**

```ts
export { generateQR } from './generate-qr'
export type { QRContent } from './content'
export type { StyleOptions, ResolvedStyle, ModuleShape } from './style/types'
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run src/generate-qr.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 6: Run the full core test suite**

Run: `cd packages/core && pnpm test`
Expected: all tests across content/matrix/style/render/generate-qr PASS

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/generate-qr.ts packages/core/src/index.ts packages/core/src/generate-qr.test.ts
git commit -m "feat(core): add public generateQR API with PNG export and scan round-trip tests"
```

---

### Task 11: Web app scaffold + core wrapper

**Files:**
- Create: `packages/web/package.json`
- Create: `packages/web/tsconfig.json`
- Create: `packages/web/next.config.mjs`
- Create: `packages/web/lib/qr.ts`
- Create: `packages/web/app/layout.tsx`
- Create: `packages/web/app/page.tsx` (placeholder, replaced fully in Task 12)

**Interfaces:**
- Consumes: `@pixa/core`'s `generateQR`, `QRContent`, `StyleOptions` (Task 10).
- Produces: `generatePreview(content: QRContent, style?: StyleOptions) → { svg: string }` in `lib/qr.ts` — Task 12's components import this, not `@pixa/core` directly, so all core-facing calls are in one place.

- [ ] **Step 1: Create `packages/web/package.json`**

```json
{
  "name": "@pixa/web",
  "version": "0.1.0",
  "private": true,
  "license": "MIT",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "playwright test",
    "lint": "next lint"
  },
  "dependencies": {
    "@pixa/core": "workspace:*",
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/react": "^18.3.0",
    "@types/node": "^20.0.0",
    "@playwright/test": "^1.44.0"
  }
}
```

- [ ] **Step 2: Create `packages/web/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["DOM", "ES2020"],
    "noEmit": true
  },
  "include": ["app", "lib", "next-env.d.ts"]
}
```

- [ ] **Step 3: Create `packages/web/next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {}

export default nextConfig
```

- [ ] **Step 4: Create `packages/web/lib/qr.ts`**

```ts
import { generateQR, type QRContent, type StyleOptions } from '@pixa/core'

export function generatePreview(content: QRContent, style: StyleOptions = {}): { svg: string } {
  const { svg } = generateQR(content, style)
  return { svg }
}
```

- [ ] **Step 5: Create `packages/web/app/layout.tsx`**

```tsx
export const metadata = {
  title: 'QR Generator',
  description: 'Build customized, brandable QR codes.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 6: Create placeholder `packages/web/app/page.tsx`**

```tsx
export default function Page() {
  return <main>QR Generator — editor coming in the next task.</main>
}
```

- [ ] **Step 7: Install and verify the app boots**

Run: `pnpm install && cd packages/web && pnpm dev`
Expected: dev server starts on `localhost:3000`; visiting it shows the placeholder text. Stop the server (Ctrl+C) once confirmed.

- [ ] **Step 8: Commit**

```bash
git add packages/web
git commit -m "feat(web): scaffold Next.js app with core wrapper"
```

---

### Task 12: Content form + style panel + live preview

**Files:**
- Create: `packages/web/app/components/ContentForm.tsx`
- Create: `packages/web/app/components/StylePanel.tsx`
- Create: `packages/web/app/components/QrPreview.tsx`
- Modify: `packages/web/app/page.tsx`

**Interfaces:**
- Consumes: `generatePreview` (Task 11), `QRContent`/`StyleOptions` types (Task 10).
- Produces: `ContentForm` emits `onChange(content: QRContent)`; `StylePanel` emits `onChange(style: StyleOptions)`; `QrPreview` takes `{ svg: string }` and renders it. `page.tsx` owns the combined state and calls `generatePreview`.

- [ ] **Step 1: Create `packages/web/app/components/ContentForm.tsx`**

```tsx
'use client'

import { useState } from 'react'
import type { QRContent } from '@pixa/core'

const CONTENT_TYPES = ['url', 'wifi', 'vcard', 'email', 'sms', 'tel'] as const

export function ContentForm({ onChange }: { onChange: (content: QRContent) => void }) {
  const [type, setType] = useState<(typeof CONTENT_TYPES)[number]>('url')
  const [value, setValue] = useState('https://example.com')

  function emit(nextType: (typeof CONTENT_TYPES)[number], nextValue: string) {
    setType(nextType)
    setValue(nextValue)
    if (nextType === 'url') onChange({ type: 'url', value: nextValue })
    if (nextType === 'tel') onChange({ type: 'tel', phone: nextValue })
    if (nextType === 'wifi') onChange({ type: 'wifi', ssid: nextValue })
  }

  return (
    <div>
      <select value={type} onChange={(e) => emit(e.target.value as (typeof CONTENT_TYPES)[number], value)}>
        {CONTENT_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <input value={value} onChange={(e) => emit(type, e.target.value)} placeholder="Enter content" />
    </div>
  )
}
```

- [ ] **Step 2: Create `packages/web/app/components/StylePanel.tsx`**

```tsx
'use client'

import { useState } from 'react'
import type { StyleOptions, ModuleShape } from '@pixa/core'

const SHAPES: ModuleShape[] = ['square', 'rounded', 'circle']

export function StylePanel({ onChange }: { onChange: (style: StyleOptions) => void }) {
  const [foregroundColor, setForegroundColor] = useState('#000000')
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [dotShape, setDotShape] = useState<ModuleShape>('square')

  function emit(next: Partial<{ foregroundColor: string; backgroundColor: string; dotShape: ModuleShape }>) {
    const merged = { foregroundColor, backgroundColor, dotShape, ...next }
    setForegroundColor(merged.foregroundColor)
    setBackgroundColor(merged.backgroundColor)
    setDotShape(merged.dotShape)
    onChange({ foregroundColor: merged.foregroundColor, backgroundColor: merged.backgroundColor, dotShape: merged.dotShape })
  }

  return (
    <div>
      <label>
        Foreground
        <input type="color" value={foregroundColor} onChange={(e) => emit({ foregroundColor: e.target.value })} />
      </label>
      <label>
        Background
        <input type="color" value={backgroundColor} onChange={(e) => emit({ backgroundColor: e.target.value })} />
      </label>
      <select value={dotShape} onChange={(e) => emit({ dotShape: e.target.value as ModuleShape })}>
        {SHAPES.map((shape) => (
          <option key={shape} value={shape}>
            {shape}
          </option>
        ))}
      </select>
    </div>
  )
}
```

- [ ] **Step 3: Create `packages/web/app/components/QrPreview.tsx`**

```tsx
export function QrPreview({ svg }: { svg: string }) {
  return <div data-testid="qr-preview" dangerouslySetInnerHTML={{ __html: svg }} />
}
```

- [ ] **Step 4: Modify `packages/web/app/page.tsx`**

```tsx
'use client'

import { useMemo, useState } from 'react'
import type { QRContent, StyleOptions } from '@pixa/core'
import { ContentForm } from './components/ContentForm'
import { StylePanel } from './components/StylePanel'
import { QrPreview } from './components/QrPreview'
import { generatePreview } from '../lib/qr'

export default function Page() {
  const [content, setContent] = useState<QRContent>({ type: 'url', value: 'https://example.com' })
  const [style, setStyle] = useState<StyleOptions>({})

  const { svg } = useMemo(() => generatePreview(content, style), [content, style])

  return (
    <main>
      <ContentForm onChange={setContent} />
      <StylePanel onChange={setStyle} />
      <QrPreview svg={svg} />
    </main>
  )
}
```

- [ ] **Step 5: Manually verify in the browser**

Run: `cd packages/web && pnpm dev`, open `localhost:3000`.
Expected: changing the content input and style controls updates the rendered QR preview live. Stop the server once confirmed.

- [ ] **Step 6: Commit**

```bash
git add packages/web/app
git commit -m "feat(web): add content form, style panel, and live preview"
```

---

### Task 13: Download buttons + e2e smoke test

**Files:**
- Create: `packages/web/app/components/DownloadButtons.tsx`
- Modify: `packages/web/app/page.tsx`
- Create: `packages/web/playwright.config.ts`
- Test: `packages/web/e2e/generate-and-download.spec.ts`

**Interfaces:**
- Consumes: `svg: string` from `page.tsx` state (Task 12).
- Produces: `DownloadButtons` component with no exported functions consumed elsewhere — it's a leaf UI component.

- [ ] **Step 1: Create `packages/web/app/components/DownloadButtons.tsx`**

```tsx
'use client'

export function DownloadButtons({ svg }: { svg: string }) {
  function downloadSvg() {
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'qr-code.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadPng() {
    const canvas = document.createElement('canvas')
    const img = new Image()
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' })
    const svgUrl = URL.createObjectURL(svgBlob)

    await new Promise<void>((resolve) => {
      img.onload = () => resolve()
      img.src = svgUrl
    })

    canvas.width = img.width
    canvas.height = img.height
    canvas.getContext('2d')!.drawImage(img, 0, 0)
    URL.revokeObjectURL(svgUrl)

    canvas.toBlob((blob) => {
      if (!blob) return
      const pngUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = pngUrl
      a.download = 'qr-code.png'
      a.click()
      URL.revokeObjectURL(pngUrl)
    }, 'image/png')
  }

  return (
    <div>
      <button data-testid="download-svg" onClick={downloadSvg}>
        Download SVG
      </button>
      <button data-testid="download-png" onClick={downloadPng}>
        Download PNG
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Modify `packages/web/app/page.tsx`**

Add the import and render call:

```tsx
import { DownloadButtons } from './components/DownloadButtons'
```

Add `<DownloadButtons svg={svg} />` immediately after `<QrPreview svg={svg} />`.

- [ ] **Step 3: Create `packages/web/playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true
  },
  use: {
    baseURL: 'http://localhost:3000'
  }
})
```

- [ ] **Step 4: Write the failing e2e test**

Create `packages/web/e2e/generate-and-download.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('generates a QR preview and triggers an SVG download', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('qr-preview').locator('svg')).toBeVisible()

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('download-svg').click()
  ])

  expect(download.suggestedFilename()).toBe('qr-code.svg')
})
```

- [ ] **Step 5: Run test to verify it fails (before playwright browsers are installed)**

Run: `cd packages/web && pnpm exec playwright install --with-deps chromium`
Then run: `pnpm test`
Expected: at this point it should actually PASS since Task 12's page already renders the preview and Task 13 Step 1-2 already wired the download button — this step exists to confirm the wiring end-to-end. If it fails, check that Step 2's edit to `page.tsx` was applied.

- [ ] **Step 6: Run full web test suite**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/web/app packages/web/playwright.config.ts packages/web/e2e
git commit -m "feat(web): add SVG/PNG download and e2e smoke test"
```

---

## Final Verification

- [ ] Run `pnpm -r build` from the repo root — both packages build clean.
- [ ] Run `pnpm -r test` from the repo root — all core unit/snapshot/scan-roundtrip tests and the web e2e test pass.
- [ ] Manually open the web app, generate one QR code per content type (url, wifi, vcard, email, sms, tel), and scan each with a phone camera to confirm real-world scannability.
