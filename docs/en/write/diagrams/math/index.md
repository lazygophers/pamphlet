# MathJax (not implemented yet)

## What it is

MathJax typesets TeX maths. **Mermaid has nothing like it** — it cannot draw a single formula.

MathJax v3 was chosen over the faster KaTeX for one reason: KaTeX emits HTML + CSS rather than SVG by default (<https://katex.org/>), and this pipeline needs "turned into inline SVG at compile time".

## What it draws

| What it draws | How |
|---|---|
| Display equations | a ` ```math ` fence containing standard TeX |

That is the only kind. **There is no inline maths** — see Traps below.

## How to write it

````markdown
```math
E = mc^2
```
````

What goes in the fence is ordinary TeX, the same as in a paper.

## Where it stands

**The fence language `math` is recognised, but the engine is not written yet.** Using it reports `DIAG-301` ("no engine installed that can draw math") and **fails the build** — not a placeholder box, the whole compile stops.

The planned dependency shape is npm, pure JS, emits SVG natively, optional like the other six: installing `@nekoleapuki/pamphlet-cli` gets you the compiler and no engines at all. [The other seven engines](/en/write/diagrams/others) explains why.

Until then, reach for the closest [Mermaid fence](/en/write/diagrams/mermaid/).

## Traps

- **Inline `$E=mc^2$` is not supported.** `$` is everywhere in technical writing (`$ npm install`, `$HOME`, `$99`); supporting it would need conflict rules and escaping, and a misfire turns ordinary prose into a formula. Even one symbol goes in a fence
- For a superscript or subscript without invoking the maths engine, use raw HTML `<sub>` / `<sup>` ([raw HTML passes through](/en/write/html))
- The `mathjax-full` package is about 42MB, 8MB of which is `speech-rule-engine`

> Source: [ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md)
