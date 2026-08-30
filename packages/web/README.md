# @pixa/web

The reference web editor for [pixa](https://github.com/oct8-studio/pixa) —
a Next.js app with a live-preview QR customization UI, built entirely on
top of [`@pixa/core`](../core/README.md).

Fully client-side: content fields, style controls, and the live preview all
run in the browser. There's no backend, no database, no server-side
storage — uploaded logos and images never leave the browser (they're
converted to data URLs locally and passed straight into `@pixa/core`).

## Local development

From the repo root (this package is part of a pnpm workspace, so
`@pixa/core` needs to be built first):

```bash
pnpm install
pnpm dev        # builds @pixa/core, then starts this app's dev server
```

Or, working only within this package:

```bash
cd packages/web
pnpm --filter @pixa/core build   # from the repo root, once
pnpm dev
```

Open `http://localhost:3000`.

## Building for production

```bash
pnpm --filter @pixa/core build
pnpm --filter @pixa/web build
pnpm --filter @pixa/web start   # or however your host runs `next start`
```

## Hosting

This is a standard Next.js 14 App Router project — any Next.js hosting
target works. A few things specific to this app worth knowing before you
deploy:

- **Not a static export.** The app uses a `webpack` override in
  `next.config.mjs` to keep the native `sharp` module out of the *client*
  bundle (PNG rasterization happens via `@pixa/core`'s `toPng()`, which only
  ever runs when a user clicks "Download PNG" — never during SSR or in the
  browser). This means the app needs a real Node.js server runtime (or an
  edge/serverless platform that supports Next.js's Node runtime), not
  `next export`'s static-HTML output.
- **No environment variables required.** There's no API keys, no database
  connection string, nothing to configure — the app has no server-side
  state at all.
- **`sharp` needs a Node runtime**, not the Edge runtime. If you're
  deploying to a platform that defaults new routes to Edge (e.g. some
  Vercel configurations), make sure this app's routes run on the Node.js
  runtime — it's the default for a plain `next build`/`next start` and for
  Vercel's standard Next.js preset, so this only matters if you've
  customized `runtime` somewhere.

**Vercel** (simplest path, given this is a standard Next.js app): point a
new Vercel project at this repo, set the project's root directory to
`packages/web`, and set the build command to
`cd ../.. && pnpm install && pnpm --filter @pixa/core build && pnpm --filter @pixa/web build`
so the workspace dependency gets built first.

**Any other Node host** (Railway, Render, Fly.io, a plain VM): run
the three commands under [Building for production](#building-for-production)
above, then serve with `next start` (or your platform's equivalent) from
`packages/web`.

**Docker** (optional — not required for local dev or a plain Node host). A
`Dockerfile` and `docker-compose.yml` at the repo root build this app using
Next's [standalone output](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output)
(`next.config.mjs` sets `output: 'standalone'`), which traces and bundles
only the server files actually needed — including the native `sharp`
module — into a small runtime image:

```bash
docker compose up --build   # from the repo root
# app available at http://localhost:3000
```

or without compose:

```bash
docker build -t pixa-web .
docker run -p 3000:3000 pixa-web
```

## Testing

End-to-end tests use Playwright and drive a real browser against the dev
server:

```bash
pnpm --filter @pixa/web exec playwright install --with-deps chromium  # once
pnpm --filter @pixa/web test
```

## Architecture

```
app/
  page.tsx                 — owns all editor state, wires ContentForm + StylePanel to the preview
  components/
    ContentForm.tsx        — content-type picker + per-type fields (url/wifi/vcard/email/sms/tel)
    StylePanel.tsx         — colors, shapes, logo/pattern/blend/frame toggles
    ImageDropzone.tsx       — drag-and-drop file → data URL, reused by every image upload
    QrPreview.tsx           — renders the live SVG
    DownloadButtons.tsx     — client-side SVG/PNG download (PNG via canvas, no server round-trip)
  error.tsx                 — App Router error boundary (defense-in-depth; page.tsx also catches
                               generateQR() throwing directly, e.g. on empty content)
lib/qr.ts                   — the only file that imports @pixa/core; everything else goes through it
```

If you're extending this UI, `lib/qr.ts` is the intended single seam
between this app and `@pixa/core` — route new usage through it rather than
importing `@pixa/core` directly from a new component, so there's one place
that knows about the underlying library's API.
