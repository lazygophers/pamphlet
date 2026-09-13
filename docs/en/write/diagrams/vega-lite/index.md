# Vega-Lite

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

## Install it once

It does not come with Pamphlet — install it when you need it, and everyone else downloads nothing (约 26MB，纯 JS):

```bash
npm i -D @nekoleapuki/pamphlet-engine-vega-lite
```

Then confirm with `pamphlet doctor`:

```
✓ vega-lite（vega-lite）
```

**Using the fence without installing it**: you get `DIAG-301` and **the whole build fails** (no placeholder box), with that command in the hint.

Licence: BSD-3-Clause.

Put the data inline in `data.values`. An external URL is unreachable from a self-contained output — the artifact must open by double-click with no network.

## Traps

- **Use the `vega` + `vega-lite` libraries and `view.toSVG()`, not `vega-cli`**: the CLI drags in `canvas` (19MB, a native module that needs compiling and the kind CI most often fails to install), and Pamphlet only needs SVG
- Malformed JSON does not degrade gracefully; the whole diagram fails to draw
- Put the data inline in `values`; an external URL is unreachable from a self-contained output

> Sources: [ADR-0041](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0041-engines-are-separate-packages.md) (engines as separate packages), [ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md) (why these seven)
