# Entity-relationship diagrams

## What it is

How tables relate: one-to-one, one-to-many, many-to-many.

## When to use it

Database design, a domain model.

## How to write it

Pamphlet's own syntax — **declarations first, relationships second**; all seventeen kinds share this skeleton:

````markdown
:::er[A source file and its parts]
entities:
  SOURCE
  FENCE
  ASSET
relations:
  SOURCE -> FENCE : contains
  SOURCE -> ASSET : references
:::
````

This syntax does not render on GitHub. If you need it to, write [the same diagram as a Mermaid fence](/en/write/diagrams/mermaid/er) instead.

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- The block names are fixed: `entities:` and `relations:`
- **Every relationship renders as one-to-many (`||--o{`)** — use a Mermaid fence for one-to-one or many-to-many
- An entity that takes part in no relationship is still drawn; it does not vanish
- After the colon goes the name of the relationship — a verb, not a noun
