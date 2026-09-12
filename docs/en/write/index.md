# Syntax overview

**This page lists every piece of syntax Pamphlet understands.** The menu on the left maps to it one-to-one: what is in the menu is here, and what is not here is not supported.

A source file is plain `.md` and still reads fine on GitHub.

## Text formatting

Things inside a sentence.

| Write | Looks like | Notes |
|---|---|---|
| [Headings](/en/write/text/headings) | `# one` … `###### six` | Six levels; the first `#` is the document title and skips the ToC |
| [Paragraphs and breaks](/en/write/text/paragraphs) | blank line separates | In-paragraph break: trailing backslash |
| [Emphasis](/en/write/text/emphasis) | `**bold**` `*italic*` `~~struck~~` | Asterisks, not underscores, inside non-Latin runs |
| [Inline code](/en/write/text/inline-code) | `` `code` `` | Verbatim; nothing inside is syntax |
| [Escaping](/en/write/text/escaping) | `\*` `\#` `\|` | Show a character as itself |

## Paragraphs and lists

Things that own a block.

| Write | Looks like | Notes |
|---|---|---|
| [Block quotes](/en/write/blocks/quote) | `> quoted` | Every line needs `>`, blank ones included |
| [Lists](/en/write/blocks/lists) | `- item` / `1. item` / `- [x] item` | Unordered, ordered, task; nestable |
| [Code blocks](/en/write/blocks/code) | ` ```ts ` around lines | Highlighted at compile time |
| [Tables](/en/write/blocks/table) | `\| col \| col \|` | Column alignment; no merged cells |
| [Thematic breaks](/en/write/blocks/rule) | `---` alone on a line | `---` at the very top is config, not a rule |

## Interactive components

The five things Pamphlet adds on top of standard Markdown, collectively [container directives](/en/write/components/). One rule: `:::name[label]{attributes}`.

| Directive | What it does | Label | Attributes |
|---|---|---|---|
| [`info` `tip` `warn` `danger`](/en/write/components/callout) | Four kinds of callout | optional | none |
| [`tabs` / `tab`](/en/write/components/tabs) | Tabbed panels | `tab` **required** | `default` |
| [`collapse`](/en/write/components/collapse) | Collapsible block | **required** | `open` |
| [`steps`](/en/write/components/steps) | Numbered steps | — | none |
| [`reveal`](/en/write/components/reveal) | Reveal on scroll | — | `effect` |

Attribute values: `default` and `open` take no value; `effect` is one of `fade-up` (default) / `fade-in` / `slide-left` / `slide-right`.

`class` and `id` do not error, but **are not emitted** — the values are dropped silently.

## Diagrams

**Two ways to write one**: Pamphlet's own structured syntax (`:::flow` and friends — declarations first, relationships second), or a ` ```mermaid ` fence. Both are drawn to SVG **at compile time** and inlined, so the reader downloads no drawing library and makes no network request.

The structured syntax does not render on GitHub; the fence does. Which you want depends on where the source file goes.

**Each way has its own pages**: the second column below links to the own-syntax page, the third to the [Mermaid fence page](/en/write/diagrams/mermaid/) for the same diagram.

| To draw | Own syntax | The Mermaid fence |
|---|---|---|
| [Flowcharts](/en/write/diagrams/flowchart) | `:::flow` | [`flowchart LR`](/en/write/diagrams/mermaid/flowchart) |
| [Sequence](/en/write/diagrams/sequence) | `:::sequence` | [`sequenceDiagram`](/en/write/diagrams/mermaid/sequence) |
| [State](/en/write/diagrams/state) | `:::state` | [`stateDiagram-v2`](/en/write/diagrams/mermaid/state) |
| [Class](/en/write/diagrams/class) | `:::class` | [`classDiagram`](/en/write/diagrams/mermaid/class) |
| [ER](/en/write/diagrams/er) | `:::er` | [`erDiagram`](/en/write/diagrams/mermaid/er) |
| [Gantt](/en/write/diagrams/gantt) | `:::gantt` | [`gantt`](/en/write/diagrams/mermaid/gantt) |
| [Pie](/en/write/diagrams/pie) | `:::pie` | [`pie`](/en/write/diagrams/mermaid/pie) |
| [Architecture](/en/write/diagrams/architecture) | `:::architecture` | [`architecture-beta`](/en/write/diagrams/mermaid/architecture) |
| [System context](/en/write/diagrams/c4) | `:::c4` | [`C4Context`](/en/write/diagrams/mermaid/c4) |
| [Data flow](/en/write/diagrams/dataflow) | `:::dataflow` | [`flowchart LR`](/en/write/diagrams/mermaid/dataflow) |
| [Mind maps](/en/write/diagrams/mindmap) | `:::mindmap` | [`mindmap`](/en/write/diagrams/mermaid/mindmap) |
| [Branch graphs](/en/write/diagrams/gitgraph) | `:::gitgraph` | [`gitGraph`](/en/write/diagrams/mermaid/gitgraph) |
| [Block](/en/write/diagrams/block) | `:::block` | [`block-beta`](/en/write/diagrams/mermaid/block) |
| [Swimlane](/en/write/diagrams/swimlane) | `:::swimlane` | — Mermaid cannot |
| [Network topology](/en/write/diagrams/topology) | `:::topology` | — Mermaid cannot |
| [Data charts](/en/write/diagrams/chart) | `:::chart` | — Mermaid cannot |
| [Org charts](/en/write/diagrams/orgchart) | `:::orgchart` | — Mermaid cannot |

**The first thirteen are drawn by [Mermaid](/en/write/diagrams/mermaid)** (installed once); the structured syntax is translated into its source. **The last four Mermaid cannot draw** — Pamphlet lays those out and emits the SVG itself, with no browser needed at compile time. The other seven fence languages (`d2` `dot` `math` `vega-lite` `wavedrom` `bytefield` `plantuml`) are **not implemented**; using one reports `DIAG-301` and fails the build — see [The other seven](/en/write/diagrams/others).

Images have their own page: [Images and assets](/en/write/diagrams/images).

## Whole-document settings

Not written in the body but between the `---` pair at the very top.

| Field | What it does |
|---|---|
| `title` | The output's browser-tab title |
| `theme` | Which [built-in theme](/en/reference/themes) to use |
| `toc` | Table of contents: on/off, depth, side or inline |
| `lang` | The output's language attribute |
| `spec` | Minimum compiler version this document needs |

Full details in the [frontmatter reference](/en/reference/frontmatter).

## Not supported

| If you write it | |
|---|---|
| **Footnotes** `[^1]` | `DOC-105`, an **error**. Dropping them silently would make your notes vanish, so it errors instead. Use a parenthetical or a `:::info` block |
| **Inline maths** `$x$` | Unsupported; only a block ` ```math ` fence exists, and that is not implemented either |
| **`:::callout`** | `DIR-201` warning. `callout` is the collective name for the four callouts, not a directive |
| **Single-line directives** `::name[content]` | `DIR-202`. All nine directives are container directives |

## You can also write HTML

HTML in a source file **passes through unfiltered** — both an escape hatch and the one place that can override the theme system. See [Raw HTML](/en/write/html).
