# Network topology

## What it is

Which hosts sit in which network zones, and how they connect.

## When to use it

Documenting infrastructure: Mermaid's architecture diagram has a fixed icon set and no notion of a zone.

## How to write it

Pamphlet's own syntax — **declarations first, relationships second**; all seventeen kinds share this skeleton:

````markdown
:::topology[Production]
zones:
  dmz = "DMZ"
  app = "App subnet"
hosts:
  lb = dmz "load balancer"
  web1 = app "web-01"
  web2 = app "web-02"
links:
  lb -- web1 : 443
  lb -- web2 : 443
:::
````

**Mermaid cannot draw this kind**, so there is no "other way" — Pamphlet lays it out and emits the SVG itself.

## What comes out

Drawn at compile time and inlined, so the reader downloads no drawing library and makes no network request. Colours come from the six diagram variables (`--pf-diagram-bg` / `line` / `fill` / `text` / `accent` / `muted`), so they follow the theme.

Text width is **estimated per character** (CJK characters count as one em, everything else as 0.55) rather than measured in a real font — which is what lets this kind compile **without a browser**.

## Traps

- The "shape" slot on a host line is **which zone it belongs to**: `lb = dmz "load balancer"`
- `links:` is optional — leave it out to draw just zones and hosts
- A link label goes after `:`, usually a port
