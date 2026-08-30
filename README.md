# pixa

Open-source, customizable QR code generator. Build brandable QR codes —
custom colors and shapes, a center logo, an image-colored pattern, a
background image blend, and a call-to-action frame — for URLs, Wi-Fi
credentials, contact cards, email/SMS/phone links, and plain text.

Static codes only: the content is encoded directly into the QR, with no
database, redirect server, or account required to generate one.

**Try it locally** in under a minute — see [Quick start](#quick-start) below.

## Why this repo is split into two packages

The generation engine and the web app are deliberately separate packages,
because they serve different audiences:

- **[`packages/core`](packages/core)** (`@pixa/core`) is the actual
  QR-generation logic: content encoding, styling, and rendering. It has zero
  dependency on React, Next.js, or any server framework — it's a plain
  TypeScript library with one function you call. If you want the *business
  logic* — the actual QR generation — in your own backend (NestJS, Express,
  Fastify, a serverless function, anything that runs Node), copy the
  package's source into your project, or depend on it as a normal npm
  dependency. See **[packages/core/README.md](packages/core/README.md)** for
  the full integration guide and API reference.
- **[`packages/web`](packages/web)** (`@pixa/web`) is the reference web
  editor: a Next.js app with a live-preview UI on top of `@pixa/core`. It's
  what you get if you just want to run pixa as a product, not embed it. See
  **[packages/web/README.md](packages/web/README.md)** for local dev and
  hosting instructions.

## Quick start

Requires [pnpm](https://pnpm.io) (`corepack enable` if you don't have it) and
Node 20+.

```bash
git clone git@github.com:oct8-studio/pixa.git
cd pixa
pnpm install
pnpm dev
```

Open `http://localhost:3000`. `pnpm dev` builds `@pixa/core` first, then
starts the web app's dev server.

## Repository layout

```
pixa/
  packages/
    core/     # @pixa/core — the portable QR-generation engine
    web/      # @pixa/web  — the Next.js reference editor
```

## Common commands (run from the repo root)

| Command       | What it does                                             |
| ------------- | --------------------------------------------------------- |
| `pnpm install`| Install all workspace dependencies                        |
| `pnpm dev`    | Build `@pixa/core`, then start the web app's dev server    |
| `pnpm build`  | Build every package                                        |
| `pnpm test`   | Run every package's test suite (core unit tests, web e2e) |
| `pnpm lint`   | Lint every package                                          |

## Contributing

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for the development workflow,
branch/commit conventions, and how to submit a change.

## License

MIT — see [LICENSE](LICENSE). Use it, copy it into your own product, modify
it, ship it commercially. Attribution appreciated but not required beyond
what the license text asks for.
