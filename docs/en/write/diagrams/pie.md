# Pie charts

## What it is

One whole split into slices, and how big each is.

## When to use it

Size breakdowns, cost shares, traffic sources.

## How to write it

Pamphlet's own syntax — **declarations first, relationships second**; all seventeen kinds share this skeleton:

````markdown
:::pie[Output size]
slices:
  diagram SVG : 48
  styles : 17
  body HTML : 12
  runtime : 9
:::
````

This syntax does not render on GitHub. If you need it to, write [the same diagram as a Mermaid fence](/en/write/diagrams/mermaid/pie) instead.

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- There is one block: `slices:`
- Each line is `name : value`; the value must be a number, and "a lot" reports `DIAG-306`
- The compiler adds the quotes around the name; you don't
- Nobody reads proportions past six slices; use a [table](/en/write/blocks/table)
