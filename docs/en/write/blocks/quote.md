# Block quotes

## What it is

A passage someone else said, or one lifted from elsewhere — set off by an indent or a rule down the left.

## How to write it

```markdown
> The quoted text goes here.
>
> Blank lines need the `>` too, otherwise this is two blocks.
```

It can contain anything else: lists, code blocks, bold, even another quote (`>>`).

## What comes out

**Themes differ a lot here:**

| Theme | What a quote looks like |
|---|---|
| Most | A rule down the left, text dimmed |
| `paper` | No rule; indented on both sides, italic |
| `architecture` | Set as a **decision record** |
| `fiction` | An authorial aside |

## Traps

- **Don't use it as a callout.** To warn a reader use a [callout](/en/write/components/callout) (`:::warn`), which carries colour semantics; a block quote means "these are not my words"
- Every line needs the `>`, blank ones included. Miss one and you get two separate quotes
