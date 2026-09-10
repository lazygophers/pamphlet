# Writing

Pamphlet's syntax is a **strict CommonMark superset**: everything standard Markdown does keeps working, plus two additions.

| What you want | Where to look |
|---|---|
| Prose, headings, lists, links | [CommonMark basics](/en/write/markdown/commonmark) |
| Tables, strikethrough, task lists | [GFM extensions](/en/write/markdown/gfm) |
| Callouts, tabs, collapsibles, steps | [The nine directives](/en/write/directives/) |
| Flowcharts, sequence diagrams | [Diagram fences](/en/write/diagrams/) |
| Images and fonts | [Images and assets](/en/write/assets) |

To look up what a directive takes, go to the [syntax cheat sheet](/en/reference/syntax) — that page is tables only, no explanation.

## Source files have no special extension

A source file is just `.md`, and it still reads fine on GitHub: directives show up as ordinary paragraphs, and ` ```mermaid ` fences are rendered natively by GitHub.

This is called **escape compatibility** — your content is never locked inside Pamphlet.
