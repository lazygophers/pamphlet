# WaveDrom (not implemented yet)

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

## Where it stands

**The fence language `wavedrom` is recognised, but the engine is not written yet.** Using it reports `DIAG-301` ("no engine installed that can draw wavedrom") and **fails the build** — not a placeholder box, the whole compile stops.

The planned dependency shape is an npm library (`wavedrom`), optional like the other six: installing `@nekoleapuki/pamphlet-cli` gets you the compiler and no engines at all. [The other seven engines](/en/write/diagrams/others) explains why.

Until then, reach for the closest [Mermaid fence](/en/write/diagrams/mermaid/).

## Traps

- **Use the `wavedrom` library, not `wavedrom-cli`**: the CLI drags in `@jimp` / `gifwrap` / `@resvg`, about 19MB of raster-output dependencies, and Pamphlet only needs SVG
- The length of a `wave` string is the length of the time axis; signals that should line up must be the same length
- WaveJSON is relaxed JSON (unquoted keys), not quite standard JSON

> Source: [ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md)
