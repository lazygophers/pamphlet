# MathJax

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

## Install it once

It does not come with Pamphlet — install it when you need it, and everyone else downloads nothing (约 50MB，纯 JS):

```bash
npm i -D @nekoleapuki/pamphlet-engine-mathjax
```

Then confirm with `pamphlet doctor`:

```
✓ mathjax（math）
```

**Using the fence without installing it**: you get `DIAG-301` and **the whole build fails** (no placeholder box), with that command in the hint.

Licence: Apache-2.0.

Formula colours are entirely `currentColor`, inherited from the surrounding text, so dark mode just works without any colour substitution.

## Traps

- **Inline `$E=mc^2$` is not supported.** `$` is everywhere in technical writing (`$ npm install`, `$HOME`, `$99`); supporting it would need conflict rules and escaping, and a misfire turns ordinary prose into a formula. Even one symbol goes in a fence
- For a superscript or subscript without invoking the maths engine, use raw HTML `<sub>` / `<sup>` ([raw HTML passes through](/en/write/html))
- The `mathjax-full` package is about 42MB, 8MB of which is `speech-rule-engine`

> Sources: [ADR-0041](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0041-engines-are-separate-packages.md) (engines as separate packages), [ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md) (why these seven)
