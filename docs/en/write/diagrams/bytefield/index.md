# bytefield-svg

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

## Install it once

It does not come with Pamphlet — install it when you need it, and everyone else downloads nothing (2.1MB，七个里体积最小的):

```bash
npm i -D @nekoleapuki/pamphlet-engine-bytefield
```

Then confirm with `pamphlet doctor`:

```
✓ bytefield（bytefield）
```

**Using the fence without installing it**: you get `DIAG-301` and **the whole build fails** (no placeholder box), with that command in the hint.

Licence: EPL-2.0.

Seven border lines end up using the text colour rather than the line colour: their defaults are hard-coded in its source where the DSL cannot reach. They still follow the theme; only the semantics are slightly off.

## Traps

- **`(draw-bottom)` must come last**, otherwise the bottom border is missing
- A row holds sixteen bytes by default; change it with `(def boxes-per-row 4)`
- A bare number renders as two hex digits — deliberately, to remind you it is one byte

> Sources: [ADR-0041](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0041-engines-are-separate-packages.md) (engines as separate packages), [ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md) (why these seven)
