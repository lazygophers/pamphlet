# Emphasis

## What it is

Marking a few words inside a sentence: bold, italic, strikethrough.

## How to write it

```markdown
**bold** or __bold__
*italic* or _italic_
***bold italic***
~~strikethrough~~
```

## What comes out

- **bold** → `<strong>`; screen readers stress it
- *italic* → `<em>`. **CJK type has no true italic**: browsers slant the square glyphs mechanically, which usually looks wrong — prefer bold in CJK text
- ~~strikethrough~~ → `<del>`, for "this is void but the trace stays"

Strikethrough is a GFM extension (GitHub's set of Markdown extensions), not part of standard Markdown, but both this site and GitHub support it.

## Traps

- **Use asterisks, not underscores, inside a run of non-Latin text.** `__bold__` requires whitespace or punctuation on both sides; asterisks have no such rule
- No spaces between the markers and the text: `** bold **` is not bold
- To emphasise a whole block use a [callout](/en/write/components/callout); bolding an entire paragraph emphasises nothing
