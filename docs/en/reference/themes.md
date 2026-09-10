# Built-in themes

Twelve of them, **sorted by what the document is, not by how it looks**. Each carries its own palette *and* its own layout — body width, heading system, callout shape, tab shape and table rules all differ.

```bash
pamphlet build plan.md --theme incident
```

Or put it in the source file so it travels with the document:

```yaml
---
theme: incident
---
```

**`--theme` overrides frontmatter.** The command line is the intent of *this one compile*; frontmatter is how the document usually looks. A one-off intent should win.

An unknown name reports `DOC-106` and **falls back to `default`, still producing output**: a wrong theme only affects how it looks; the content is fine.

## At a glance

| Theme | What it is for |
|---|---|
| [`default`](#default) | when in doubt |
| [`minimal`](#minimal) | short pieces, essays, one-pagers |
| [`tech-dark`](#tech-dark) | technical content, dark by preference |
| [`editorial`](#editorial) | formal proposals, white papers |
| [`console`](#console) | runbooks, dashboard docs |
| [`paper`](#paper) | research notes, paper-style writing |
| [`fiction`](#fiction) | novel chapters, narrative |
| [`manual`](#manual) | technical docs, API references |
| [`prd`](#prd) | product requirements |
| [`architecture`](#architecture) | system design documents |
| [`blueprint`](#blueprint) | detailed design documents |
| [`incident`](#incident) | incident reports, post-mortems |

---

## default

Neutral. It is the fallback, so it is the hardest to get wrong and the least likely to compete with your content.

![the default theme](/themes/default.png)

## minimal

Black, white, grey and one hairline. A narrow column, generous whitespace, serif headings, square corners. Callouts shrink to a rule plus a small label.

![the minimal theme](/themes/minimal.png)

## tech-dark

Monospace headings, sharp corners, a cyan accent, the `##` marker shown before the heading. Callouts are filled blocks with a coloured top rule.

![the tech-dark theme](/themes/tech-dark.png)

## editorial

A magazine spread. A 3.2rem serif display, `01` `02` section numbers, masthead-style tabs, pull quotes framed by rules, tables with rules only top and bottom.

![the editorial theme](/themes/editorial.png)

## console

A panel you keep an eye on. Monospace throughout, a ruled sidebar, bracketed callout labels, segmented-control tabs, dense tables.

![the console theme](/themes/console.png)

## paper

A paper. Serif body, `1.` `2.` numbered sections, italic third-level headings, callouts as margin notes, booktabs-style rules.

![the paper theme](/themes/paper.png)

## fiction

Set for continuous reading: a narrow column, **first-line indents and no gap between paragraphs**, a drop cap, and scene breaks as centred dots. Callouts become authorial asides.

![the fiction theme](/themes/fiction.png)

## manual

Code blocks lead: a coloured rule down the left and more padding. **Sticky table headers** and zebra striping for long tables, folder-tab switching.

![the manual theme](/themes/manual.png)

## prd

Every second-level heading is **a numbered requirement with an `R01` badge**. Acceptance lists are real checkboxes, callouts become constraint cards, tabs are pill segments.

![the prd theme](/themes/prd.png)

## architecture

Diagrams get the widest canvas (94rem) and a frame. Block quotes render as decision records, tables are booktabs, headings carry a `§` number.

![the architecture theme](/themes/architecture.png)

## blueprint

Density first. **Three-level numbering `1` / `1.1` / `1.1.1`**, monospace headings, tight field tables — for the person implementing it line by line.

![the blueprint theme](/themes/blueprint.png)

## incident

**Steps become a timeline** (a rule with red nodes). The title carries an "incident report" eyebrow, `danger` outranks everything else on the page, and the impact table reads at a glance.

![the incident theme](/themes/incident.png)

---

## Every theme holds the same line

A theme may change the layout, but **these four apply to all twelve alike**, pinned by browser-level tests per theme:

| The line | How it is checked |
|---|---|
| With JavaScript off, both tab panels are visible | A real browser with JS disabled |
| Collapsibles degrade to native `<details>`, content intact | Reads the `<details>` text from the DOM |
| Body text is at least 14px | Reads `getComputedStyle` |
| With JavaScript on, only the selected panel shows, and it switches | Actually clicks, then asserts |

**A new theme has to pass all four** — the tests iterate the theme list, so adding one covers it automatically.

## The side menu

The table of contents is a **sticky side menu** by default, pure CSS with no JavaScript:

```yaml
---
toc:
  enable: true
---
```

Below 60rem it falls back to the top of the document. To keep it inline, write `toc: { position: top }` — see the [frontmatter reference](/en/reference/frontmatter).

## Tweaking one thing

To change a colour or two rather than swap the whole theme, see [Changing the theme colours](/en/howto/theme). The two combine: pick `--theme paper`, then override `--pf-primary`.

All 18 semantic and 16 element tokens are in [Theme tokens](/en/reference/theme-tokens).

> Source: [ADR-0046](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0046-themes-carry-their-own-css.md)
