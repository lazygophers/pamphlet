# Sequence diagrams (Mermaid fence)

## What it is

The same diagram as [Sequence diagrams](/en/write/diagrams/sequence); only **how you write it** differs. This page uses a ` ```mermaid ` fence and writes [Mermaid](/en/write/diagrams/mermaid/) source directly.

## When to use it

- **The source goes to GitHub and you want the diagram to render there** — Pamphlet's own syntax shows up as plain text on GitHub
- You already know Mermaid and would rather not learn a second thing
- You need something the own syntax cannot express (the Traps section below says what)

Otherwise use [the own syntax](/en/write/diagrams/sequence): the field names are fixed, and a mistake is reported on the line it is on.

## How to write it

````markdown
```mermaid
sequenceDiagram
  participant Author
  participant Compiler
  Author->>Compiler: pamphlet build plan.md
  Compiler-->>Author: plan.html
```
````

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- `->>` solid is a request, `-->>` dashed is a reply
- Past five participants it stops being readable; split it
- Participant names may be non-Latin
