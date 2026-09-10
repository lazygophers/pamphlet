# Theme tokens

Three layers ([ADR-0020](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0020-theme-tokens-three-layer.md)): the semantic layer is the root, the element layer derives from it by default, and an author only writes what they want to change.

## Semantic layer (18 tokens)

A custom theme almost always only needs a few values here.

```yaml
# Colours
bg:          '#ffffff'   # page background
bg-subtle:   '#f6f8fa'   # secondary background (code blocks, table headers)
fg:          '#1f2328'   # body text
fg-muted:    '#656d76'   # secondary text (notes, footnotes)
primary:     '#2d6cdf'   # primary colour (links, emphasis)
border:      '#d0d7de'   # generic border
info:        '#0969da'   # info callout
tip:         '#1a7f37'   # tip callout
warn:        '#9a6700'   # warning callout
danger:      '#cf222e'   # danger callout

# Fonts
font-sans:   '"PingFang SC", "Microsoft YaHei UI", "Microsoft YaHei", "Source Han Sans SC", "Noto Sans CJK SC", sans-serif'
font-mono:   'ui-monospace, "SF Mono", Consolas, monospace'

# Spacing (four steps, each doubling)
space-1:     '4px'       # inline gap
space-2:     '8px'       # tight
space-3:     '16px'      # normal (paragraph spacing, list indent, callout padding)
space-4:     '32px'      # section whitespace

# Typography
line-height: '1.75'      # body line height
radius:      '6px'       # corner radius
```

The CJK font stack follows the commonly accepted list (<https://snook.ca/archives/html_and_css/cjk-font-stack-notes>). The line height is 1.75 rather than the browser default 1.5 — the latter is cramped for CJK body text.

Names are semantic (`danger`, not `red`) because one token set serves both light and dark themes: in a dark theme `red` might actually be pink, and that naming would contradict itself.

## Element layer (30+ tokens)

Every default derives from the semantic layer, and it **may only reference the semantic layer, never another element token**. Examples:

```css
--pf-table-border:       var(--pf-border);
--pf-table-header-bg:    var(--pf-bg-subtle);
--pf-code-bg:            var(--pf-bg-subtle);
--pf-code-fg:            var(--pf-fg);
--pf-quote-border:       var(--pf-border);
--pf-quote-fg:           var(--pf-fg-muted);
--pf-link:               var(--pf-primary);
--pf-callout-info-bg:    /* desaturated info */;
--pf-callout-info-icon:  var(--pf-info);
--pf-callout-tip-bg:     /* desaturated tip */;
--pf-callout-tip-icon:   var(--pf-tip);
--pf-callout-warn-bg:    /* desaturated warn */;
--pf-callout-warn-icon:  var(--pf-warn);
--pf-callout-danger-bg:  /* desaturated danger */;
--pf-callout-danger-icon:var(--pf-danger);
--pf-tab-active-border:  var(--pf-primary);
--pf-tab-inactive-fg:    var(--pf-fg-muted);
--pf-step-marker-bg:     var(--pf-primary);
--pf-step-marker-fg:     var(--pf-bg);
```

## Diagram layer

Part of the element layer; this is the group that SVG colour rewriting targets ([ADR-0016](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0016-diagram-theming-by-post-processing.md)):

```css
--pf-diagram-bg:      var(--pf-bg);
--pf-diagram-line:    var(--pf-border);
--pf-diagram-fill:    var(--pf-bg-subtle);
--pf-diagram-text:    var(--pf-fg);
--pf-diagram-accent:  var(--pf-primary);
--pf-diagram-muted:   var(--pf-fg-muted);
```

Renaming these is expensive: the rewriting rules, the built-in themes and the documentation all have to change together.

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

Both sets exist in the artifact simultaneously and switch on `prefers-color-scheme` — **pure CSS, with no JavaScript involved**. Diagram colours live in this layer too, so strokes and labels change with everything else.

## How to change them today

:::warning Only one route right now
The `theme` frontmatter field is not wired into the compiler yet (see the [frontmatter reference](/en/reference/frontmatter)), and the three built-in theme names in `@pamphlet/themes` are not connected either.

The only way today is a `<style>` block in the source overriding the CSS variables — raw HTML passes through untouched, so this works:

```html
<style>
  :root { --pf-primary: #7c3aed; }
</style>
```

The cost is covered in [raw HTML passes through untouched](/en/limits/raw-html): that `<style>` has no restrictions at all, and getting it wrong can flatten the whole theme system.
:::
