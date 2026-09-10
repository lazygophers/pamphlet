# Scroll-in animation

The block fades or slides in when you scroll to it. It paces a long document; it carries no information.

```markdown
:::reveal{effect=slide-left}
Slides in when you scroll here.
:::
```

| Label | Attributes |
|---|---|
| — | `effect` |

## Four effects

| Value | Effect |
|---|---|
| `fade-up` | **Default**, fades in and rises 12px |
| `fade-in` | Fades only |
| `slide-left` | Slides in 16px from the left |
| `slide-right` | Slides in 16px from the right |

Any other value reports `DIR-206`, and the diagnostic lists all the valid ones.

## With JavaScript off

**The content is simply visible**, with no animation. The test is simple: the animation carries no information, so removing it loses nothing.

## With reduced motion on

When "reduce motion" is enabled in the system settings (macOS Accessibility, Windows animation settings), the animation turns itself off and the content is simply visible — via the CSS `prefers-reduced-motion` query, with nothing for the reader to do.

:::tip Do not hide anything important in here
This directive exists purely for visual pacing. Anything that would be lost when there is no animation does not belong in it.
:::
