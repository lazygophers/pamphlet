# Opening artifacts on a phone

**Pamphlet does not promise "how to open the artifact on a phone", only "the experience once it is open".**

The second part holds completely: opened in a mobile browser (from a local file or a URL), tabs are clickable, diagrams are crisp, and the colour scheme follows the system.

The first part is not something Pamphlet can fix.

## Why it will not open

Two operating-system level restrictions:

- **Since iOS 18.5, Safari no longer allows opening local HTML files directly** (<https://discussions.apple.com/thread/256102223> — an Apple community thread reproduced by several people, not official documentation)
- **WeChat's built-in browser blocks local HTML from executing by default** (Chinese technical community sources, not official documentation)

Together, "send the HTML over chat and the recipient just taps it" is unlikely to work on iOS in 2026.

## Three ways around it

:::steps
1. **On iOS, open it through the Files app.** Save it to Files, long-press, open with Safari. This path does work on iOS.
2. **Have the sender put it on any web server.** The artifact is a single static file — GitHub Pages, object storage, any nginx on a corporate network. No server-side cooperation is required.
3. **Send a PDF instead.** Open the artifact on a computer and print to PDF. You lose interactivity but keep every word — because the no-JavaScript fallback already requires all content to be visible when expanded.
:::

## Why there is no "mobile version"

`--format hosted` (an extra multi-file, hostable output for mobile) was considered and rejected:

- It contradicts the core positioning of a self-contained single file
- It means maintaining a second assembly path and a second test suite
- **And it is subject to the same restriction anyway** — iOS blocks local files, and a multi-file version is still a local file

Any scheme that tries to work around this restriction adds complexity to the artifact and remains restricted.

## The narrowed promise does hold

CSP, `location.hash` deep links, data-URI fonts and `prefers-color-scheme` have all been verified under `file://`. Keeping a promise you cannot deliver does more damage than narrowing it.

> Source: [ADR-0018](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0018-mobile-promise-narrowed.md)
