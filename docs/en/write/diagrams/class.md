# Class diagrams

## What it is

Classes, their fields and methods, and how they relate.

## When to use it

Data structures, interface hierarchies, which module depends on which.

## How to write it

Pamphlet's own syntax — **declarations first, relationships second**; all seventeen kinds share this skeleton:

````markdown
:::class[Theme data]
classes:
  Theme
  ThemeTokens
relations:
  Theme -> ThemeTokens : light / dark
:::
````

This syntax does not render on GitHub. If you need it to, write [the same diagram as a Mermaid fence](/en/write/diagrams/mermaid/class) instead.

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- The block names are fixed: `classes:` and `relations:`
- **Fields and methods cannot be listed**; only class-to-class relationships are drawn — use a Mermaid fence to list members
- Every relationship renders as a plain arrow; inheritance and composition arrows exist only in the fence syntax
- `{dir=...}` becomes Mermaid's `direction`, with `TD` rewritten to `TB`
