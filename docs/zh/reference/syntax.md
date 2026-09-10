# 语法速查表

只有表，没有讲解。要看例子和为什么，去[写作](/write/)。

## 一条规则

`:::name[标题]{属性}` —— **`[标题]` 给读者看，`{属性}` 给编译器看。**

嵌套时**外层冒号必须比内层多**。

## 九个指令

| 指令 | 标题 | 属性 | 必须包含 | 详情 |
|---|---|---|---|---|
| `tabs` | — | — | 至少一个 `tab` | [标签页](/write/directives/tabs) |
| `tab` | **必填** | `default` | — | [标签页](/write/directives/tabs) |
| `collapse` | **必填** | `open` | — | [折叠块](/write/directives/collapse) |
| `steps` | — | — | 一个有序列表 | [步骤](/write/directives/steps) |
| `reveal` | — | `effect` | — | [滚动入场](/write/directives/reveal) |
| `info` | 可选 | — | — | [提示块](/write/directives/callout) |
| `tip` | 可选 | — | — | [提示块](/write/directives/callout) |
| `warn` | 可选 | — | — | [提示块](/write/directives/callout) |
| `danger` | 可选 | — | — | [提示块](/write/directives/callout) |

属性取值：

| 属性 | 取值 |
|---|---|
| `default` | 无值，同一组 `tabs` 里最多一个 |
| `open` | 无值 |
| `effect` | `fade-up`（缺省）/ `fade-in` / `slide-left` / `slide-right` |

`class` 与 `id` 写了不报错，但**产物里不会输出** —— 值被静默丢弃。

## 八种图表围栏

| 语言 | 引擎 | 本版本 |
|---|---|---|
| `mermaid` | Mermaid | ✅ 已实现 |
| `d2` | d2 | 计划中 |
| `dot` | Graphviz | 计划中 |
| `math` | MathJax v3 | 计划中 |
| `vega-lite` | Vega-Lite | 计划中 |
| `wavedrom` | WaveDrom | 计划中 |
| `bytefield` | bytefield-svg | 计划中 |
| `plantuml` | PlantUML | 计划中 |

「计划中」写了报 `DIAG-301`，构建失败。

## Markdown 本身

| 语法 | 支持 |
|---|---|
| CommonMark 全部 | ✅ |
| GFM 表格 | ✅ |
| GFM 删除线 `~~x~~` | ✅ |
| GFM 任务列表 `- [x]` | ✅（只读） |
| GFM 自动链接 | ✅ |
| 裸 HTML | ✅ 原样通过，不过滤 |
| **GFM 脚注 `[^1]`** | ❌ 报 `DOC-105` |
| **行内公式 `$x$`** | ❌ 只有块级 ` ```math ` |

## frontmatter 字段

| 字段 | 类型 | 缺省 |
|---|---|---|
| `spec` | 整数 | 不填 = 不检查 |
| `title` | 字符串 | 第一个 `#` 标题 |
| `theme` | 字符串 | ⚠️ 未接入 |
| `lang` | 字符串 | `zh-CN` |
| `toc` | 布尔或对象 | 关 |
| `engines` | 对象 | ⚠️ 未实现 |

`toc` 的子字段：`enable`（布尔，缺省 `false`）/ `deep`（1–6，缺省 `2`）/ `skipTabs`（布尔，缺省 `true`）/ `position`（`top` / `side`，`side` 报错）。

完整说明见 [frontmatter 参考](/reference/frontmatter)。
