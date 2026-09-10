# Built-in themes

Six of them. Each is **its own palette and its own layout** — not just different colours: body width, heading system, and the shape of callouts and tabs all differ.

```bash
pamphlet build plan.md --theme notebook
```

Or put it in the source file so it travels with the document:

```yaml
---
theme: notebook
---
```

**`--theme` overrides frontmatter.** The command line is the intent of *this one compile*; frontmatter is how the document usually looks. A one-off intent should win — batch-previewing a set of documents in another theme should not mean editing every source file.

An unknown name reports `DOC-106` and **falls back to `default`, still producing output** — a wrong theme only affects how it looks; the content is fine.

---

## default

Neutral, GitHub's palette. It is the fallback, so it is the hardest to get wrong and the least likely to compete with your content.

![the default theme](/themes/default.png)

## minimal

Black, white, grey and one hairline. A narrow 38rem column, generous whitespace, serif headings, square corners. Callouts shrink to a single rule plus a small label, with no fill.

![the minimal theme](/themes/minimal.png)

## tech-dark

Monospace headings, sharp corners, a cyan accent. The `##` marker is shown before the heading. Callouts become a filled block with a coloured top rule, so the four kinds are easy to tell apart.

![the tech-dark theme](/themes/tech-dark.png)

## notebook

Ruled-paper background, with `line-height: 2` so the text sits on the lines. Serif headings, sticky-note callouts with a small drop shadow, index-tab styled tabs.

The ruling is a `repeating-linear-gradient` — **no image is referenced**, so self-containment still holds.

![the notebook theme](/themes/notebook.png)

## receipt

A till receipt. Monospace throughout, a 34rem column, dashed rules, centred uppercase headings. Callouts are dashed boxes with bracketed titles; steps are squared numbers.

![the receipt theme](/themes/receipt.png)

## glass

Glassmorphism. A coloured halo background, frosted translucent panels, pill-shaped tabs.

The halo is three radial gradients, pure CSS. Where `backdrop-filter` is unsupported, the frost degrades to a plain translucent fill and the content stays readable.

![the glass theme](/themes/glass.png)

---

## Every theme holds the same line

A theme may change the layout, but **these four apply to all six alike**, pinned by 24 browser-level tests (`test/theme-degradation.test.ts`):

| The line | How it is checked |
|---|---|
| With JavaScript off, both tab panels are visible | A real browser with JS disabled |
| Collapsibles degrade to native `<details>`, content intact | Reads the `<details>` text from the DOM |
| Body text is at least 14px | Reads `getComputedStyle` |
| With JavaScript on, only the selected panel shows, and it switches | Actually clicks, then asserts |

**A new theme has to pass all four.** That is not optional.

## Tweaking one thing

To change a colour or two rather than swap the whole theme, see [Changing the theme colours](/en/howto/theme) — a `<style>` block in the source file overriding CSS variables. The two combine: pick `--theme glass`, then override `--pf-primary`.

All 18 semantic and 16 element tokens are in [Theme tokens](/en/reference/theme-tokens).

> Source: [ADR-0046](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0046-themes-carry-their-own-css.md)
