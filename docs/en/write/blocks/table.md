# Tables

## What it is

A grid of rows and columns: comparing options, listing fields, listing costs.

**A Markdown table holds simple content only** — it is not a spreadsheet, has no merged cells, and cannot hold paragraphs.

## How to write it

```markdown
| Environment | Instances | Monthly cost |
|---|---|---|
| production | 6 | $450 |
| staging | 2 | $110 |
```

Three parts: **a header row, a delimiter row, and body rows**. The delimiter row is required — without it this is not a table. Spaces around the pipes are free; aligning them only helps the source read better.

## Column alignment

Add colons in the delimiter row:

```markdown
| Left | Right | Centre |
| :--- | ---: | :---: |
| alpha | 1,200 | yes |
| beta | 980 | no |
```

| Delimiter | Result |
|---|---|
| `---` | Default, left |
| `:---` | Left |
| `---:` | **Right** — use it for numbers |
| `:---:` | Centre |

## What fits in a cell

Anything inline: bold, `inline code`, links, images.

**Block content does not fit**: no code blocks, lists, or multiple paragraphs. Move it out of the table, or use a [collapsible](/en/write/components/collapse).

A literal pipe inside a cell must be escaped as `\|`.

## No merged cells

GFM tables have **no row or column spans** and no multi-level headers. A table that wants merging usually wants to be two tables.

## What comes out

| Theme | What a table looks like |
|---|---|
| `default` | Tinted header, full borders |
| `paper` `architecture` | **Booktabs**: rules only at top, under the header, and at the bottom |
| `manual` | Sticky header plus zebra striping, built for long tables |
| `console` | Dense, tight row height |

On narrow screens tables **scroll horizontally rather than being squeezed into wrapping**.

## Traps

- Right-align numeric columns with `---:`, or the digits never line up
- If it does not fit, don't force it: a wide table of prose is close to unreadable on a phone
