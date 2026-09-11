# Thematic breaks

## What it is

A line across the page that cuts content into two unrelated parts.

## How to write it

Three or more `-`, `*` or `_` alone on a line:

```markdown
---
```

## What comes out

An `<hr>`, coloured with the theme's `--pf-border`.

The `fiction` theme replaces it with **three centred dots** — the scene separator used in novels, not a line.

## Traps

:::warning `---` at the very top is frontmatter
The pair of `---` at the **very beginning** of a source file delimits configuration (see the [frontmatter reference](/en/reference/frontmatter)), not a rule. To open a document with one, use `***`.
:::

- Leave blank lines around it, or `---` turns the line above into a level-2 heading (Markdown's other heading syntax)
- Using it to "add space" is misuse: sections want [headings](/en/write/text/headings)
