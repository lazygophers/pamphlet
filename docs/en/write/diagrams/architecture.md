# Architecture diagrams

## What it is

Which parts a system is made of and **how they connect**, with built-in cloud, database, disk and server icons.

## When to use it

Deployment architecture, what a system is composed of.

## How to write it

Pamphlet's own syntax — **declarations first, relationships second**; all seventeen kinds share this skeleton:

````````````markdown
:::architecture[Build stage]
services:
  src = disk "Source"
  engine = server "Diagram engine"
  out = database "Output"
links:
  src -- engine
  engine -- out
:::
````````````

That syntax does not render on GitHub. If you need it to, use this instead:

### The other way: a Mermaid fence

````````````markdown
`````````mermaid
architecture-beta
  group build(cloud)[Build stage]
  service src(disk)[Source] in build
  service engine(server)[Diagram engine] in build
  service out(database)[Output] in build
  src:R -- L:engine
  engine:R -- L:out
`````````
````````````

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- **IDs must be ASCII** (`src` in `service src(disk)[Source]`); the label in brackets can be anything
- The name in parentheses is the icon: `cloud` `database` `disk` `server` `internet` ship built in
- In `src:R -- L:engine`, `R` `L` `T` `B` pick which edge the line leaves from
