# Reveal on scroll

## What it is

A block that fades or slides in when you scroll to it. **Pure visual rhythm; it carries no information.**

## How to write it

```markdown
:::reveal{effect=slide-left}
Slides in when scrolled into view.
:::
```

| Label | Attributes |
|---|---|
| — | `effect` |

## Four effects

| Value | Effect |
|---|---|
| `fade-up` | **default**, fades in and rises 12px |
| `fade-in` | fade only |
| `slide-left` | slides in 16px from the left |
| `slide-right` | slides in 16px from the right |

Any other value reports `DIR-206` and lists the valid ones.

## What comes out

**With JavaScript off the content is simply visible**, with no animation. The test is simple: the animation carries no information, so removing it loses nothing.

Turning on "reduce motion" in the operating system also disables it — via the CSS `prefers-reduced-motion` query, with nothing for the reader to do.

## Traps

:::tip Never hide anything in here
The entire purpose is rhythm. Anything that would be lost without the animation does not belong in this directive.
:::

- Wrapping every block kills the rhythm it was meant to create. Two or three per document is plenty
