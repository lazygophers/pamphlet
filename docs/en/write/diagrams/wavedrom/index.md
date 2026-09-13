# WaveDrom

## What it is

WaveDrom draws **digital timing diagrams** — clocks and signals going high and low over time, the kind of picture hardware and protocol documents are full of.

**Mermaid cannot do this at all.**

## What it draws

| What it draws | How |
|---|---|
| Timing waveforms | a `signal` array, one `wave` string per signal |

Bit-field diagrams (protocol packet layouts) are not its job; those belong to [bytefield-svg](/en/write/diagrams/bytefield).

## How to write it

The fence holds JSON (WaveJSON); one character of a `wave` string is one time slot:

````markdown
```wavedrom
{ signal: [{ name: "Alfa", wave: "01.zx=ud.23.456789" }] }
```
````

`.` means "hold the previous state", `0` and `1` are the levels, `x` is unknown and `z` is high impedance.

> Source: <https://wavedrom.com/tutorial.html>

## Install it once

It does not come with Pamphlet — install it when you need it, and everyone else downloads nothing (3.3MB，纯 JS):

```bash
npm i -D @nekoleapuki/pamphlet-engine-wavedrom
```

Then confirm with `pamphlet doctor`:

```
✓ wavedrom（wavedrom）
```

**Using the fence without installing it**: you get `DIAG-301` and **the whole build fails** (no placeholder box), with that command in the hint.

Licence: MIT.

Its three semantic colours (warning yellow, error red, success green) **deliberately do not follow the theme** — red, yellow and green should stay red, yellow and green in either mode. Each waveform therefore reports three `DIAG-304` warnings, and that is expected.

## Traps

- **Use the `wavedrom` library, not `wavedrom-cli`**: the CLI drags in `@jimp` / `gifwrap` / `@resvg`, about 19MB of raster-output dependencies, and Pamphlet only needs SVG
- The length of a `wave` string is the length of the time axis; signals that should line up must be the same length
- WaveJSON is relaxed JSON (unquoted keys), not quite standard JSON

> Sources: [ADR-0041](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0041-engines-are-separate-packages.md) (engines as separate packages), [ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md) (why these seven)
