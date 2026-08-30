# @pixa/core

The portable QR-generation engine behind [pixa](https://github.com/oct8-studio/pixa).
Plain TypeScript, one public function, zero dependency on React, Next.js, or
any server framework. This is the piece you're meant to copy into your own
backend, or install as a normal dependency — either way works, and nothing
about it assumes it's running inside this repo.

## What it does

Turns structured content (a URL, Wi-Fi credentials, a contact card, etc.)
into a styled, static QR code — as an SVG string and, on demand, a PNG
buffer. Static only: the content is encoded directly into the QR. There's no
dynamic/redirect QR, no database, no server-side state — `generateQR` is a
pure function of its two arguments.

## Installing it

**Option A — depend on it like any package** (if you're inside this
monorepo, or publish it to your own registry):

```bash
pnpm add @pixa/core
# or: npm install @pixa/core / yarn add @pixa/core
```

**Option B — copy the source directly into your backend**, which is the
whole point of this package existing separately. Copy `packages/core/src/`
into your project (e.g. `src/lib/qr/`), keep its two runtime dependencies
(`qrcode` and `sharp`), and import from wherever you placed it. Nothing in
`src/` reaches outside the package for anything other than those two npm
packages.

Either way, requires Node 18+ (for `sharp`'s prebuilt binaries) and works
from plain JavaScript too — just drop the type annotations from the examples
below.

## Quick example

```ts
import { generateQR } from '@pixa/core'

const { svg, toPng } = generateQR(
  { type: 'url', value: 'https://example.com' },
  { foregroundColor: '#111827', dotShape: 'rounded', eyeShape: 'circle' }
)

// svg is a ready-to-use SVG string — write it to a file, return it from an
// API response, inline it in HTML, whatever you need.
console.log(svg.startsWith('<svg')) // true

// toPng() is async (see "Why toPng() is async" below) and returns a PNG buffer.
const pngBuffer = await toPng()
```

## Framework integration examples

**NestJS controller:**

```ts
import { Controller, Get, Query, Res } from '@nestjs/common'
import type { Response } from 'express'
import { generateQR } from '@pixa/core'

@Controller('qr')
export class QrController {
  @Get('png')
  async png(@Query('url') url: string, @Res() res: Response) {
    const { toPng } = generateQR({ type: 'url', value: url })
    res.setHeader('Content-Type', 'image/png')
    res.send(await toPng())
  }
}
```

**Express route:**

```ts
import express from 'express'
import { generateQR } from '@pixa/core'

const app = express()

app.get('/qr.png', async (req, res) => {
  const { toPng } = generateQR({ type: 'url', value: String(req.query.url) })
  res.type('png').send(await toPng())
})
```

## API reference

### `generateQR(content, style?)`

```ts
function generateQR(
  content: QRContent,
  style?: StyleOptions
): {
  svg: string
  toPng: () => Promise<Buffer>
}
```

- Throws a plain `Error` if `content`'s payload is empty or exceeds what a
  QR code can encode, or if `style` fails validation (see below) — this is a
  programmer-facing API contract, not end-user input to silently tolerate,
  so wrap the call in a try/catch at whatever boundary handles untrusted
  input in your app (this is exactly what `@pixa/web` does).
- `svg` is computed synchronously and is always a complete, valid SVG
  document — safe to use directly.
- `toPng()` is separate and async — see the next section for why.

### Why `toPng()` is async

`svg` and `toPng` are split for a concrete reason: PNG rasterization uses
`sharp`, a native module. If you call `generateQR` in a browser bundle (e.g.
a live preview UI, like `@pixa/web`'s), you almost always only need `svg` —
`sharp` never needs to load in that path, and a native module has no
business being pulled into a client bundle anyway. Keeping `toPng` as a
separate async function (backed internally by a dynamic `import('sharp')`)
means the SVG path stays fully synchronous and portable, and `sharp` is only
touched by callers who actually invoke `toPng()` — typically a server or a
Node script, never a browser tab.

### `QRContent`

A discriminated union — pick one shape based on `type`:

```ts
type QRContent =
  | { type: 'url'; value: string }
  | { type: 'text'; value: string }
  | { type: 'wifi'; ssid: string; password?: string; security?: 'WPA' | 'WEP' | 'nopass'; hidden?: boolean }
  | { type: 'vcard'; firstName: string; lastName?: string; org?: string; phone?: string; email?: string; url?: string }
  | { type: 'email'; address: string; subject?: string; body?: string }
  | { type: 'sms'; phone: string; message?: string }
  | { type: 'tel'; phone: string }
```

| `type`    | Encodes as                                          | Notes |
| --------- | ---------------------------------------------------- | ----- |
| `url`/`text` | The raw string, verbatim                           | No difference in encoding — `type` is purely descriptive for your own code. |
| `wifi`    | The standard `WIFI:T:...;S:...;P:...;H:...;;` format | `security` defaults to `'WPA'` if omitted. Special characters in `ssid`/`password` (`;`, `,`, `:`, `"`, `\`) are escaped automatically. |
| `vcard`   | A minimal vCard 3.0 record                            | Only `firstName` is required; every other field is optional and omitted from the output if not given. |
| `email`   | A `mailto:` link                                      | `subject`/`body` become URL-encoded query params if present. |
| `sms`     | An `sms:` link                                        | `message` becomes a URL-encoded `?body=` param if present. |
| `tel`     | A `tel:` link                                         | |

### `StyleOptions`

Every field is optional — omit anything you don't want to customize.

```ts
interface StyleOptions {
  foregroundColor?: string   // default '#000000'
  backgroundColor?: string   // default '#ffffff'
  dotShape?: 'square' | 'rounded' | 'circle'                    // default 'square'
  eyeShape?: 'square' | 'rounded' | 'circle' | 'ring'           // default 'square'
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'                  // default 'M' — see note below
  logo?: { dataUrl: string; sizeRatio?: number }                // sizeRatio default 0.2, capped at 0.25
  frame?: { text: string; color?: string; textColor?: string }  // color/textColor default '#000000'/'#ffffff'
  imageBlend?: { dataUrl: string; opacity?: number }            // opacity default 0.15, capped at 0.25
  patternImage?: { dataUrl: string }
}
```

**Colors** (`foregroundColor`, `backgroundColor`, `frame.color`,
`frame.textColor`) must be a hex color (`#rgb`, `#rrggbb`, or `#rrggbbaa`) or
an `rgb()`/`rgba()` string — anything else throws. This isn't a display
restriction; it's because these values get interpolated into the generated
SVG, and rejecting non-color-shaped strings up front is what keeps that safe
(the renderer also HTML-escapes every interpolated value as defense in
depth, but validating the shape at the boundary is the primary guard).

**Image fields** (`logo.dataUrl`, `imageBlend.dataUrl`, `patternImage.dataUrl`)
must be a `data:image/...` URL — an `http(s):` URL is rejected. This is
deliberate: `@pixa/core` never fetches a remote resource on your behalf, so
there's no SSRF surface and no network dependency in the rendering path.
Convert an uploaded file or a fetched image to a data URL yourself (in the
browser, `FileReader.readAsDataURL`; in Node, `` `data:image/png;base64,${buffer.toString('base64')}` ``)
before passing it in.

**Safety guardrails — not just defaults, hard-enforced:**

- If `logo`, `imageBlend`, or `patternImage` is present, `errorCorrectionLevel`
  is silently forced to `'H'`, regardless of what you pass — a lower level
  paired with visual complexity is a real scan-reliability risk, so this
  isn't left to the caller to remember.
- `logo.sizeRatio` and `imageBlend.opacity` are clamped to `[0, 0.25]` — a
  caller-supplied value outside that range doesn't error, it's silently
  clamped (a negative or absurdly large value would otherwise risk an
  unscannable code).

Combine as many style features as you like — `logo`, `patternImage`,
`imageBlend`, and `frame` are independent layers, not mutually exclusive
(verified by real barcode-scanner round-trip tests in the test suite, not
just visual inspection — see [Testing philosophy](#testing-philosophy)).

### `ModuleShape` / `EyeShape`

```ts
type ModuleShape = 'square' | 'rounded' | 'circle'
type EyeShape = ModuleShape | 'ring'
```

`'ring'` is only meaningful for `eyeShape` — it draws the three finder
markers as themed concentric circles (matching the "logo-colored QR" look
of brand pattern examples) instead of the plain shape variants. Passing
`'ring'` for `dotShape` isn't a supported combination.

### `ResolvedStyle`

The fully-defaulted, validated form of `StyleOptions` that the renderer
actually consumes — every optional field is filled in, every value has
already passed validation. You won't normally construct this yourself; it
exists as an exported type for anyone building an alternative renderer on
top of the same content/matrix/style pipeline.

## Architecture, if you're extending this

```
content/   → encodes structured input into the exact payload string
matrix/    → wraps the `qrcode` package to turn a payload into a module grid
style/     → validates & defaults StyleOptions into a ResolvedStyle
render/    → turns a module grid + ResolvedStyle into an SVG string
generate-qr.ts → wires the above into the public generateQR() function
```

Each stage is a pure function of its input — no shared mutable state, no
class instances to construct. If you only need one piece (e.g. just the
Wi-Fi payload encoder), importing directly from `content/wifi.ts` works
fine; the barrel export in `index.ts` is a convenience, not a requirement.

## Testing philosophy

Every styling feature that touches scan reliability (logos, patterns,
blends, ring eyes, and their combinations) is verified with a **real**
decode round-trip: generate a PNG, rasterize it, and decode it with a real
QR-reading library (`jsqr`) — not just an assertion that the SVG string
"looks right." This caught two real bugs during development that pure
visual inspection missed (a contrast-washout case and a rendering-order bug
that erased a finder pattern's center) — see `src/generate-qr.test.ts` and
`src/render/svg-renderer.test.ts` for the specific regression cases.

```bash
pnpm test    # from packages/core, or `pnpm --filter @pixa/core test` from the repo root
```
