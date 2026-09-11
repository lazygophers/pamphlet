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

Thirteen, one page each:

[Flowcharts](/en/write/diagrams/flowchart) · [Sequence](/en/write/diagrams/sequence) · [State](/en/write/diagrams/state) · [Class](/en/write/diagrams/class) · [ER](/en/write/diagrams/er) · [Gantt](/en/write/diagrams/gantt) · [Pie](/en/write/diagrams/pie) · [Architecture](/en/write/diagrams/architecture) · [System context](/en/write/diagrams/c4) · [Data flow](/en/write/diagrams/dataflow) · [Mind maps](/en/write/diagrams/mindmap) · [Branch graphs](/en/write/diagrams/gitgraph) · [Block](/en/write/diagrams/block)

### They render, but imperfectly

`timeline` / `quadrantChart` / `journey` / `packet-beta` / `radar-beta` / `xychart-beta` draw, but **a few colours do not follow the theme** and they report `DIAG-304`. The engine computes those colours from the primary colour, and the computed values are neither our sentinels nor caught by the substitution.

### Two kinds reject non-ASCII labels

The parsers for `sankey-beta` and `requirementDiagram` **only accept ASCII identifiers**; CJK node names fail outright with `DIAG-303`. Verified against mermaid 11.17.2.

For flow quantities, use a [flowchart](/en/write/diagrams/flowchart) and put the numbers on the edge labels.

## When the source is wrong

You get `DIAG-303`, and the hint suggests pasting the source into <https://mermaid.live> — Mermaid's own editor, whose errors are clearer than a command line's.

**The output is still written when a diagram fails**: a placeholder box explains the reason in its place, the rest of the document is fine, and the exit code is `1`.

