# Branch graphs

## What it is

Where a branch came from and where it merged back.

## When to use it

Explaining a release branching strategy, reviewing a messy merge.

## How to write it

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
