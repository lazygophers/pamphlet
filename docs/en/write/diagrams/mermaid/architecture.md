# Architecture diagrams (Mermaid fence)

## What it is

The same diagram as [Architecture diagrams](/en/write/diagrams/architecture); only **how you write it** differs. This page uses a ` ```mermaid ` fence and writes [Mermaid](/en/write/diagrams/mermaid/) source directly.

## When to use it

- **The source goes to GitHub and you want the diagram to render there** — Pamphlet's own syntax shows up as plain text on GitHub
- You already know Mermaid and would rather not learn a second thing
- You need something the own syntax cannot express (the Traps section below says what)

Otherwise use [the own syntax](/en/write/diagrams/architecture): the field names are fixed, and a mistake is reported on the line it is on.

## How to write it

````markdown
```mermaid
architecture-beta
  group build(cloud)[Build stage]
  service src(disk)[Source] in build
  service engine(server)[Diagram engine] in build
  service out(database)[Output] in build
  src:R -- L:engine
  engine:R -- L:out
```
````

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- **IDs must be ASCII** (`src` in `service src(disk)[Source]`); the label in brackets can be anything
- The name in parentheses is the icon: `cloud` `database` `disk` `server` `internet` ship built in
- In `src:R -- L:engine`, `R` `L` `T` `B` pick which edge the line leaves from
