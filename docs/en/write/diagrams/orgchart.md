# Org charts

## What it is

A hierarchy, drawn top-down.

## When to use it

Team structure or module ownership. Drawn as a flowchart, deep hierarchies sprawl sideways.

## How to write it

Pamphlet's own syntax — **declarations first, relationships second**; all seventeen kinds share this skeleton:

````````````markdown
:::orgchart[Engineering]
members:
  Engineering
  > Frontend
  >> Alice
  >> Bob
  > Backend
  >> Carol
:::
````````````

**Mermaid cannot draw this kind**, so there is no "other way" — Pamphlet lays it out and emits the SVG itself.

## What comes out

Drawn at compile time and inlined, so the reader downloads no drawing library and makes no network request. Colours come from the six diagram variables (`--pf-diagram-bg` / `line` / `fill` / `text` / `accent` / `muted`), so they follow the theme.

Text width is **estimated per character** (CJK characters count as one em, everything else as 0.55) rather than measured in a real font — which is what lets this kind compile **without a browser**.

## Traps

- Depth is the number of `>`, the same convention as [mind maps](/en/write/diagrams/mindmap)
- Horizontal space is allocated by subtree width, so siblings never overlap
- Finish one tree before starting the next: several roots are allowed
