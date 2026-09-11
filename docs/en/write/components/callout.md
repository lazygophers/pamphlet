# Callouts

## What it is

A small block that steps out of the prose: an aside, a tip, a warning, a danger. Four of them, each its own directive name.

## How to write it

```markdown
:::info[Worth knowing]
Background, extra detail.
:::

:::tip[Do this instead]
"There is an easier way."
:::

:::warn[Careful]
"You will trip on this."
:::

:::danger[Don't]
"This will break, and you cannot undo it."
:::
```

The text in brackets is the [directive label](/en/write/components/) and is **optional**:

```markdown
:::info
A callout with no label.
:::
```

None of the four accept attributes.

## Which one

| Use | When |
|---|---|
| `info` | Extra context; skipping it costs nothing |
| `tip` | There is a cheaper way |
| `warn` | Ignore it and something breaks |
| `danger` | It will break, or it is irreversible |

## What comes out

**A 3px rule down the left**, coloured by type via `--pf-info` / `--pf-tip` / `--pf-warn` / `--pf-danger`; all four share `--pf-bg-subtle` as background.

:::info No icons
The only difference between the four is the colour of that rule. There is currently no way to add icons.
:::

Some themes reshape them: `paper` turns them into margin notes, `lesson` makes `tip` an outlined key box.

## Traps

- **There is no `callout` directive.** It is the collective name for the four; `:::callout` reports `DIR-201` and lists the real names
- **Don't put five on one page.** The only distinction is a rule colour; a page full of callouts has no callouts. At most one `danger` per screen
- With JavaScript off all four look identical — they are pure CSS with no interaction
