# Mermaid (the drawing engine)

## What it is

**Every diagram above is drawn by it.** Mermaid turns text into pictures, and it is the **only engine implemented** in this version.

One fence language, `mermaid`; the first keyword decides which kind of diagram you get.

## Install it once

```bash
npm i -g mermaid-isomorphic playwright && npx playwright install chromium
```

About 150MB and a minute the first time. Confirm with `pamphlet doctor`:

```
✓ mermaid (mermaid)
```

## Why a browser has to be downloaded

Because **Mermaid needs a real browser's layout engine to measure text**.

jsdom (a pure-JavaScript fake browser) does not implement `SVGTextElement.getBBox()` — without knowing how wide a run of text is, there is no way to lay out the shapes around it.

This is not a preference. Mermaid organisation member @aloisklink ruled out the jsdom approach explicitly: <https://github.com/mermaid-js/mermaid/issues/3886#issuecomment-1341694822>

The cost lands on "install once", not "every run".

## The browser starts lazily

**A text-only document never launches it.** It starts only when a ` ```mermaid ` fence is actually encountered.

Measured:

| Case | Time |
|---|---|
| 1st diagram (including browser cold start) | 733ms |
| Each one after | 364ms |
| A 40-node diagram | 412ms |

The `DIAG-303` timeout is **10 seconds**, roughly 13× the worst measured case.

## Which kinds it draws

Thirteen. **Each has two pages**: one for Pamphlet's own syntax and one for the Mermaid fence syntax described here. They draw the same diagram.

| What it draws | Own syntax | The Mermaid fence |
|---|---|---|
| Flowcharts | [`:::flow`](/en/write/diagrams/flowchart) | [fence syntax](/en/write/diagrams/mermaid/flowchart) |
| Sequence diagrams | [`:::sequence`](/en/write/diagrams/sequence) | [fence syntax](/en/write/diagrams/mermaid/sequence) |
| State diagrams | [`:::state`](/en/write/diagrams/state) | [fence syntax](/en/write/diagrams/mermaid/state) |
| Class diagrams | [`:::class`](/en/write/diagrams/class) | [fence syntax](/en/write/diagrams/mermaid/class) |
| Entity-relationship diagrams | [`:::er`](/en/write/diagrams/er) | [fence syntax](/en/write/diagrams/mermaid/er) |
| Gantt charts | [`:::gantt`](/en/write/diagrams/gantt) | [fence syntax](/en/write/diagrams/mermaid/gantt) |
| Pie charts | [`:::pie`](/en/write/diagrams/pie) | [fence syntax](/en/write/diagrams/mermaid/pie) |
| Architecture diagrams | [`:::architecture`](/en/write/diagrams/architecture) | [fence syntax](/en/write/diagrams/mermaid/architecture) |
| System context diagrams | [`:::c4`](/en/write/diagrams/c4) | [fence syntax](/en/write/diagrams/mermaid/c4) |
| Data-flow diagrams | [`:::dataflow`](/en/write/diagrams/dataflow) | [fence syntax](/en/write/diagrams/mermaid/dataflow) |
| Mind maps | [`:::mindmap`](/en/write/diagrams/mindmap) | [fence syntax](/en/write/diagrams/mermaid/mindmap) |
| Git branch diagrams | [`:::gitgraph`](/en/write/diagrams/gitgraph) | [fence syntax](/en/write/diagrams/mermaid/gitgraph) |
| Block diagrams | [`:::block`](/en/write/diagrams/block) | [fence syntax](/en/write/diagrams/mermaid/block) |

### They render, but imperfectly

`timeline` / `quadrantChart` / `journey` / `packet-beta` / `radar-beta` / `xychart-beta` draw, but **a few colours do not follow the theme** and they report `DIAG-304`. The engine computes those colours from the primary colour, and the computed values are neither our sentinels nor caught by the substitution.

### Two colours it hard-codes

The state diagram's edge-label colour (`red`) and the Gantt separator (`navy`) are written into Mermaid's own per-kind stylesheets and **cannot be substituted with theme variables**, so every build reports two `DIAG-304` warnings.

They are **real warnings, not noise**: in dark mode that `navy` rule is nearly invisible. Leaving them reported is how we find out the day Mermaid changes its defaults.

### Two kinds reject non-ASCII labels

The parsers for `sankey-beta` and `requirementDiagram` **only accept ASCII identifiers**; CJK node names fail outright with `DIAG-303`. Verified against mermaid 11.17.2.

For flow quantities, use a [flowchart](/en/write/diagrams/flowchart) and put the numbers on the edge labels.

## When the source is wrong

You get `DIAG-303`, and the hint suggests pasting the source into <https://mermaid.live> — Mermaid's own editor, whose errors are clearer than a command line's.

**The output is still written when a diagram fails**: a placeholder box explains the reason in its place, the rest of the document is fine, and the exit code is `1`.


## CI needs one extra step

The image needs Chromium and its system dependencies:

```bash
npx playwright install --with-deps chromium
```

See [checking docs in CI](/howto/ci) for a full CI configuration.

> Source: [ADR-0004](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0004-mermaid-via-headless-browser.md)
