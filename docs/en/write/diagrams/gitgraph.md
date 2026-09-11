# Branch graphs

## What it is

Where a branch came from and where it merged back.

## When to use it

Explaining a release branching strategy, reviewing a messy merge.

## How to write it

Pamphlet's own syntax — **declarations first, relationships second**; all seventeen kinds share this skeleton:

````````````markdown
:::gitgraph[One redesign]
commits:
  commit initial
  branch themes
  commit thirteen themes
  checkout main
  merge themes
:::
````````````

That syntax does not render on GitHub. If you need it to, use this instead:

### The other way: a Mermaid fence

````````````markdown
`````````mermaid
gitGraph
  commit id: "initial"
  branch themes
  commit id: "thirteen themes"
  checkout main
  merge themes
`````````
````````````

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- `branch` forks, `checkout` switches back, `merge` merges
- The string after `id:` needs quotes
- Past ten commits it compresses into a line; draw only the ones that matter
