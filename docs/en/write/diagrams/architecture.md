# Architecture diagrams

## What it is

Which parts a system is made of and **how they connect**, with built-in cloud, database, disk and server icons.

## When to use it

Deployment architecture, what a system is composed of.

## How to write it

Pamphlet's own syntax — **declarations first, relationships second**; all seventeen kinds share this skeleton:

````markdown
:::architecture[Build stage]
services:
  src = disk "Source"
  engine = server "Diagram engine"
  out = database "Output"
links:
  src -- engine
  engine -- out
:::
````

This syntax does not render on GitHub. If you need it to, write [the same diagram as a Mermaid fence](/en/write/diagrams/mermaid/architecture) instead.

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- The block names are fixed: `services:` and `links:`
- A service line is `id = icon "label"`; the icon name goes straight to Mermaid — `cloud` / `database` / `disk` / `server` / `internet`, defaulting to `server`
- Write a link as `a -- b`; which edge it leaves from is chosen for you (always `R` to `L`)
- **Groups (`group`) are not available here** — use a Mermaid fence for those
