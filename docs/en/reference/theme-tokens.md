# Theme tokens

The three-layer structure is in [ADR-0020](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0020-theme-tokens-three-layer.md): the semantic layer is the root, the element layer derives from it by default, and an author only writes what they want to change.

How to change them: [Changing the theme colours](/en/howto/theme).

## Semantic layer (18)

A custom theme almost always only needs a few values from here.

```yaml
# colours
bg:          '#ffffff'   # page background
bg-subtle:   '#f6f8fa'   # secondary background (code blocks, table headers, callouts)
fg:          '#1f2328'   # body text
fg-muted:    '#656d76'   # secondary text
primary:     '#2d6cdf'   # accent (links, emphasis)
border:      '#d0d7de'   # general borders
info:        '#0969da'
tip:         '#1a7f37'
warn:        '#9a6700'
danger:      '#cf222e'

# fonts
font-sans:   '"PingFang SC", "Microsoft YaHei UI", "Microsoft YaHei", "Source Han Sans SC", "Noto Sans CJK SC", sans-serif'
font-mono:   'ui-monospace, "SF Mono", Consolas, monospace'

# spacing (four steps, each double the last)
space-1:     '4px'
space-2:     '8px'
space-3:     '16px'      # the common one (paragraph gaps, list indents, callout padding)
space-4:     '32px'      # section breathing room

# typography
line-height: '1.75'
radius:      '6px'
```

In CSS every name carries the `--pf-` prefix, e.g. `--pf-primary`.

The CJK font stack follows the commonly accepted list (<https://snook.ca/archives/html_and_css/cjk-font-stack-notes>). Line height is 1.75 rather than the browser default 1.5 — the latter is cramped for CJK body text.

Names are semantic (`danger`, not `red`) because one token set serves both light and dark: `red` might actually be pink in the dark theme, which would make the name contradict itself.

## Element layer (16)

Defaults all derive from the semantic layer, and may **reference only the semantic layer, never another element token**. These 16 are all of them; there are no others:

```css
--pf-link:               var(--pf-primary);
--pf-code-bg:            var(--pf-bg-subtle);
--pf-table-border:       var(--pf-border);
--pf-table-header-bg:    var(--pf-bg-subtle);
--pf-quote-border:       var(--pf-border);
--pf-quote-fg:           var(--pf-fg-muted);
--pf-tab-active-border:  var(--pf-primary);
--pf-tab-inactive-fg:    var(--pf-fg-muted);
--pf-step-marker-bg:     var(--pf-primary);
--pf-step-marker-fg:     var(--pf-bg);
--pf-diagram-bg:         var(--pf-bg);
--pf-diagram-line:       var(--pf-border);
--pf-diagram-fill:       var(--pf-bg-subtle);
--pf-diagram-text:       var(--pf-fg);
--pf-diagram-accent:     var(--pf-primary);
--pf-diagram-muted:      var(--pf-fg-muted);
```

The last six are the **diagram layer** — the set [ADR-0016](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0016-diagram-theming-by-post-processing.md) substitutes SVG colours onto. They belong to the element layer and follow exactly the same rules.

:::warning Callouts have no tokens of their own
The four callouts **do not differ in background**; all use `--pf-bg-subtle`. The only difference is the colour of the 3px bar on the left, taken straight from the semantic `--pf-info` / `--pf-tip` / `--pf-warn` / `--pf-danger`.

**They also render no icon.** So there is no `--pf-callout-*-bg` and no `--pf-callout-*-icon`; writing them has no effect.

Likewise there is no `--pf-code-fg` — code text simply inherits `--pf-fg`.
:::

Renaming any of these is expensive: substitution rules, built-in themes and documentation all have to change together.

## The dark set

The dark theme overrides only the ten semantic colours; fonts, spacing, line height and radius are inherited from the light set:

```yaml
bg:          '#0d1117'
bg-subtle:   '#161b22'
fg:          '#e6edf3'
fg-muted:    '#9198a1'
primary:     '#58a6ff'
border:      '#30363d'
info:        '#4493f8'
tip:         '#3fb950'
warn:        '#d29922'
danger:      '#f85149'
```

Both sets live in the output at once and switch via `prefers-color-scheme` — **pure CSS, not a line of JavaScript**. Diagram colours are in the same layer, so the lines and text inside diagrams change with it.
