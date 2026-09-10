# Introduction

Pamphlet compiles one Markdown file into **one HTML file you can double-click open**.

```bash
npx @pamphlet/cli build plan.md      # gives you plan.html, openable by anyone you send it to
```

The output contains no `<link>`, no `<script src>`, no CDN reference. Diagrams were rendered to static SVG at compile time and inlined, fonts are subset data URIs, images are base64. Offline, over `file://`, copied around on a USB stick — the behaviour is identical.

## Four promises

| Promise | What it means |
|---|---|
| **Self-contained** | Asks the network for nothing when opened. Referencing a remote image fails the build (`EMB-403`), with no escape hatch |
| **Diagrams pre-rendered** | Drawn on your machine; readers run no diagram library |
| **Interactive** | Tabs switch, collapsibles open, diagrams zoom and pan |
| **Degrades without JavaScript** | With JavaScript off, tabs become fully expanded and collapsibles become native `<details>`. Not a word is lost |

The fourth is a constraint on the first three: every interaction must have a form that works without scripting first, and scripting is layered on top.

## When to use it

**Good fit**: a one-off proposal, a post-mortem, a weekly report, a client explainer — anything you want someone to just double-click, without asking them to install something or standing up a site.

**Poor fit**:

- **A continuously updated multi-page site.** One source file = one HTML file; there is no cross-page navigation or site-wide search. The site you are reading is built with [Rspress](https://rspress.rs/), not with Pamphlet.
- **Sending to someone to open on a phone.** iOS blocks local HTML files; that is not something Pamphlet can fix. Workarounds in [What the output is](/en/design/output).
- **A several-hundred-page book.** One file means the whole thing loads at once.

For how it differs from Pandoc and friends, see [Comparisons](/en/design/compare).

## Why not something that already exists

The field was surveyed: **no existing tool does all four at once**.

The closest is [Quarto](https://quarto.org/docs/output-formats/html-basics.html) — `embed-resources: true` is already self-contained, `.panel-tabset` already gives tabs, `mermaid-format: svg` forces pre-rendered diagrams. It lost not on effort but on **direction**: Quarto speaks Pandoc Markdown, while Pamphlet's whole promise (a strict CommonMark superset, sources stay `.md`, they still read fine on GitHub) rests on CommonMark. It also ships a ~100MB binary aimed at the R / Python data science world.

The rest:

| Tool | Gap |
|---|---|
| [Pandoc](https://pandoc.org/MANUAL.html) `--embed-resources` | Self-contained yes; no interactivity, no diagrams |
| [Marp](https://github.com/orgs/marp-team/discussions/516) | Explicitly does not support self-contained bundling |
| Docusaurus / Astro | No single-file export |
| [Typst](https://typst.app/docs/reference/html/) | HTML export still experimental, marked not for production use |
| [Asciidoctor + Kroki](https://github.com/asciidoctor/asciidoctor-kroki/issues/421) | Can inline, but has a known silent-diagram-failure bug and no native tabs |

## Next

[Quick start](/en/start/quickstart) — ten minutes to your own first output.
