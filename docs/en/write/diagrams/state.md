# State diagrams

## What it is

Which states a thing can be in, and **what makes it move between them**.

## When to use it

Order status, connection lifecycle, an approval flow.

## How to write it

Pamphlet's own syntax — **declarations first, relationships second**; all seventeen kinds share this skeleton:

````markdown
:::state[Compile states]
states:
  parse = "parse"
  render = "render"
  assemble = "assemble"
transitions:
  parse -> render : has a diagram fence
  parse -> assemble : text only
  render -> assemble
:::
````

This syntax does not render on GitHub. If you need it to, write [the same diagram as a Mermaid fence](/en/write/diagrams/mermaid/state) instead.

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- The block names are fixed: `states:` and `transitions:`
- `{dir=...}` becomes Mermaid's `direction`; `TD` is rewritten to `TB` because Mermaid's state diagram only accepts `TB`
- Put the trigger after the colon: `idle -> busy : work arrives`. An unlabelled arrow never explains why the change happens
- **The start and end dots are not available here** — use `[*]` in a Mermaid fence if you need them
