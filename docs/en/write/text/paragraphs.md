# Paragraphs and line breaks

## What it is

The smallest unit of prose. **A blank line starts a new paragraph**; how much space sits between them is up to the theme.

## How to write it

```markdown
This is the first paragraph.

This is the second.
```

Two consecutive lines are **one paragraph** and do not break in the output:

```markdown
These two lines
are one paragraph.
```

To break a line inside a paragraph (an address, a verse, a run of short lines) there are two ways:

```markdown
First line breaks here··
Second line

First line breaks here\
Second line
```

The `··` above stands for **two spaces** — invisible in a real file, which is why **the backslash form is the reliable one** and the one a reviewer can actually see.

## What comes out

Paragraph spacing follows the theme's `--pf-space-3`. A couple of themes rewrite the rules entirely:

- `fiction` **indents the first line and removes the gap between paragraphs** — how novels are set
- `lesson` enlarges the first paragraph under the title into a lede

## Traps

- **Don't align paragraphs with spaces.** Indentation is the theme's job, and four leading spaces makes an indented code block
- Several blank lines in a row still mean one. To open up space use a [thematic break](/en/write/blocks/rule) or a different theme
