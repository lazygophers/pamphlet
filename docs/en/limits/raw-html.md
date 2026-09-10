# Raw HTML passes through untouched

HTML in the source is **rendered as HTML, and the compiler filters nothing**. `<style>` tags, `style` attributes and inline `<svg>` all reach the artifact unchanged.

There is no `allow-html` switch — it is not "off by default", the concept **does not exist**.

The only security boundary is the strict CSP in the artifact (Content Security Policy: a list the browser enforces about what may and may not run).

## What the CSP does block

All verified:

| Written in the source | Result in the artifact |
|---|---|
| `<script>alert(1)</script>` | Blocked — `script-src` allows only the one runtime hash |
| `<img onerror="...">` and other inline event attributes | Blocked — inline handlers need `'unsafe-inline'` |
| `<iframe src="https://...">` | Blocked — `default-src 'none'` |
| `<img src="https://...">` | Blocked — `img-src` allows only `data:` |
| `<form action="https://...">` | The form renders; the submission target is blocked |

## The two things it does not block

Both are **known and accepted** consequences of the design, not bugs.

### 1. `<style>` tags and `style` attributes

`style-src 'unsafe-inline'` is the single concession in that CSP — all styles are inline, and there is no other way to write them.

So **one `<style>` block in the source can override the entire theme system**, including the three-layer theme tokens and the variables used to recolour diagrams.

:::danger The usual cause is copy-paste
Paste an HTML snippet carrying `style` from somewhere else, then find the theme broken — **that is not a bug, that is the design**.
:::

Styling is meant to go through the [theme tokens](/en/reference/theme-tokens). Note that the `theme` frontmatter field is parsed but not yet wired into the compiler, so overriding the CSS variables is currently the only route — which is exactly the loophole described here.

### 2. Inline `<svg>`

It **bypasses the whole diagram pipeline**:

- No SVG sanitisation — it may carry `<animate>` and other SMIL tags, exactly what the sanitiser explicitly refuses
- No colour rewriting — it will not follow the theme into dark mode

In other words **SVG has two very different paths**: engine-produced SVG is strictly sanitised, author-written SVG is entirely unconstrained.

If you built any assumption on "all SVG has been sanitised", it does not hold.

## Why no filtering

Three stricter approaches were considered and rejected:

- **Strip `<style>` / `style` attributes and route inline `<svg>` through sanitisation and recolouring**: precisely covers what the CSP misses, without double-defending anything. Rejected.
- **Use DOMPurify's default allowlist wholesale**: no rules to design ourselves, but the default list drifts between versions, and **it allows `style` attributes and `<svg>` by default** — so it does not solve either problem. Rejected.
- **Pass through, but warn on `style`**: keeps author control. Rejected.

The payoff of passing through is **maximum predictability**: what the author writes is what appears — CommonMark plus an HTML renderer, zero surprises. It also leaves the "plain Markdown works" promise without exceptions.

If this is ever tightened, the `style` attribute goes first: it has the largest benefit (the theme system survives) and the smallest cost to authors.

> Source: [ADR-0021](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0021-raw-html-passes-through-untouched.md)
