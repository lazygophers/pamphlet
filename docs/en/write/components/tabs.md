# Tabs

## What it is

**Several views of one topic**, switched by a click, one visible at a time.

For example one plan seen as "deployment / cost / risk", or one command written for macOS and for Linux.

It is **not** for several unrelated things — that is what [headings](/en/write/text/headings) are for.

## How to write it

```markdown
::::tabs

:::tab[Deployment view]{default}
Two availability zones, three machines each.
:::

:::tab[Cost view]
About $450 a month.
:::

::::
```

| Directive | Label | Attributes |
|---|---|---|
| `tabs` | — | none |
| `tab` | **required** | `default` |

### Four rules

- **The outer fence needs more colons**: `::::tabs` around `:::tab`. Equal colons reports `DIR-202` — the first `:::` closes the outer one
- **A `tab` label is required**: it *is* the clickable button. Missing it reports `DIR-204`
- **`tabs` needs at least one `tab`**; empty reports `DIR-204`
- **`tab` may only sit directly inside `tabs`**; elsewhere reports `DIR-202`

### Only one `{default}`

Two or more reports `DIR-205`; with none, the first tab is selected.

:::info Why an error rather than taking the first
Guessing silently produces output that differs from your intent — you believe "Cost view" opens first, the reader sees "Deployment view", and nothing tells you.
:::

## What comes out

A row of buttons and a panel. Button styling is up to the theme: `editorial` uses a masthead style, `console` a segmented control, `manual` folder tabs.

**With JavaScript off all panels are expanded**, each tab's label degrading to an ordinary sub-heading. Not a word is lost. That is the starting point, not a patch.

## Traps

- **Keep the panels comparable in length.** Three lines against three screens reads as "the short one is unfinished"
- **Don't hide anything important**: with JavaScript off everything is expanded, and the content is always in the DOM
- Tab labels are **real headings** for accessibility and deep linking, so they enter the outline — which is why the ToC skips them by default (`toc.skipTabs`)
