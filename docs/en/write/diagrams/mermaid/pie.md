# Pie charts (Mermaid fence)

## What it is

The same diagram as [Pie charts](/en/write/diagrams/pie); only **how you write it** differs. This page uses a ` ```mermaid ` fence and writes [Mermaid](/en/write/diagrams/mermaid/) source directly.

## When to use it

- **The source goes to GitHub and you want the diagram to render there** — Pamphlet's own syntax shows up as plain text on GitHub
- You already know Mermaid and would rather not learn a second thing
- You need something the own syntax cannot express (the Traps section below says what)

Otherwise use [the own syntax](/en/write/diagrams/pie): the field names are fixed, and a mistake is reported on the line it is on.

## How to write it

````markdown
```mermaid
pie title Output size
  "diagram SVG" : 48
  "styles" : 17
  "body HTML" : 12
  "runtime" : 9
```
````

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- **Quote the labels**, or one containing a space breaks apart
- Slice colours follow the theme, but cycle through only four — **beyond four slices, neighbours may share a colour**, separated by the stroke
- Nobody reads proportions past six slices; use a [table](/en/write/blocks/table)
