# Swimlane diagrams

## What it is

A process split into horizontal lanes by who owns each step.

## When to use it

Cross-team or cross-service processes, where "who does this step" is the point.

## How to write it

Pamphlet's own syntax — **declarations first, relationships second**; all seventeen kinds share this skeleton:

````markdown
:::swimlane[Checkout]
lanes:
  user = "User"
  order = "Order service"
  pay = "Payment service"
steps:
  user : place order
  order : reserve stock
  pay : charge
  order : confirm
:::
````

**Mermaid cannot draw this kind**, so there is no "other way" — Pamphlet lays it out and emits the SVG itself.

## What comes out

Drawn at compile time and inlined, so the reader downloads no drawing library and makes no network request. Colours come from the six diagram variables (`--pf-diagram-bg` / `line` / `fill` / `text` / `accent` / `muted`), so they follow the theme.

Text width is **estimated per character** (CJK characters count as one em, everything else as 0.55) rather than measured in a real font — which is what lets this kind compile **without a browser**.

## Traps

- One line per lane under `lanes:`; steps are written `lane : what happens`
- Steps are laid out left to right **in the order you write them**, with arrows joining consecutive ones
- An unknown lane name reports `DIAG-306` and lists the lanes you declared
