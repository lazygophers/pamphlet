# 裸 HTML 原样通过，不做任何过滤

源文档里的裸 HTML 默认直接渲染成 HTML（用代码块包起来才当代码显示）。这是 CommonMark 的标准行为。**编译器不对它做任何过滤**——`<style>` 标签、`style` 属性、内联 `<svg>` 全部原样进产物。`allow-html` 这个开关不存在：不是「默认关」，而是没有这个概念。

安全上的唯一防线是产物里那份严格 CSP（见 [0017](./0017-strict-csp-in-artifact.md)）。

## CSP 挡住了什么，没挡住什么

挡住的（已实测）：

| 源文档里写的 | 产物里的结果 |
|---|---|
| `<script>alert(1)</script>` | 被拦——`script-src` 只允许运行时那一个哈希 |
| `<img onerror="...">` 等内联事件属性 | 被拦——内联事件处理器需要 `script-src` 里有 `'unsafe-inline'` |
| `<iframe src="https://...">` | 被拦——`default-src 'none'` |
| `<img src="https://...">` | 被拦——`img-src` 只允许 `data:` |
| `<form action="https://...">` | 表单可显示，提交去向被拦 |

**没挡住、且本决定选择不管的两样**：

1. **`<style>` 标签与 `style` 属性**。`style-src 'unsafe-inline'` 是那份 CSP 唯一的松口（样式全部内联，没有别的写法）。因此源文档里一段 `<style>` 可以盖掉整个主题系统，包括 [0020](./0020-theme-tokens-three-layer.md) 的三层 token 和 [0016](./0016-diagram-theming-by-post-processing.md) 用来给图表换色的那组变量。**从别处复制粘贴带 `style` 的 HTML 片段是这种情况最常见的来路。**
2. **内联 `<svg>`**。它绕过图表管线：不经过 [0005](./0005-css-only-animation-strict-svg-sanitisation.md) 的 SVG 消毒、不经过 [0016](./0016-diagram-theming-by-post-processing.md) 的颜色替换，因此可以带 `<animate>` 等 SMIL 标签——那正是 0005 明确不放行的东西。也就是说 **SVG 有两条待遇不同的路径**：引擎产出的 SVG 被严格消毒，作者手写的 SVG 完全不受约束。

## Considered Options

- **原样通过，但剥掉 `<style>` / `style` 属性，并把内联 `<svg>` 送进图表管线的消毒与颜色替换**：精确对应 CSP 挡不住的部分，不重复防同一件事。落选。
- **整体走 DOMPurify 默认白名单**：不自己设计规则，但默认名单随版本漂移，且它默认放行 `style` 属性和 `<svg>`，并不解决上面两个问题。落选。
- **原样通过但对 `style` 给警告**：保留作者控制权。落选。

## Consequences

行为最可预期：作者写什么就是什么，等于 CommonMark 加一个 HTML 渲染器，零意外。这也让「兼容纯 Markdown」这条承诺（见 [0010](./0010-reject-newer-spec.md) 里关于身份标记的修正）没有任何例外。

代价是上面那两条已经写明的漏洞，它们是**明知的、被接受的**：主题系统可以被一份文档破掉，内联 SVG 是绕过所有 SVG 安全规则的通道。

因此有两件事必须做到，否则这个决定的风险不可控：

1. **文档里显式说明这两点**，尤其说明「复制粘贴带 `style` 的 HTML 会让主题失效」——这不是 bug，是设计。
2. **消毒规则的适用范围要在代码里写清楚**：0005 的 SVG 消毒只作用于引擎产出的 SVG。将来若有人认为「所有 SVG 都被消毒过」而基于此做别的决定，就会踩空。

如果日后要收紧，第一个该收的是 `style` 属性——它的收益（保住主题系统）最大、对作者的损失最小。
