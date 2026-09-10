# Collapsible block

Folded by default; click the label to open. For details, appendices, long config dumps.

```markdown
:::collapse[Advanced options]{open}
Open by default. Drop `{open}` and it starts folded.
:::
```

| Label | Attributes |
|---|---|
| **Required** | `open` |

## The label is required

Missing it reports `DIR-204`, for a concrete reason: **without JavaScript this degrades to a native `<details>` and the label becomes the `<summary>`** — with no label there is nothing to click at all.

## With JavaScript off

It becomes the browser's own `<details>` and still opens. `{open}` maps to `<details open>`.

Of the four interactive directives this one degrades most cleanly: the browser already has the matching element.
