# Flowcharts (Mermaid fence)

## What it is

The same diagram as [Flowcharts](/en/write/diagrams/flowchart); only **how you write it** differs. This page uses a ` ```mermaid ` fence and writes [Mermaid](/en/write/diagrams/mermaid/) source directly.

## When to use it

- **The source goes to GitHub and you want the diagram to render there** — Pamphlet's own syntax shows up as plain text on GitHub
- You already know Mermaid and would rather not learn a second thing
- You need something the own syntax cannot express (the Traps section below says what)

Otherwise use [the own syntax](/en/write/diagrams/flowchart): the field names are fixed, and a mistake is reported on the line it is on.

## How to write it

````markdown
```mermaid
flowchart LR
  A[request] --> B{in Redis?}
  B -->|yes| C[return it]
  B -->|no| D[query the database]
```
````

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- `LR` is left-to-right, `TD` top-down. Many nodes read better as `TD`; a few read flatter as `LR`
- `[box]` `(rounded)` `{diamond}` `[(cylinder)]` `([stadium])` each mean something — don't mix them arbitrarily
- **Fancy shapes like the trapezoid `[/text/]` blow up the SVG** (measured: 103KB for one diagram, 18KB after switching to rounded nodes)
