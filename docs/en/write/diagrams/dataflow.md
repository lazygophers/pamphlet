# Data-flow diagrams

## What it is

Where **data** comes from, which steps transform it, where it is stored, and who finally gets it.

## When to use it

A data pipeline, the handling of one request.

## How to write it

Pamphlet's own syntax — **declarations first, relationships second**; all seventeen kinds share this skeleton:

````````````markdown
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
````````````

That syntax does not render on GitHub. If you need it to, use this instead:

### The other way: a Mermaid fence

````````````markdown
`````````mermaid
flowchart LR
  Author[Author] -->|plan.md| P1(parse)
  P1 -->|AST| P2(render)
  P2 -->|SVG| P3(assemble)
  D1[(diagram cache)] --- P2
  P3 -->|plan.html| Reader[Reader]
`````````
````````````

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- **There is no dedicated syntax; use a [flowchart](/en/write/diagrams/flowchart)** and let shapes carry the roles
- The convention: **boxes** are external actors, **rounded** nodes are processes, **cylinders** are stores
- Edge labels are **the data flowing** (`plan.md`, `AST`), not the action
