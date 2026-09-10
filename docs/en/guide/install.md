# Install

**No installation needed.**

```bash
npx @pamphlet/cli build plan.md
```

`npx` ships with npm and means "download this package, run it once, don't keep it around". The first run spends a few seconds downloading (measured: 86 packages, 15s); after that npx has its own cache.

## If you want it installed

For regular use, install globally — the command is then just `pamphlet`:

```bash
npm i -g @pamphlet/cli
pamphlet build plan.md
```

Or into a single project:

```bash
pnpm add -D @pamphlet/cli
```

:::info The package name and the command name differ
The npm package is `@pamphlet/cli`; the installed command is `pamphlet`.

It is not called `pamphlet` on npm because that name was taken by someone else back in 2018 (<https://www.npmjs.com/package/pamphlet>, currently at 4.0.0). It is not an abandoned package, so it cannot be reclaimed.
:::

That gives you **the compiler only**. No diagram engine ships with it — plain text documents do not need them, and together they weigh roughly **340MB** (see [diagram engines are all optional](/en/limits/engines)).

## First run

```bash
pamphlet build plan.md
```

You get `plan.html`. Artifacts are written next to the source document by default; double-click to open.

To see where the bytes went:

```bash
pamphlet build plan.md --verbose
```

It prints, part by part, how many bytes and how much gzipped the skeleton, styles, runtime, diagrams, fonts and images each take. Pamphlet sets no size gate; it just lays the bill out.

## If you want diagrams

This version **implements only the Mermaid engine**. `packages/pamphlet/src/diagrams/` contains only `mermaid.ts`; the other six engines are specified in [ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md) but not yet written. Writing a ` ```d2 ` fence gets you `DIAG-301`, "no engine installed that can draw d2".

Mermaid goes through a headless browser (Playwright + Chromium) because Mermaid needs a real browser's layout engine to measure text — jsdom does not implement `SVGTextElement.getBBox()`, and if you cannot measure how wide a run of text is, you cannot lay out the graph. This is not a preference; Mermaid org member @aloisklink said so explicitly (<https://github.com/mermaid-js/mermaid/issues/3886#issuecomment-1341694822>).

```bash
npm i -g mermaid-isomorphic playwright && npx playwright install chromium
```

About 150MB and about a minute, once. The cost lands on "install once", not "every use".

## Check what is installed

```bash
pamphlet doctor
```

It prints each engine's status. If any is missing the exit code is `3` (environment missing). Installed looks like:

```
✓ mermaid（mermaid）
```

Missing looks like:

```
✗ mermaid（mermaid）：装一次就好：npm i -g mermaid-isomorphic playwright && npx playwright install chromium（首次约 150MB）
```

## Requirements

- **Node.js ≥ 20** (`engines.node` in `packages/pamphlet/package.json`)
- **No Java needed** — unless you later use PlantUML, the only one of the seven engines that requires Java ≥ 11

## Before you upgrade

During 0.x, **only patch-level compatibility is promised**: `0.0.1 → 0.0.2` breaks nothing, `0.0 → 0.1` may break syntax, CLI flags and the AST. See [the versioning promise](/en/limits/versioning).
