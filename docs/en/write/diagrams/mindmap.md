# Mind maps

## What it is

A tree radiating from one central word.

## When to use it

Sketching an outline, mapping the facets of a concept.

## How to write it

Pamphlet's own syntax — **declarations first, relationships second**; all seventeen kinds share this skeleton:

````markdown
:::mindmap[What Pamphlet is made of]
root:
  Pamphlet
branches:
  > Syntax
  >> Directives
  >> Diagram fences
  > Themes
  >> Palette
  >> Layout
:::
````

This syntax does not render on GitHub. If you need it to, write [the same diagram as a Mermaid fence](/en/write/diagrams/mermaid/mindmap) instead.

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- The block names are fixed: `root:` and `branches:`
- Inside `branches:`, **the number of `>` marks** is the level: one `>` is the first level, `>>` the second
- The root renders as a circle; you don't write the parentheses
- Past three levels prefer a [list](/en/write/blocks/lists) — a mind map earns its keep by showing the whole at a glance
