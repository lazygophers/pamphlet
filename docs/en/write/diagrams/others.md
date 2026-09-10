# The other seven diagram types

The fence languages are recognised, but **the engines are not written yet**. Using one gets `DIAG-301`, "no engine installed that can draw X", and the build fails.

| Fence language | Engine | Future dependency shape |
|---|---|---|
| `d2` | d2 | npm, WASM, no browser |
| `dot` | Graphviz | npm, WASM, no browser |
| `math` | MathJax v3 | npm, pure JS, emits SVG natively |
| `vega-lite` | Vega-Lite | npm library |
| `wavedrom` | WaveDrom | npm library |
| `bytefield` | bytefield-svg | npm, pure JS |
| `plantuml` | PlantUML | **jar, needs Java ≥ 11** |

`packages/pamphlet/src/diagrams/` currently contains only `mermaid.ts`. The shape is settled in [ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md); it just is not written.

## Why every engine is optional

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

Even a single symbol has to be a block fence; or use raw HTML `<sub>` / `<sup>` ([raw HTML passes through](/en/write/markdown/commonmark)).

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

The `engines` frontmatter field exists for this, but **it is not implemented yet** — writing it only produces a `DOC-104` warning. See [Adding a custom diagram engine](/en/howto/custom-engine).

> Source: [ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md)
