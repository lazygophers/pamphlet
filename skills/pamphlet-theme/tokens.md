<!-- 这份文件由 `pnpm skills:sync` 从源码生成，别手改 -->

# 主题 token 清单

两层：语义层是根，元素层默认从语义层派生。覆盖时优先改语义层——改一个，派生的一片跟着变。

## 语义层（18 个）

| 变量 |
|---|
| `--pf-bg` |
| `--pf-bg-subtle` |
| `--pf-fg` |
| `--pf-fg-muted` |
| `--pf-primary` |
| `--pf-border` |
| `--pf-info` |
| `--pf-tip` |
| `--pf-warn` |
| `--pf-danger` |
| `--pf-font-sans` |
| `--pf-font-mono` |
| `--pf-space-1` |
| `--pf-space-2` |
| `--pf-space-3` |
| `--pf-space-4` |
| `--pf-line-height` |
| `--pf-radius` |

## 元素层（16 个）

只引用语义层，不引用别的元素层。只想动某一处时才改这里。

| 变量 | 默认取自 |
|---|---|
| `--pf-link` | `--pf-primary` |
| `--pf-code-bg` | `--pf-bg-subtle` |
| `--pf-table-border` | `--pf-border` |
| `--pf-table-header-bg` | `--pf-bg-subtle` |
| `--pf-quote-border` | `--pf-border` |
| `--pf-quote-fg` | `--pf-fg-muted` |
| `--pf-tab-active-border` | `--pf-primary` |
| `--pf-tab-inactive-fg` | `--pf-fg-muted` |
| `--pf-step-marker-bg` | `--pf-primary` |
| `--pf-step-marker-fg` | `--pf-bg` |
| `--pf-diagram-bg` | `--pf-bg` |
| `--pf-diagram-line` | `--pf-border` |
| `--pf-diagram-fill` | `--pf-bg-subtle` |
| `--pf-diagram-text` | `--pf-fg` |
| `--pf-diagram-accent` | `--pf-primary` |
| `--pf-diagram-muted` | `--pf-fg-muted` |
