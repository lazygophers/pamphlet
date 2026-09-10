# Adding a custom diagram engine

:::danger Not implemented
This page describes a shape that is **decided but not built**. Writing `engines` today only produces a `DOC-104` warning: "engines (custom engines) is not implemented; this declaration has no effect".

The built-in Mermaid works as usual.
:::

## The intended shape

Describe an engine as an external command in frontmatter:

```yaml
---
engines:
  myengine:
    langs: [foo]
    command: [mytool, --svg]
---
```

The contract is minimal:

| Item | Contract |
|---|---|
| How the diagram source gets in | **stdin** |
| How the SVG comes out | **stdout** |
| How failure is signalled | Non-zero exit code |

After that a ` ```foo ` fence in a source file is piped into `mytool --svg`.

## Why declarative rather than a plugin API

**There is no JavaScript-level plugin interface.** Any program that reads stdin and writes SVG to stdout can be attached, whatever language it is written in.

Three reasons:

- **No npm package to publish** in order to attach your own tool
- **No coupling to Pamphlet's internals**, which promise nothing during 0.x
- **The process boundary isolates it** — a third-party engine crashing cannot take the compiler with it

The cost is one process start per diagram. For compile-time work that happens once, that is acceptable.

## What you can do today

There is no substitute path. For diagrams other than Mermaid there are two options:

1. **Draw the SVG yourself and paste it in as inline `<svg>`.** Note that it [bypasses sanitising and recolouring](/en/write/markdown/commonmark) — it will not follow the dark colour scheme.
2. **Export it as an image and reference it.** Via [`![]()`](/en/write/assets), which base64-embeds it into the output.

> Source: [ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md)
