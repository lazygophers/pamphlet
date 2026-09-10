# Syntax cheat sheet

Tables only, no explanation. For examples and reasoning, go to [Writing](/en/write/).

## The one rule

`:::name[label]{attrs}` — **`[label]` is for the reader, `{attrs}` are for the compiler.**

When nesting, **the outer fence needs more colons than the inner one**.

## The nine directives

| Directive | Label | Attributes | Must contain | Details |
|---|---|---|---|---|
| `tabs` | — | — | at least one `tab` | [Tabs](/en/write/directives/tabs) |
| `tab` | **required** | `default` | — | [Tabs](/en/write/directives/tabs) |
| `collapse` | **required** | `open` | — | [Collapsible](/en/write/directives/collapse) |
| `steps` | — | — | an ordered list | [Steps](/en/write/directives/steps) |
| `reveal` | — | `effect` | — | [Scroll-in](/en/write/directives/reveal) |
| `info` | optional | — | — | [Callouts](/en/write/directives/callout) |
| `tip` | optional | — | — | [Callouts](/en/write/directives/callout) |
| `warn` | optional | — | — | [Callouts](/en/write/directives/callout) |
| `danger` | optional | — | — | [Callouts](/en/write/directives/callout) |

Attribute values:

| Attribute | Values |
|---|---|
| `default` | valueless, at most one per `tabs` group |
| `open` | valueless |
| `effect` | `fade-up` (default) / `fade-in` / `slide-left` / `slide-right` |

`class` and `id` do not warn, but **are not emitted** — the values are silently discarded.

## The eight diagram fences

| Language | Engine | This version |
|---|---|---|
| `mermaid` | Mermaid | ✅ implemented |
| `d2` | d2 | planned |
| `dot` | Graphviz | planned |
| `math` | MathJax v3 | planned |
| `vega-lite` | Vega-Lite | planned |
| `wavedrom` | WaveDrom | planned |
| `bytefield` | bytefield-svg | planned |
| `plantuml` | PlantUML | planned |

Using a planned one reports `DIAG-301` and fails the build.

## Markdown itself

| Syntax | Supported |
|---|---|
| All of CommonMark | ✅ |
| GFM tables | ✅ |
| GFM strikethrough `~~x~~` | ✅ |
| GFM task lists `- [x]` | ✅ (read-only) |
| GFM autolinks | ✅ |
| Raw HTML | ✅ passes through unfiltered |
| **GFM footnotes `[^1]`** | ❌ reports `DOC-105` |
| **Inline maths `$x$`** | ❌ block ` ```math ` only |

## Frontmatter fields

| Field | Type | Default |
|---|---|---|
| `spec` | integer | omitted = no check |
| `title` | string | the first `#` heading |
| `theme` | string | `default` |
| `lang` | string | `zh-CN` |
| `toc` | boolean or object | off |
| `engines` | object | ⚠️ not implemented |

`toc` subfields: `enable` (boolean, default `false`) / `deep` (1–6, default `2`) / `skipTabs` (boolean, default `true`) / `position` (`top` / `side`, where `side` errors).

Full detail in the [frontmatter reference](/en/reference/frontmatter).
