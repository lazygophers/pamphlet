# Code blocks

## What it is

A run of code or commands on its own lines: monospace, tinted background, **highlighted by language**.

Versus [inline code](/en/write/text/inline-code): inline sits in a sentence, a block owns its space.

## How to write it

Three backticks, language on the opening line:

````markdown
```typescript
const a = 1
```
````

No language means plain text with no highlighting — right for pasted logs and directory trees.

## A code block inside a code block

**The outer fence needs more backticks:**

`````markdown
````markdown
```bash
echo hi
```
````
`````

## Indented form

Four leading spaces is also a code block. It collides with [list](/en/write/blocks/lists) indentation, so **prefer fences everywhere**.

## What comes out

- Highlighting happens **at compile time**; the output ships no highlighting library
- Background follows `--pf-code-bg`
- The `manual` theme makes code the lead: a coloured rule down the left and more padding
- Long lines **scroll horizontally rather than wrap** — wrapping destroys the indentation

## Traps

- A misspelled language (`typescrpt`) is not an error; you just get no highlighting
- When the fence language is `mermaid` **it is no longer code but a picture** — see [Diagrams](/en/write/diagrams/flowchart)
