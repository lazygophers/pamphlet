# Gantt charts (Mermaid fence)

## What it is

The same diagram as [Gantt charts](/en/write/diagrams/gantt); only **how you write it** differs. This page uses a ` ```mermaid ` fence and writes [Mermaid](/en/write/diagrams/mermaid/) source directly.

## When to use it

- **The source goes to GitHub and you want the diagram to render there** — Pamphlet's own syntax shows up as plain text on GitHub
- You already know Mermaid and would rather not learn a second thing
- You need something the own syntax cannot express (the Traps section below says what)

Otherwise use [the own syntax](/en/write/diagrams/gantt): the field names are fixed, and a mistake is reported on the line it is on.

## How to write it

````markdown
```mermaid
gantt
  title Redesign schedule
  dateFormat YYYY-MM-DD
  axisFormat %m-%d
  section Design
  Draft the plan   :done, a1, 2026-03-02, 5d
  Review           :done, a2, after a1, 2d
  section Build
  Compiler changes :active, b1, after a2, 8d
```
````

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- `done` (grey), `active` (primary), `crit` (accent) for the critical path
- `after a1` chains to the previous task so you never compute dates by hand
- **`dateFormat X` (a plain numeric axis) lays out strangely**; real dates are safer
