# Data charts

## What it is

A small table of numbers drawn as bars or a line.

## When to use it

Showing a trend or a comparison. Mermaid's `xychart-beta` can draw one, but its colours do not follow the theme and it reports `DIAG-304`.

## How to write it

Pamphlet's own syntax — **declarations first, relationships second**; all seventeen kinds share this skeleton:

````markdown
:::chart[Monthly requests]{type=bar}
points:
  January : 120
  February : 180
  March : 150
:::
````

**Mermaid cannot draw this kind**, so there is no "other way" — Pamphlet lays it out and emits the SVG itself.

## What comes out

Drawn at compile time and inlined, so the reader downloads no drawing library and makes no network request. Colours come from the six diagram variables (`--pf-diagram-bg` / `line` / `fill` / `text` / `accent` / `muted`), so they follow the theme.

Text width is **estimated per character** (CJK characters count as one em, everything else as 0.55) rather than measured in a real font — which is what lets this kind compile **without a browser**.

## Traps

- `{type=bar}` for bars, `{type=line}` for a line; anything else reports `DIAG-307`
- One `label : value` per line; a non-numeric value reports `DIAG-306`
- The y-axis maximum is the largest value in the data — no rounding up to a "nice" number
