# Gantt charts

## What it is

On one timeline: what starts when and runs how long.

## When to use it

A schedule, the timing of a release, the order of dependencies.

## How to write it

````````````markdown
`````````mermaid
gantt
  title Redesign schedule
  dateFormat YYYY-MM-DD
  axisFormat %m-%d
  section Design
  Draft the plan   :done, a1, 2026-03-02, 5d
  Review           :done, a2, after a1, 2d
  section Build
  Compiler changes :active, b1, after a2, 8d
`````````
````````````

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- `done` (grey), `active` (primary), `crit` (accent) for the critical path
- `after a1` chains to the previous task so you never compute dates by hand
- **`dateFormat X` (a plain numeric axis) lays out strangely**; real dates are safer
