# Entity-relationship diagrams

## What it is

How tables relate: one-to-one, one-to-many, many-to-many.

## When to use it

Database design, a domain model.

## How to write it

Pamphlet's own syntax — **declarations first, relationships second**; all seventeen kinds share this skeleton:

````````````markdown
:::er[A source file and its parts]
entities:
  SOURCE
  FENCE
  ASSET
relations:
  SOURCE -> FENCE : contains
  SOURCE -> ASSET : references
:::
````````````

That syntax does not render on GitHub. If you need it to, use this instead:

### The other way: a Mermaid fence

````````````markdown
`````````mermaid
erDiagram
  SOURCE ||--|| OUTPUT : compiles-to
  SOURCE ||--o{ FENCE : contains
  SOURCE ||--o{ ASSET : references
`````````
````````````

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- `||--||` one-to-one, `||--o{` one-to-many, `}o--o{` many-to-many
- After the colon goes **the name of the relationship** — a verb, not a noun
- Entity names may be non-Latin
