# Inline code

## What it is

The short run of monospace in the middle of a sentence: a command name, a file path, a field name, a key.

The difference from a [code block](/en/write/blocks/code): inline code sits **inside a sentence**, a code block **occupies its own lines**.

## How to write it

```markdown
Run `pamphlet build plan.md`; the output lands at `plan.html`.
```

The content is shown **verbatim** — asterisks, hashes and brackets are never syntax:

```markdown
`**these asterisks show up literally**`
```

## Putting a backtick inside

Wrap with **two** backticks and leave a space on each side:

```markdown
`` here is a ` backtick ``
```

The rule: the outer fence needs more backticks than the inner content.

## What comes out

Background follows the theme's `--pf-code-bg`, font follows `--pf-font-mono`. In `console` and `blueprint` the whole page is monospace, so the background colour is what sets inline code apart.

## Traps

- **Don't use it for emphasis.** Inline code means "this is a literal string a machine reads"; using it for stress makes readers think it is a command
- No spaces needed between CJK text and inline code; the typography handles the gap
