# Changing the theme colours

**Check whether a built-in will do first**: the [built-in themes](/en/reference/themes) are sorted by document type, each with its own palette *and* layout, and one flag switches between them.

```bash
pamphlet build plan.md --theme editorial
```

This page is about **tweaking when none of them quite fits** — a `<style>` block in the source file overriding CSS variables. The two combine: pick a theme, then override a value or two.

## Change the accent colour

```markdown
<style>
  :root { --pf-primary: #7c3aed; }
</style>

# My plan

Body text…
```

Links, the active tab underline and the step circles all follow — their defaults derive from `--pf-primary`.

This works because [raw HTML passes through untouched](/en/write/markdown/commonmark).

## Change a whole palette

What you write on `:root` is **what the screen shows** — the output is always dark and never consults the reader's system setting, so these should be your dark values:

```markdown
<style>
  :root {
    --pf-primary: #a78bfa;
    --pf-bg: #1a1614;
    --pf-fg: #ede4d8;
    --pf-bg-subtle: #251f1b;
    --pf-border: #3a322c;
  }
  /* Printing is the one place light is still used */
  @media print {
    :root {
      --pf-primary: #7c3aed;
      --pf-bg: #fffbf5;
      --pf-fg: #2a2118;
      --pf-bg-subtle: #f5efe6;
      --pf-border: #ded3c4;
    }
  }
</style>
```

Leaving the `@media print` block out is fine: printing then falls back to the built-in theme's own light values, which is usually what you want.

All 18 semantic variables are in [Theme tokens](/en/reference/theme-tokens).

## Change one thing only

Element-layer variables derive from the semantic layer, so you can override just one:

```css
:root {
  --pf-code-bg: #1e1e2e;   /* only the code block background */
}
```

## Diagrams follow too

Diagram colours come from six variables in the same set:

```css
:root {
  --pf-diagram-accent: #ff6b6b;   /* the accent colour inside diagrams */
}
```

Hard-coded colours in engine output that could not be substituted report `DIAG-304` and are listed — those will not follow the theme.

## Three costs

:::danger This `<style>` block has no limits
It can override the whole theme system, including parts you did not intend to touch. A misspelled variable name produces no warning of any kind.
:::

- **Every document repeats it.** There is no shared config; the source file carries all configuration. To swap a whole theme, use `--theme` or frontmatter instead of repeating this.
- **It affects the output, not the source's readability.** On GitHub that `<style>` shows up as plain text.
- **Variable names may change during 0.x.** Renaming is expensive (substitution rules, built-in themes and docs must change together), but nothing is promised.
