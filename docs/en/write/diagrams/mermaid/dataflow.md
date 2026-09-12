# Data-flow diagrams (Mermaid fence)

## What it is

The same diagram as [Data-flow diagrams](/en/write/diagrams/dataflow); only **how you write it** differs. This page uses a ` ```mermaid ` fence and writes [Mermaid](/en/write/diagrams/mermaid/) source directly.

## When to use it

- **The source goes to GitHub and you want the diagram to render there** — Pamphlet's own syntax shows up as plain text on GitHub
- You already know Mermaid and would rather not learn a second thing
- You need something the own syntax cannot express (the Traps section below says what)

Otherwise use [the own syntax](/en/write/diagrams/dataflow): the field names are fixed, and a mistake is reported on the line it is on.

## How to write it

````markdown
```mermaid
flowchart LR
  Author[Author] -->|plan.md| P1(parse)
  P1 -->|AST| P2(render)
  P2 -->|SVG| P3(assemble)
  D1[(diagram cache)] --- P2
  P3 -->|plan.html| Reader[Reader]
```
````

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- **There is no dedicated syntax; use a [flowchart](/en/write/diagrams/flowchart)** and let shapes carry the roles
- The convention: **boxes** are external actors, **rounded** nodes are processes, **cylinders** are stores
- Edge labels are **the data flowing** (`plan.md`, `AST`), not the action
