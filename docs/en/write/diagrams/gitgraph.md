# Branch graphs

## What it is

Where a branch came from and where it merged back.

## When to use it

Explaining a release branching strategy, reviewing a messy merge.

## How to write it

Pamphlet's own syntax — **declarations first, relationships second**; all seventeen kinds share this skeleton:

````markdown
:::gitgraph[One redesign]
commits:
  commit initial
  branch themes
  commit thirteen themes
  checkout main
  merge themes
:::
````

This syntax does not render on GitHub. If you need it to, write [the same diagram as a Mermaid fence](/en/write/diagrams/mermaid/gitgraph) instead.

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- There is one block: `commits:`
- One operation per line, and there are only four: `commit <name>` / `branch <name>` / `checkout <name>` / `merge <name>`. Anything else reports `DIAG-306`
- The compiler adds the quotes around a commit name
- Past ten commits it compresses into a line; draw only the ones that matter
