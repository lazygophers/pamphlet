# Mind maps

## What it is

A tree radiating from one central word.

## When to use it

Sketching an outline, mapping the facets of a concept.

## How to write it

Pamphlet's own syntax — **declarations first, relationships second**; all seventeen kinds share this skeleton:

````````````markdown
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
````````````

That syntax does not render on GitHub. If you need it to, use this instead:

### The other way: a Mermaid fence

````````````markdown
`````````mermaid
mindmap
  root((Pamphlet))
    Syntax
      Directives
      Diagram fences
    Themes
      Palette
      Layout
`````````
````````````

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- **Indentation carries the hierarchy**; no arrows to draw
- `root((text))` takes double parentheses and renders as a circle
- Past three levels prefer a [list](/en/write/blocks/lists) — a mind map earns its keep by showing the whole at a glance
