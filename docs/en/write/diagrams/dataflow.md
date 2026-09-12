# Data-flow diagrams

## What it is

Where **data** comes from, which steps transform it, where it is stored, and who finally gets it.

## When to use it

A data pipeline, the handling of one request.

## How to write it

Pamphlet's own syntax — **declarations first, relationships second**; all seventeen kinds share this skeleton:

````markdown
:::dataflow[Compiling a document]
nodes:
  author = "Author"
  parse = round "parse"
  render = round "render"
  cache = cylinder "diagram cache"
  reader = "Reader"
flows:
  author -> parse : plan.md
  parse -> render : AST
  cache -> render
  render -> reader : plan.html
:::
````

This syntax does not render on GitHub. If you need it to, write [the same diagram as a Mermaid fence](/en/write/diagrams/mermaid/dataflow) instead.

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- The block names are fixed: `nodes:` and `flows:` — note it is `flows:` here, not the flowchart's `edges:`
- The six shapes are shared with [flowcharts](/en/write/diagrams/flowchart): **`box`** for external actors, **`round`** for processes, **`cylinder`** for stores
- Edge labels are **the data flowing** (`plan.md`, `AST`), not the action
- Without `{dir=...}` the default is `LR`, unlike the flowchart's `TD`
