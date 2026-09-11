# Basic Markdown syntax

This page writes out **every piece of basic syntax, one by one**: how to type it, what comes out, and where the traps are. No prior reading required.

Underneath it is CommonMark (the standardised version of Markdown; spec at <https://spec.commonmark.org/>). Pamphlet is a **strict superset** of it: only new syntax is added, nothing existing changes behaviour — so Markdown you wrote elsewhere works here unchanged.

## Headings

Six levels, and the hash marks **need a space after them**:

```markdown
# Level 1
## Level 2
### Level 3
#### Level 4
##### Level 5
###### Level 6
```

Seven hashes is not a heading; it is ordinary text.

### The first heading is the document title

The first `#` in the document becomes the output's `<title>` (the text on the browser tab), unless you set `title` in frontmatter.

It also **does not appear in the table of contents** — the ToC navigates within the document, and the document's own title is not a section of it.

So start your sections at `##`, and write exactly one `#` per document.

### Every heading gets an anchor

Headings automatically get an id you can deep-link to (append `#` and the id to the URL). The rule is:

| Heading | Anchor |
|---|---|
| `## Callouts` | `#callouts` |
| `## Theme tokens` | `#theme-tokens` |
| `## Step 1: install once` | `#step-1-install-once` |

That is: lowercased, spaces become hyphens, punctuation dropped, **non-Latin characters kept as they are**. When two headings collide, the second gets `-2` appended.

For an in-document jump, write `[go to callouts](#callouts)`.

### How deep the ToC goes

The table of contents collects to level 2 by default; `toc.deep` takes 1–6. See the [frontmatter reference](/en/reference/frontmatter).

## Paragraphs and line breaks

**A blank line starts a new paragraph.** Two consecutive lines are one paragraph and do *not* break:

```markdown
These two lines
are one paragraph in the output.
```

To break a line inside a paragraph, end it with **two spaces**, or with a single backslash `\`:

```markdown
First line breaks here··
Second line

First line breaks here\
Second line
```

(The `··` above stands for two spaces — invisible in a real file, which is why the backslash form is the reliable one.)

## Emphasis and inline code

```markdown
**bold** or __bold__
*italic* or _italic_
***bold italic***
`inline code`
~~strikethrough~~
```

- The underscore forms require whitespace or punctuation on both sides, so inside a run of non-Latin text the asterisk forms are the safe choice
- Inline code is shown **verbatim**: asterisks and hashes inside it are never syntax
- To put a backtick inside inline code, wrap with two backticks: `` `` a ` backtick `` ``
- Strikethrough is a GFM extension, see [GFM extensions](/en/write/markdown/gfm)

## Block quotes

A `>` at the start of the line:

```markdown
> The quoted text goes here.
>
> Blank lines need the `>` too, otherwise this is two blocks.
```

A block quote can contain anything else: lists, code blocks, even another quote (`>>`).

**How it looks is up to the theme**: most render a rule down the left; the `architecture` theme sets quotes as "decision records".

## Lists

### Unordered

`-`, `*` and `+` are equivalent — just **stay consistent within a document**:

```markdown
- First
- Second
- Third
```

### Ordered

```markdown
1. First
2. Second
3. Third
```

**The browser computes the numbers**, so writing `1.` `1.` `1.` still renders as 1, 2, 3. To start elsewhere, write that number on the first item (`3.` starts counting at three).

### Nesting

Indent children **to line up with the parent's text** — two spaces under an unordered item, three under an ordered one:

```markdown
- First
  - Child
    - Grandchild
- Second

1. First
   1. Child
   2. Child
2. Second
```

### Several blocks inside one item

Same alignment rule:

````markdown
1. **Install once**

   ```bash
   npm i -g @nekoleapuki/pamphlet-cli
   ```

2. **Compile**

   You get `plan.html`; double-click it.
````

### Tight versus loose

If the items are separated by **blank lines**, each item is wrapped in a paragraph and the spacing opens up (the term is a "loose list"); without blank lines it stays tight.

### Task lists

`- [x]` / `- [ ]` is a GFM extension, see [GFM extensions](/en/write/markdown/gfm).

## Code blocks

### Fenced (preferred)

Three backticks, with a language name on the opening line for highlighting:

````markdown
```typescript
const a = 1
```
````

No language name means plain text, no highlighting.

**To put a code block inside a code block, use four backticks outside** — the outer fence must have more backticks than the inner one:

`````markdown
````markdown
```bash
echo hi
```
````
`````

### Indented

Four spaces of indentation is also a code block. It collides easily with list indentation, so **prefer fences everywhere**.

### Diagram fences

When the fence language is `mermaid`, it is no longer code but **a picture drawn at compile time** — see [Diagram fences](/en/write/diagrams/).

## Links

```markdown
[an inline link](https://example.com)
[a link with a hover hint](https://example.com "shown on hover")
<https://example.com>
[jump to a section of this document](#callouts)
```

The last one is an **in-document anchor**; the anchor rules are under "Every heading gets an anchor" above.

The reference form suits an address that recurs:

```markdown
See the [load test report][report], and section three of the [report][report].

[report]: https://example.com/report "March load test"
```

The name in brackets is **case-insensitive**, the definition line can sit anywhere in the document, and it never appears in the output.

## Images

```markdown
![what the picture shows](./figures/architecture.png)
```

The bracketed text is the alternative text: shown if the image fails to load, and read out by screen readers.

**Images are embedded into the output at compile time**; paths are relative to the source file, remote URLs are an error, and a single asset caps at 2MB — full rules in [Images and assets](/en/write/assets).

## Thematic breaks

Three or more `-`, `*` or `_` alone on a line:

```markdown
---
```

:::warning `---` at the very top is frontmatter
The pair of `---` at the **very beginning** of a source file delimits configuration (frontmatter), not a rule. To open a document with a horizontal rule, use `***`.
:::

## Escaping

To show `*` `_` `#` `[` as themselves, put a backslash in front:

```markdown
\*not italic\*
5 \* 3 = 15
```

## Tables

Tables are a GFM extension; syntax and alignment are in [GFM extensions](/en/write/markdown/gfm).

## Raw HTML passes through untouched

HTML in a source file **is rendered as HTML; the compiler filters nothing**. `<style>` tags, `style` attributes and inline `<svg>` all go through verbatim.

There is no `allow-html` switch — not "off by default", the concept **does not exist**.

The only line of defence is the strict CSP (Content Security Policy: a list the browser enforces about what may and may not run) carried in the output.

### What the CSP blocks

All of this was tested:

| Written in the source | Result in the output |
|---|---|
| `<script>alert(1)</script>` | Blocked — `script-src` allows only the runtime's one hash |
| `<img onerror="...">` and other inline event attributes | Blocked — inline handlers need `'unsafe-inline'` |
| `<iframe src="https://...">` | Blocked — `default-src 'none'` |
| `<img src="https://...">` | Blocked — `img-src` allows only `data:` |
| `<form action="https://...">` | Form displays, submission target blocked |

### The two it does not block

Both are **known and accepted** design consequences, not bugs.

**One: `<style>` tags and the `style` attribute.** `style-src 'unsafe-inline'` is that CSP's single concession — all styling is inline, there is no other way to do it.

So **a `<style>` block in a source file can override the entire theme system**.

:::danger Copy-paste is the usual way in
You paste an HTML snippet carrying `style` from somewhere and find the theme broken — **that is not a bug, it is the design**.
:::

The right way to restyle is [Changing the theme colours](/en/howto/theme), not putting `<style>` in the document.

**Two: inline `<svg>`.** It bypasses the whole diagram pipeline:

- No SVG sanitisation — it can carry `<animate>` and other SMIL tags, exactly what the sanitiser refuses
- No colour substitution — it will not follow the dark colour scheme

So **SVG has two completely different paths**: engine output is strictly sanitised, author-written SVG is entirely unconstrained. If you assumed "all SVG here has been sanitised", that assumption breaks.

### Why no filtering

Three stricter approaches were considered and all rejected:

- **Strip `<style>` / `style`, run inline `<svg>` through sanitising and recolouring**: precisely covers what the CSP misses. Rejected.
- **Run everything through DOMPurify's default allowlist**: no rules to design, but the default list drifts across versions, and it **allows the `style` attribute and `<svg>` by default** — so it fixes neither problem. Rejected.
- **Pass through but warn on `style`**: keeps author control. Rejected.

Passing through unchanged buys **maximum predictability**: what the author writes is what appears — CommonMark plus an HTML renderer, no surprises. It also leaves the "compatible with plain Markdown" promise without a single exception.

If this is ever tightened, the `style` attribute goes first: the largest gain (the theme system survives) for the smallest loss to authors.

> Source: [ADR-0021](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0021-raw-html-passes-through-untouched.md)

## Inline maths uses `<sub>` / `<sup>`

Maths is block-level only; **`$E=mc^2$` inline is not supported**. The reasoning and the workaround are in [The other seven diagram types](/en/write/diagrams/others).
