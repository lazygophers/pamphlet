# Vega-Lite (not implemented yet)

## What it is

Vega-Lite is a grammar for data visualisation: **you describe the data and the mapping, and it decides how to draw**.

Mermaid does have bar and line charts (`xychart-beta`), but they are weak, and their colours are computed by the engine — neither our sentinels nor caught by substitution — so they report `DIAG-304` every time. That is precisely why [charts](/en/write/diagrams/chart) are self-drawn.

## What it draws

| What it draws | `mark` value |
|---|---|
| Bar chart | `bar` |
| Line chart | `line` |
| Scatter plot | `point` |
| Area chart | `area` |
| Heatmap | `rect` |

One fence language draws all of them; only the `mark` field changes.

## How to write it

The fence holds JSON:

````markdown
```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "data": {
    "values": [
      {"a": "A", "b": 28}, {"a": "B", "b": 55}, {"a": "C", "b": 43}
    ]
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "a", "type": "nominal"},
    "y": {"field": "b", "type": "quantitative"}
  }
}
```
````

`type` inside `encoding` has four values: `nominal`, `ordinal`, `quantitative` and `temporal`.

> Source: <https://vega.github.io/vega-lite/examples/bar.html>

## Where it stands

**The fence language `vega-lite` is recognised, but the engine is not written yet.** Using it reports `DIAG-301` ("no engine installed that can draw vega-lite") and **fails the build** — not a placeholder box, the whole compile stops.

The planned dependency shape is npm libraries (`vega` + `vega-lite`), optional like the other six: installing `@nekoleapuki/pamphlet-cli` gets you the compiler and no engines at all. [The other seven engines](/en/write/diagrams/others) explains why.

Until then, reach for the closest [Mermaid fence](/en/write/diagrams/mermaid/).

## Traps

- **Use the `vega` + `vega-lite` libraries and `view.toSVG()`, not `vega-cli`**: the CLI drags in `canvas` (19MB, a native module that needs compiling and the kind CI most often fails to install), and Pamphlet only needs SVG
- Malformed JSON does not degrade gracefully; the whole diagram fails to draw
- Put the data inline in `values`; an external URL is unreachable from a self-contained output

> Source: [ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md)
