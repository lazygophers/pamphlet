# 主题 token 清单

三层结构见 [ADR-0020](./adr/0020-theme-tokens-three-layer.md)：语义层是根，元素层默认从语义层派生，作者只写想改的。

## 语义层（18 个）

自定义主题绝大多数情况只需要改这里的几个值。

```yaml
# 颜色
bg:          '#ffffff'   # 页面底色
bg-subtle:   '#f6f8fa'   # 次级底色（代码块、表头）
fg:          '#1f2328'   # 正文色
fg-muted:    '#656d76'   # 次要文字（说明、脚注）
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
space-3:     '16px'      # 常规（段落间距、列表缩进、callout 内边距）
space-4:     '32px'      # 章节留白

# 排版
line-height: '1.75'      # 正文行高
radius:      '6px'       # 圆角
```

中文字体栈来自公认写法（<https://snook.ca/archives/html_and_css/cjk-font-stack-notes>）。行高取 1.75 而非浏览器默认的 1.5——后者对中文正文偏挤。

命名一律语义化（`danger` 而不是 `red`），因为同一套 token 要同时服务亮暗两套主题：`red` 在暗色主题里可能其实是粉色，那种命名会自相矛盾。

## 元素层（30+ 个）

默认值全部从语义层派生，**只能引用语义层，不能引用其它元素层**。示例：

```css
--pf-table-border:       var(--pf-border);
--pf-table-header-bg:    var(--pf-bg-subtle);
--pf-code-bg:            var(--pf-bg-subtle);
--pf-code-fg:            var(--pf-fg);
--pf-quote-border:       var(--pf-border);
--pf-quote-fg:           var(--pf-fg-muted);
--pf-link:               var(--pf-primary);
--pf-callout-info-bg:    /* info 的低饱和版本 */;
--pf-callout-info-icon:  var(--pf-info);
--pf-callout-tip-bg:     /* tip 的低饱和版本 */;
--pf-callout-tip-icon:   var(--pf-tip);
--pf-callout-warn-bg:    /* warn 的低饱和版本 */;
--pf-callout-warn-icon:  var(--pf-warn);
--pf-callout-danger-bg:  /* danger 的低饱和版本 */;
--pf-callout-danger-icon:var(--pf-danger);
--pf-tab-active-border:  var(--pf-primary);
--pf-tab-inactive-fg:    var(--pf-fg-muted);
--pf-step-marker-bg:     var(--pf-primary);
--pf-step-marker-fg:     var(--pf-bg);
```

## 图表层

属于元素层，是 [ADR-0016](./adr/0016-diagram-theming-by-post-processing.md) 做 SVG 颜色替换时指向的那组：

```css
--pf-diagram-bg:      var(--pf-bg);
--pf-diagram-line:    var(--pf-border);
--pf-diagram-fill:    var(--pf-bg-subtle);
--pf-diagram-text:    var(--pf-fg);
--pf-diagram-accent:  var(--pf-primary);
--pf-diagram-muted:   var(--pf-fg-muted);
```

改名的代价很高：替换规则、内置主题、文档三处要同时改。
