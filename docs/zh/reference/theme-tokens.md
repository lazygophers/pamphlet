# 主题 token 清单

三层结构见 [ADR-0020](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0020-theme-tokens-three-layer.md)：语义层是根，元素层默认从语义层派生，作者只写想改的。

怎么改见[换一套主题色](/howto/theme)。

## 语义层（18 个）

自定义主题绝大多数情况只需要改这里的几个值。

```yaml
# 颜色
bg:          '#ffffff'   # 页面底色
bg-subtle:   '#f6f8fa'   # 次级底色（代码块、表头、提示块）
fg:          '#1f2328'   # 正文色
fg-muted:    '#656d76'   # 次要文字
primary:     '#2d6cdf'   # 主色（链接、强调）
border:      '#d0d7de'   # 通用边框
info:        '#0969da'   # 提示
tip:         '#1a7f37'   # 补充说明
warn:        '#9a6700'   # 警告
danger:      '#cf222e'   # 危险

# 字体
font-sans:   '"PingFang SC", "Microsoft YaHei UI", "Microsoft YaHei", "Source Han Sans SC", "Noto Sans CJK SC", sans-serif'
font-mono:   'ui-monospace, "SF Mono", Consolas, monospace'

# 间距（四档，每档翻倍）
space-1:     '4px'       # 行内间隙
space-2:     '8px'       # 紧凑
space-3:     '16px'      # 常规（段落间距、列表缩进、提示块内边距）
space-4:     '32px'      # 章节留白

# 排版
line-height: '1.75'      # 正文行高
radius:      '6px'       # 圆角
```

在 CSS 里的名字全部带 `--pf-` 前缀，例如 `--pf-primary`。

中文字体栈来自公认写法（<https://snook.ca/archives/html_and_css/cjk-font-stack-notes>）。行高取 1.75 而非浏览器默认的 1.5 —— 后者对中文正文偏挤。

命名一律语义化（`danger` 而不是 `red`），因为同一套 token 要同时服务亮暗两套主题：`red` 在暗色主题里可能其实是粉色，那种命名会自相矛盾。

## 元素层（16 个）

默认值全部从语义层派生，**只能引用语义层，不能引用其它元素层**。这 16 个就是全部，没有别的：

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

最后六个是**图表层** —— [ADR-0016](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0016-diagram-theming-by-post-processing.md) 做 SVG 颜色替换时就是往这六个变量上换。它们属于元素层，规则完全相同。

:::warning 提示块没有专属变量
四种提示块**不区分底色**，统一用 `--pf-bg-subtle`；区别只在左边那条 3px 竖线的颜色，直接取语义层的 `--pf-info` / `--pf-tip` / `--pf-warn` / `--pf-danger`。

**也不渲染任何图标。** 所以没有 `--pf-callout-*-bg`、没有 `--pf-callout-*-icon`，写了不起作用。

同理没有 `--pf-code-fg` —— 代码块的文字色直接继承正文的 `--pf-fg`。
:::

改名的代价很高：替换规则、内置主题、文档三处要同时改。

## 深色一套

深色主题只覆盖语义层的十个颜色，字体、间距、行高、圆角全部沿用亮色那套：

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

产物里两套同时存在，靠 `prefers-color-scheme` 切换 —— **纯 CSS，没有一行 JavaScript 参与**。图表的颜色也在这一层，所以切深色时图里的线和字跟着一起变。
