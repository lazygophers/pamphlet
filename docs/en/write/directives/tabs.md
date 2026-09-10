# Tabs

Several views of the same topic; the reader clicks to switch.

```markdown
::::tabs

:::tab[Deployment view]{default}
Two availability zones, active-passive.
:::

:::tab[Cost view]
About $450 a month.
:::

::::
```

| Directive | Label | Attributes |
|---|---|---|
| `tabs` | — | Accepts none |
| `tab` | **Required** | `default` |

## Four rules

- **More colons on the outside.** `::::tabs` around `:::tab`. Equal counts report `DIR-202`
- **A `tab` label is required.** It *is* the clickable button; without it there is nothing to click — `DIR-204`
- **A `tabs` needs at least one `tab`.** Empty reports `DIR-204`
- **A `tab` must sit directly inside a `tabs`.** Anywhere else reports `DIR-202`

## Only one `{default}`

More than one in a group reports `DIR-205`. With none, the first tab is selected.

:::info Why an error rather than taking the first
Guessing silently produces output that differs from your intent — you think "Cost view" opens by default, the reader sees "Deployment view", and nothing tells you.
:::

## With JavaScript off

**All panels are expanded and nothing is lost.** Each `tab` label degrades into an ordinary section heading.

This is the starting point rather than a patch: tabs first have a script-free form (a few expanded sections), and the switching script is layered on top.

## Tab labels are hidden from the ToC by default

Tab labels are real headings for accessibility and deep linking, so they inevitably enter the document outline. But semantically they are "views of one topic", and in a table of contents they read as separate chapters.

Hence `toc.skipTabs` defaults to `true` — see [Frontmatter reference](/en/reference/frontmatter).
