# Diagram engines are all optional

Installing `pamphlet` gives you **the compiler only**. No diagram engine comes with it; you are prompted to install one the first time you use it.

This is not laziness, it is arithmetic: all the engines together are about **340MB**. For a Markdown tool, that is an adoption killer.

## The arithmetic

Measured (`npm install` of six engines plus `du -sh node_modules`): **270 packages, 189MB**, on top of Playwright + Chromium at about 150MB.

Optional dependencies put the size cost precisely on the people who actually use that engine — **plain-text users install none of them**.

## Only Mermaid is implemented in this version

| Fence | Engine | Dependency shape | This version |
|---|---|---|---|
| `mermaid` | Mermaid | npm + **headless browser** | ✅ implemented |
| `d2` | d2 | npm, WASM, no browser | planned |
| `dot` | Graphviz | npm, WASM, no browser | planned |
| `math` | MathJax v3 | npm, pure JS, emits SVG natively | planned |
| `vega-lite` | Vega-Lite | npm library | planned |
| `wavedrom` | WaveDrom | npm library | planned |
| `bytefield` | bytefield-svg | npm, pure JS | planned |
| `plantuml` | PlantUML | **jar, needs Java ≥ 11** | planned |

Using a "planned" fence gets `DIAG-301`, "no engine installed that can draw X", and the build fails. `packages/pamphlet/src/diagrams/` currently contains only `mermaid.ts`.

## Why Mermaid needs a 150MB browser

```bash
npm i -g mermaid-isomorphic playwright && npx playwright install chromium
```

Because **Mermaid needs a real browser's layout engine to measure text**. jsdom (a pure-JavaScript fake browser) does not implement `SVGTextElement.getBBox()` — and if you cannot measure how wide a run of text is, you cannot lay out the graph.

This is not a preference. Mermaid org member @aloisklink ruled the jsdom approach out explicitly: <https://github.com/mermaid-js/mermaid/issues/3886#issuecomment-1341694822>

The cost lands on "install once", not "every use": about 150MB, about a minute.

**The browser starts lazily**: a plain-text document never launches it (measured cold start 733ms — wasteful to pay for nothing).

## PlantUML needs Java

It is the only one of the seven that requires Java ≥ 11. That is a known cost, accepted because it is the only engine that covers advanced UML and real C4 modelling.

So Java is a **documented optional prerequisite**, not a hidden requirement. `pamphlet doctor` checks `java -version` and reports it clearly rather than letting a raw `spawn` failure surface.

## Extra work in CI

The image needs Chromium and its system dependencies:

```bash
npx playwright install --with-deps chromium
```

## Libraries, never CLI packages

Measurement showed that of those 189MB, about **38MB is raster-output dependencies** — and Pamphlet only needs SVG:

- `vega-cli` drags in `canvas` at 19MB (a native module needing local compilation, one of the most common CI install failures)
- `wavedrom-cli` drags in `@jimp` / `gifwrap` / `@resvg` at roughly 19MB

Using the `vega` + `vega-lite` libraries (`view.toSVG()`) and the `wavedrom` library directly removes all 38MB.

## Maths does not use KaTeX

KaTeX emits HTML+CSS rather than SVG by default (<https://katex.org/>), which does not fit a "pre-render to inline SVG" pipeline. Hence MathJax v3.

## Check first

```bash
pamphlet doctor
```

Any missing engine exits `3` (environment missing).

> Sources: [ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md), [ADR-0004](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0004-mermaid-via-headless-browser.md)
