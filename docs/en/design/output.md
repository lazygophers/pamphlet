# What the output is

A pamphlet is **one HTML file** containing five things: a shell, styles, body HTML, inlined diagram SVG, and a small runtime script. Plus an HTML comment holding the source file verbatim.

`pamphlet build --verbose` shows what each weighs.

## It asks the network for nothing

No `<link>`, no `<script src>`, no CDN reference, no remote font.

The compiler enforces this: referencing a remote image **fails the build** (`EMB-403`), with **no escape hatch**.

## Complete with JavaScript off

| Element | With JavaScript | Without |
|---|---|---|
| Tabs | Click to switch | All expanded, each label becomes a section heading |
| Collapsible | Click to open | Native `<details>`, still opens |
| Steps | Numbered circles | Identical (pure CSS) |
| Scroll-in | Slides in | Simply visible |
| Diagrams | Zoom and pan | Fully displayed, no zoom |
| Table of contents | Anchor links | Identical (pure CSS) |

**Not a word is lost.** This is the starting point rather than a patch: every interaction must have a script-free form first, and scripting is layered on top.

## Follows the system colour scheme

Both variable sets live in the output at once and switch via the CSS `prefers-color-scheme` query — **not a line of JavaScript involved**.

Diagram colours are in the same layer, so lines and text inside diagrams change with it. Hard-coded colours in engine output that could not be substituted report `DIAG-304` at compile time.

## Narrow screens scroll, they do not reflow

**Pamphlet does not do responsive layout.** Body text is capped at 52rem and centred; on narrow screens tables and code blocks scroll horizontally rather than being squeezed into wrapping.

That is deliberate: reflowing destroys the readability of tables and diagrams, while horizontal scrolling at least preserves the shape of the content.

## Opening it on a phone

**Pamphlet does not promise how you get the output open on a phone; it promises the experience once it is open.**

The second half holds completely: opened in a mobile browser (from a local file or a URL), tabs click, diagrams are sharp, and it follows the system colour scheme.

The first half is not something Pamphlet can fix:

- **Since iOS 18.5, Safari no longer opens local HTML files directly** (<https://discussions.apple.com/thread/256102223>, reproduced by several people on Apple's community forum; that is a community thread, not official documentation)
- **WeChat's built-in browser blocks local HTML from executing by default** (Chinese technical community sources, not official documentation)

Together, "send the HTML over chat and they tap it open" is unlikely to work on iOS in 2026.

### Three ways around it

:::steps
1. **On iOS, open it via the Files app.** Save it there, long-press → open in Safari. That path does work.
2. **Have the sender put it on any web server.** The output is a single static file; GitHub Pages, object storage, or any nginx on a company network will serve it with no server-side cooperation.
3. **Send a PDF instead.** Open the output on a computer and print to PDF. Interactivity is lost but the whole content is readable — because the no-JavaScript fallback already requires everything to be visible when expanded.
:::

### Why there is no "mobile version"

`--format hosted` (an extra hostable multi-file build for mobile) was considered and rejected:

- It contradicts the "self-contained single file" identity
- It means maintaining a second assembly path and a second test suite
- **And it would still hit the same wall** — what iOS blocks is local files, and a multi-file build is still local files

Any scheme that tries to get around this limit adds complexity to the output and stays limited anyway.

**Narrowed, the promise holds completely**: CSP, `location.hash` deep links, data URI fonts and `prefers-color-scheme` were all verified under `file://`. Leaving an undeliverable promise standing does more damage than narrowing it.

> Source: [ADR-0018](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0018-mobile-promise-narrowed.md)

## The output is its own backup

The source is stored verbatim in an HTML comment by default, and `pamphlet extract` gives it back. Even with nothing but the HTML file, the original is not lost.

`--no-embed-source` turns that off, at the cost of the recovery.
