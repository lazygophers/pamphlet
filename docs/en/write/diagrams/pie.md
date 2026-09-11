# Pie charts

## What it is

One whole split into slices, and how big each is.

## When to use it

Size breakdowns, cost shares, traffic sources.

## How to write it

````````````markdown
`````````mermaid
pie title Output size
  "diagram SVG" : 48
  "styles" : 17
  "body HTML" : 12
  "runtime" : 9
`````````
````````````

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- **Quote the labels**, or one containing a space breaks apart
- Slice colours follow the theme, but cycle through only four — **beyond four slices, neighbours may share a colour**, separated by the stroke
- Nobody reads proportions past six slices; use a [table](/en/write/blocks/table)
