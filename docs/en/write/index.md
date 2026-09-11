# Writing

Pamphlet's syntax is a **strict CommonMark superset**: everything standard Markdown does keeps working, plus two additions.

| What you want to write | Which page |
|---|---|
| Headings (six levels), paragraphs, line breaks, bold and italic, block quotes, lists, code blocks, links, images, rules, escaping | [Basic Markdown syntax](/en/write/markdown/commonmark) |
| **Tables** (with column alignment), strikethrough, task lists, autolinks | [GFM extensions](/en/write/markdown/gfm) |
| Callouts, tabs, collapsibles, steps, scroll reveals | [The nine directives](/en/write/directives/) |
| Flowcharts, sequence, architecture, data-flow, C4, Gantt… | [Diagram fences](/en/write/diagrams/) |
| Images, embedded fonts, size limits | [Images and assets](/en/write/assets) |
| Document title, table of contents, theme, language | [Frontmatter reference](/en/reference/frontmatter) |

**The first two rows are standard Markdown**; everything below is what Pamphlet adds. Each page spells the syntax out item by item rather than waving at "same as standard Markdown".

To look up what a directive takes, go to the [syntax cheat sheet](/en/reference/syntax) — that page is tables only, no explanation.

## Source files have no special extension

A source file is just `.md`, and it still reads fine on GitHub: directives show up as ordinary paragraphs, and ` ```mermaid ` fences are rendered natively by GitHub.

This is called **escape compatibility** — your content is never locked inside Pamphlet.
