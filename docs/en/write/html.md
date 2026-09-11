# Raw HTML

## What it is

You can write HTML tags straight into a source file and **the compiler filters nothing**: `<style>` tags, `style` attributes and inline `<svg>` all reach the output untouched.

There is no `allow-html` switch — not "off by default", the concept **does not exist**.

The only line of defence is the strict CSP (Content Security Policy: a list the browser enforces about what may and may not run) carried in the output.

## What the CSP blocks

All of this was tested:

| Written in the source | Result in the output |
|---|---|
| `<script>alert(1)</script>` | Blocked — `script-src` allows only the runtime's one hash |
| `<img onerror="...">` and other inline event attributes | Blocked — inline handlers need `'unsafe-inline'` |
| `<iframe src="https://...">` | Blocked — `default-src 'none'` |
| `<img src="https://...">` | Blocked — `img-src` allows only `data:` |
| `<form action="https://...">` | Form displays, submission target blocked |

## The two it does not block

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

## Why no filtering

Three stricter approaches were considered and all rejected:

- **Strip `<style>` / `style`, run inline `<svg>` through sanitising and recolouring**: precisely covers what the CSP misses. Rejected.
- **Run everything through DOMPurify's default allowlist**: no rules to design, but the default list drifts across versions, and it **allows the `style` attribute and `<svg>` by default** — so it fixes neither problem. Rejected.
- **Pass through but warn on `style`**: keeps author control. Rejected.

Passing through unchanged buys **maximum predictability**: what the author writes is what appears — CommonMark plus an HTML renderer, no surprises. It also leaves the "compatible with plain Markdown" promise without a single exception.

If this is ever tightened, the `style` attribute goes first: the largest gain (the theme system survives) for the smallest loss to authors.

> Source: [ADR-0021](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0021-raw-html-passes-through-untouched.md)

## Inline maths uses `<sub>` / `<sup>`

Maths is block-level only; **`$E=mc^2$` inline is not supported**. The reasoning and the workaround are in [The other seven diagram types](/en/write/diagrams/others).
