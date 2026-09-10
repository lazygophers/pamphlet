# What this is

Pamphlet compiles one Markdown file into **one HTML file you can double-click**.

```bash
pamphlet build plan.md      # produces plan.html — anyone can just open it
```

The artifact has no `<link>`, no `<script src>`, no CDN reference. Diagrams are rendered to static SVG at compile time and inlined; fonts are subsetted data URIs; images are base64. Offline, `file://`, copied around on a USB stick — the behaviour is identical.

## Four promises

| Promise | What it actually means |
|---|---|
| **Self-contained** | Asks the network for nothing when opened. Referencing a remote image is a hard compile error (`EMB-403`), with no escape hatch |
| **Diagrams pre-rendered** | Diagrams are drawn on your machine; the reader runs no diagram library |
| **Interactive** | Tabs switch, collapse blocks open, diagrams zoom and pan |
| **Degrades without JavaScript** | Turn JavaScript off and tabs become all panels expanded, collapse blocks become native `<details>`. Not one word is lost |

The fourth promise constrains the first three: every interaction must first have a form that needs no JavaScript, and only then get script layered on top.

## Why not an existing tool

We surveyed the field: **no existing tool delivers all four at once**.

The closest is [Quarto](https://quarto.org/docs/output-formats/html-basics.html) — `embed-resources: true` is already self-contained, `.panel-tabset` already gives tabs, and `mermaid-format: svg` forces diagram pre-rendering. It lost not on effort but on **direction**: Quarto speaks the Pandoc Markdown dialect, whereas Pamphlet's entire promise (a strict CommonMark superset, sources keep the `.md` extension, drop the source on GitHub and it still reads) is built on CommonMark. That simply cannot stand on Quarto. It also ships a ~100MB binary and targets the R / Python data science ecosystem, which is the wrong shape for "a Markdown tool in the npm ecosystem".

The rest:

| Tool | Gap |
|---|---|
| [Pandoc](https://pandoc.org/MANUAL.html) `--embed-resources` | Self-contained, but no interactivity and no diagrams |
| [Marp](https://github.com/orgs/marp-team/discussions/516) | Officially does not support self-contained bundling |
| Docusaurus / Astro | No single-file export |
| [Typst](https://typst.app/docs/reference/html/) | HTML export is still experimental, marked not for production use |
| [Asciidoctor + Kroki](https://github.com/asciidoctor/asciidoctor-kroki/issues/421) | Can inline, but has a known bug where diagrams fail silently, and no native tabs |

## What it does not do

- **No multi-page sites.** One source document = one HTML file. The documentation site you are reading is built with [Rspress](https://rspress.rs/); it is not a Pamphlet artifact.
- **No server side.** No runtime, no database, no build service.
- **No guessing which files to compile.** Paths must be given explicitly — see [explicit file paths only](/en/limits/file-paths).

## Next

1. [Install](/en/guide/install) — the compiler itself, plus diagram engines on demand
2. [Syntax](/en/guide/syntax) — nine container directives and eight diagram fences
3. [CLI](/en/guide/cli) — six commands and their exit codes

Before you start, skim [known limits](/en/limits/mobile). Every entry there is a behaviour that **looks exactly like a bug but is in fact the design**.
