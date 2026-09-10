# Callouts

Four of them: `info` / `tip` / `warn` / `danger`.

```markdown
:::info[By the way]
Neutral information.
:::

:::tip
A shortcut. The label is optional.
:::

:::warn[Careful]
This can go wrong.
:::

:::danger[Don't do this]
This will go wrong.
:::
```

| Label | Attributes |
|---|---|
| Optional | Accepts none |

## There is no `callout` directive

**`callout` is the collective name for these four, not a directive you can write.** `:::callout` gets a `DIR-201` warning whose hint lists the four real names.

## What they look like

In the output each callout is a **3px bar down the left**, coloured per type from `--pf-info` / `--pf-tip` / `--pf-warn` / `--pf-danger`. All four share `--pf-bg-subtle` as their background.

:::info No icons
Callouts **render no icon at all**. The only difference between the four is the colour of that left-hand bar. There is currently no way to add one.
:::

## Which to use

| Use | When |
|---|---|
| `info` | Extra context; skipping it costs nothing |
| `tip` | There is an easier way |
| `warn` | Ignoring this causes trouble |
| `danger` | This will break, or cannot be undone |

All four behave identically without JavaScript — they are pure CSS with no interactivity.
