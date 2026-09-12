# Flowcharts

## What it is

One thing running start to finish, with branches along the way. **The most used kind.**

## When to use it

Business processes, decision branches, the few hops of a request path.

## How to write it

Pamphlet's own syntax — **declarations first, relationships second**; all seventeen kinds share this skeleton:

````markdown
:::flow[Login path]{dir=LR}
nodes:
  request = "request"
  cache = diamond "in cache?"
  hit = "return it"
  miss = cylinder "query the database"
edges:
  request -> cache
  cache -> hit : yes
  cache -> miss : no
:::
````

This syntax does not render on GitHub. If you need it to, write [the same diagram as a Mermaid fence](/en/write/diagrams/mermaid/flowchart) instead.

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- The block names are fixed: `nodes:` and `edges:`. Missing one reports `DIAG-305`
- There are six shapes: `box` / `round` / `stadium` / `diamond` / `cylinder` / `circle`. Anything else reports `DIAG-307` and lists the ones that work
- A name in `edges:` that `nodes:` never declared reports `DIAG-306` — a typo in a name is the most common mistake
- `{dir=...}` accepts `LR` / `RL` / `TD` / `TB` / `BT` only; the default is `TD`
