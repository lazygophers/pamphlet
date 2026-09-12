# Block diagrams

## What it is

Boxes laid out in rows and columns, gaps allowed. **It shows arrangement, not flow.**

## When to use it

Memory layout, protocol fields, how a page divides into regions.

## How to write it

Pamphlet's own syntax — **declarations first, relationships second**; all seventeen kinds share this skeleton:

````markdown
:::block[Three stages]{columns=3}
blocks:
  plan.md | - | plan.html
  parse | render | assemble
:::
````

This syntax does not render on GitHub. If you need it to, write [the same diagram as a Mermaid fence](/en/write/diagrams/mermaid/block) instead.

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- There is one block: `blocks:`
- One line is one row of cells, separated by `|`; write `-` or leave it empty for a blank cell
- `{columns=3}` sets how many cells a row holds; the default is 3
- It draws no arrows and implies no order; for order use a [flowchart](/en/write/diagrams/flowchart)
