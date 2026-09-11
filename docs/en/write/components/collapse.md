# Collapsibles

## What it is

A block that starts closed and opens on click. For **detail most readers don't need**: full configuration, raw logs, appendices.

## How to write it

```markdown
:::collapse[Show the details]
Hidden content goes here.
:::

:::collapse[This one starts open]{open}
`{open}` starts it expanded.
:::
```

| Label | Attributes |
|---|---|
| **required** | `open` |

**The label is required**; without it you get `DIR-204`. The reason is concrete: with JavaScript off this degrades to a native `<details>`, and the label is its `<summary>` — without one there is nothing to click.

## What comes out

A disclosure row with a triangle.

**With JavaScript off it is a native `<details>` and still opens**; `{open}` maps to `<details open>`. This is the cleanest degradation of the interactive directives, because the browser has the element built in.

With JavaScript it does one extra thing: opening writes the label into the URL, so you can send someone the opened state.

## Traps

- **Don't hide anything important** — same reason as [tabs](/en/write/components/tabs): the content is always in the DOM and searchable
- Save `{open}` for "most people need this but it takes space". A collapsible that starts open only offers the ability to close it
