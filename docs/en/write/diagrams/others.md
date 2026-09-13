# The other seven engines

Mermaid ships inside Pamphlet. **The other seven are each their own package — install the one you need.** Everyone else downloads nothing: all seven together weigh about 340MB, and d2 alone is 91.4MB.

| Fence language | Engine | Install | Size |
|---|---|---|---|
| [`dot`](/en/write/diagrams/dot) | Graphviz | `npm i -D @nekoleapuki/pamphlet-engine-graphviz` | 2.1MB |
| [`math`](/en/write/diagrams/math) | MathJax | `npm i -D @nekoleapuki/pamphlet-engine-mathjax` | 50MB |
| [`vega-lite`](/en/write/diagrams/vega-lite) | Vega-Lite | `npm i -D @nekoleapuki/pamphlet-engine-vega-lite` | 26MB |
| [`wavedrom`](/en/write/diagrams/wavedrom) | WaveDrom | `npm i -D @nekoleapuki/pamphlet-engine-wavedrom` | 3.3MB |
| [`bytefield`](/en/write/diagrams/bytefield) | bytefield-svg | `npm i -D @nekoleapuki/pamphlet-engine-bytefield` | 2.1MB |
| [`d2`](/en/write/diagrams/d2) | d2 | `npm i -D @nekoleapuki/pamphlet-engine-d2` | 91.4MB |
| [`plantuml`](/en/write/diagrams/plantuml) | PlantUML | `npm i -D @nekoleapuki/pamphlet-engine-plantuml` | jar + Java |

**Each has its own page** — follow the first column: what it is, what it draws, how the fence looks, and what the traps are.

Using a fence without its engine reports `DIAG-301` and **fails the whole build** (no placeholder box), with the command from the third column in the hint. `pamphlet doctor` lists all seven at once.

## Why not just bundle them all

Installing `@nekoleapuki/pamphlet-cli` gives you **the compiler only**, with no engine attached.

That is not laziness, it is arithmetic: **all the engines together weigh about 340MB**. Measured (`npm install` of six engines plus `du -sh node_modules`): **270 packages, 189MB**, plus Playwright and Chromium at about 150MB.

For a Markdown tool that is an adoption killer. Optional dependencies put the weight exactly on the people who use that engine — **a text-only user installs none of them**.

## Maths is block-level only

````markdown
```math
E = mc^2
```
````

**`$E=mc^2$` inline is not supported.**

`$` is everywhere in technical writing — `$ npm install`, `$HOME`, `$99`. Supporting it would require conflict detection and escaping rules, and a false positive turns ordinary prose into a formula.

Even a single symbol has to be a block fence; or use raw HTML `<sub>` / `<sup>` ([raw HTML passes through](/en/write/)).

Incidentally the maths engine will be MathJax v3 rather than KaTeX: KaTeX emits HTML+CSS rather than SVG by default (<https://katex.org/>), which does not suit a "pre-render to inline SVG" pipeline.

## PlantUML needs Java

Of the seven it is the only one requiring Java ≥ 11. That cost is accepted knowingly — it is the only engine that would add advanced UML and real C4 modelling.

So Java is a **documented optional prerequisite**, not a hidden requirement. `pamphlet doctor` will check `java -version` and give a clear diagnostic when it is missing, rather than letting a raw `spawn` failure surface.

## Libraries, never CLI packages

Measurement showed that of those 189MB, about **38MB is raster-output dependencies** — and Pamphlet only needs SVG:

- `vega-cli` drags in `canvas` at 19MB (a native module needing local compilation, the kind that most often fails to install in CI)
- `wavedrom-cli` drags in `@jimp` / `gifwrap` / `@resvg`, about 19MB

Using the `vega` + `vega-lite` libraries (`view.toSVG()`) and the `wavedrom` library itself removes all 38MB.

## Bringing your own engine

Describe an external command in the `engines` frontmatter field — **source in on stdin, SVG out on stdout**:

```yaml
engines:
  my-engine:
    langs: [mylang]
    command: [my-renderer, --svg, -]
```

No JavaScript from you means no third-party code at build time. See [Adding a custom diagram engine](/en/howto/custom-engine).

> Sources: [ADR-0041](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0041-engines-are-separate-packages.md), [ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md)
