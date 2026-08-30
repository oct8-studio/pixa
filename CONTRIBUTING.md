# Contributing to pixa

Thanks for considering it. This is a small, young project — the bar for
contributing is "does it work and is it tested," not a heavyweight process.

## Development setup

Requires [pnpm](https://pnpm.io) (`corepack enable` if you don't have it)
and Node 20+.

```bash
git clone git@github.com:oct8-studio/pixa.git
cd pixa
pnpm install
pnpm dev
```

See the root [README](README.md) for the full command list, and each
package's own README ([core](packages/core/README.md),
[web](packages/web/README.md)) for package-specific details.

## Branching model

- **`dev`** is the integration branch — all work merges here first.
  There's no `main`/`master`.
- **`release`** is cut from `dev` for deploys (if/when this project starts
  doing releases beyond continuous deployment of `dev`).
- Branch names are free-form but descriptive — `feature/<what>`,
  `fix/<what>`, `docs/<what>` are what's been used so far.
- Open your PR against `dev`, not `release`.

## Commit messages

This repo uses `type(scope): short description` — look at `git log` for
plenty of real examples. Common types: `feat`, `fix`, `chore`, `docs`,
`test`, `refactor`. `scope` is usually the package or area touched (`core`,
`web`). Not strictly enforced by tooling, just the house style — please
follow it so `git log` stays scannable.

## Before opening a PR

```bash
pnpm install
pnpm build   # both packages must build clean
pnpm test    # both packages' test suites must pass
```

## Testing philosophy — read this before touching QR styling/rendering code

`@pixa/core`'s test suite is stricter than "does the SVG string look
right," on purpose. Any change that affects rendering (new shape, new
styling feature, anything touching `render/` or `style/`) needs a **real
scan round-trip test**, not just an assertion on the generated SVG/PNG's
structure:

```ts
async function decode(png: Buffer): Promise<string | null> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const result = jsQR(new Uint8ClampedArray(data), info.width, info.height)
  return result?.data ?? null
}
```

This isn't theoretical caution — during this project's development, two
real scan-breaking bugs were caught *only* by this kind of test, after
visual inspection said everything looked fine:

1. A styling change that colored QR modules from an uploaded image could
   wash a module out to near-invisibility against the background when that
   region of the image was light/white — breaking real scans, invisible in
   a quick look at the rendered SVG.
2. A rendering-order bug where an "eye" (finder pattern) overlay silently
   erased its own center dot, because SVG circles are filled disks and a
   redundant redraw painted over something drawn just before it.

If you're adding a styling feature: write the round-trip test with a real
generated image that has variation in it (a plain solid color often won't
catch contrast bugs — see `LIGHT_QUADRANT_PNG_DATA_URL` in
`packages/core/src/generate-qr.test.ts` for the fixture that caught bug #1
above), and test it in combination with at least one other existing
feature (logo + your new thing, ring eyes + your new thing), not only in
isolation — bug #2 above only showed up when two features were combined.

## Code style

- No unnecessary comments — code should read clearly from naming; comments
  earn their place by explaining a non-obvious *why* (a safety constraint,
  a workaround, an invariant), not restating *what* the code does.
- Don't add abstractions, config options, or generality beyond what the
  current change needs (YAGNI). Three similar lines beat a premature
  shared helper.
- Match the existing file structure: `content/` → `matrix/` → `style/` →
  `render/` in `@pixa/core` is a deliberate pipeline of pure functions — new
  content types go in `content/`, new rendering features go in `render/`,
  etc.

## Reporting bugs / requesting features

Open a GitHub issue. For a scanning/rendering bug, a copy of the exact
`StyleOptions`/`QRContent` you used (or a screenshot of the web editor's
state) is the single most useful thing to include — it's usually enough to
reproduce directly as a test case.
