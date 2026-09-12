# Sequence diagrams

## What it is

Several participants passing messages back and forth **in time order**.

## When to use it

Call order across services, a handshake, anywhere "who goes first" is unclear.

## How to write it

Pamphlet's own syntax — **declarations first, relationships second**; all seventeen kinds share this skeleton:

````markdown
:::sequence[One compile]
participants:
  author = "Author"
  compiler = "Compiler"
messages:
  author -> compiler : pamphlet build plan.md
  compiler --> author : plan.html
:::
````

This syntax does not render on GitHub. If you need it to, write [the same diagram as a Mermaid fence](/en/write/diagrams/mermaid/sequence) instead.

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- The block names are fixed: `participants:` and `messages:`
- `->` is a solid request, `-->` a dashed reply — they mean different things
- The message text goes after the colon: `author -> compiler : build`
- A participant used in a message but never declared reports `DIAG-306`
