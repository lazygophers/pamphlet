# Installation

**You do not have to install it.**

```bash
npx @nekoleapuki/pamphlet-cli build plan.md
```

`npx` ships with npm and means "download this package, run it once, don't leave it on my machine". The first run spends a dozen seconds downloading (measured: 86 packages, 15 seconds); after that npx has its own cache.

## Installing it anyway

If you use it often, install it globally and the command is just `pamphlet`:

```bash
npm i -g @nekoleapuki/pamphlet-cli
pamphlet build plan.md
```

Or per project:

```bash
pnpm add -D @nekoleapuki/pamphlet-cli
```

:::info The package name and the command name differ
The npm package is `@nekoleapuki/pamphlet-cli`; the installed command is `pamphlet`.

It is not published as `pamphlet` because **that name was taken in 2018** (<https://www.npmjs.com/package/pamphlet>, latest 4.0.0). It is not an abandoned package and cannot be reclaimed.
:::

Installing gives you **the compiler only**. No diagram engine comes with it — text-only documents do not need them, and together they weigh about 340MB (see [The other seven diagram types](/en/write/diagrams/others)).

## If you want diagrams

This version implements exactly one engine, Mermaid, and it goes through a headless browser:

```bash
npm i -g mermaid-isomorphic playwright && npx playwright install chromium
```

About 150MB and a minute the first time, once. A text-only document never launches the browser. Why a real browser is unavoidable: [Mermaid](/en/write/diagrams/mermaid).

## Check what is installed

```bash
pamphlet doctor
```

Its messages are Chinese-only for now. Installed:

```
✓ mermaid（mermaid）
```

Not installed:

```
✗ mermaid（mermaid）：装一次就好：npm i -g mermaid-isomorphic playwright && npx playwright install chromium（首次约 150MB）
```

Any missing engine exits `3` (environment missing).

## Requirements

- **Node.js ≥ 20** (`engines.node` in `packages/pamphlet/package.json`)
- **No Java** — unless PlantUML lands one day; it is the only one of the seven engines that needs Java ≥ 11

## One thing to know before upgrading

**During 0.x only patch compatibility is promised.**

| Upgrade | Promise |
|---|---|
| `0.0.1 → 0.0.2` | **Breaks nothing** |
| `0.0 → 0.1` | **May break** syntax, CLI flags, the AST |

The first published version is **0.0.1**. This matches [what semantic versioning says about a zero major version](https://semver.org/#spec-item-4); it is not a rule Pamphlet invented.

**Check that your documents still compile on every minor upgrade**:

```bash
pamphlet lint "docs/**/*.md"
```

Put that in CI and it tells you immediately which document stopped compiling — see [Checking documents in CI](/en/howto/ci).

:::danger Three things explicitly unstable
- **The AST shape** (what `pamphlet ast` prints) — no compatibility promise during 0.x
- **CLI flags** — may be renamed or removed in a minor release
- **The plugin API** — likewise
:::

These three are exactly the parts that need the most adjustment early on. Freezing them at 0.1 (considered, rejected) would weld shut the parts most in need of change. The cost is real: it is unfriendly to early adopters. That cost was accepted in exchange for **being able to correct the syntax freely during 0.x**.

1.0 will revisit this, and should promise considerably more than patch compatibility.

> Source: [ADR-0006](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0006-versioning-promise.md)
