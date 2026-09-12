# Gantt charts

## What it is

On one timeline: what starts when and runs how long.

## When to use it

A schedule, the timing of a release, the order of dependencies.

## How to write it

Pamphlet's own syntax — **declarations first, relationships second**; all seventeen kinds share this skeleton:

````markdown
:::gantt[Redesign schedule]
sections:
  Design
  Build
tasks:
  Design : Draft : 2026-03-02 : 5d
  Design : Review : after Draft : 2d
  Build : Compiler : after Review : 8d
:::
````

This syntax does not render on GitHub. If you need it to, write [the same diagram as a Mermaid fence](/en/write/diagrams/mermaid/gantt) instead.

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- The block names are fixed: `sections:` and `tasks:`
- A task line has four parts: `section : name : start : length`, e.g. `Design : pick an approach : 2026-03-02 : 5d`
- **The section name must be declared in `sections:`**, otherwise it reports `DIAG-306` and lists the ones that were
- Dates are always `YYYY-MM-DD`; `{axis=%m-%d}` controls how the axis is labelled
