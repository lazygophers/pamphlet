# bytefield-svg (not implemented yet)

## What it is

bytefield-svg draws **bit-field diagrams**: which bytes of a protocol packet or a memory layout mean what.

**Mermaid cannot do this at all.** It is pure JavaScript — no browser and no Java.

## What it draws

| What it draws | How |
|---|---|
| Protocol packet layouts | one cell per byte, one `draw-box` per cell |
| Memory layouts | the same, with `draw-gap` for an elided stretch |

## How to write it

The fence holds its own DSL (it looks like Clojure because it is Clojure):

````markdown
```bytefield
(draw-column-headers)
(draw-box "Address" {:span 4})
(draw-box "Size" {:span 2})
(draw-box 0 {:span 2})
(draw-gap "Payload")
(draw-bottom)
```
````

`{:span 4}` makes a cell four bytes wide; `draw-column-headers` draws the byte numbers along the top and is not drawn unless you ask.

> Source: <https://bytefield-svg.deepsymmetry.org/bytefield-svg/1.11.0/intro.html>

## Where it stands

**The fence language `bytefield` is recognised, but the engine is not written yet.** Using it reports `DIAG-301` ("no engine installed that can draw bytefield") and **fails the build** — not a placeholder box, the whole compile stops.

The planned dependency shape is npm, pure JS, optional like the other six: installing `@nekoleapuki/pamphlet-cli` gets you the compiler and no engines at all. [The other seven engines](/en/write/diagrams/others) explains why.

Until then, reach for the closest [Mermaid fence](/en/write/diagrams/mermaid/).

## Traps

- **`(draw-bottom)` must come last**, otherwise the bottom border is missing
- A row holds sixteen bytes by default; change it with `(def boxes-per-row 4)`
- A bare number renders as two hex digits — deliberately, to remind you it is one byte

> Source: [ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md)
