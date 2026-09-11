# 写作总览

**这一页列全了 Pamphlet 认识的每一条语法。** 左边的菜单和这张表是一一对应的：菜单上有的，这里就有；这里没有的，就是不支持。

源文档是标准的 `.md`，直接丢上 GitHub 仍然能读。

## 文本格式

句子内部的东西。

| 写什么 | 长什么样 | 说明 |
|---|---|---|
| [标题](/write/text/headings) | `# 一级` 到 `###### 六级` | 一到六级；第一个 `#` 是文档标题，不进目录 |
| [段落与换行](/write/text/paragraphs) | 空行分段 | 段内换行用行尾反斜杠 |
| [强调](/write/text/emphasis) | `**粗体**` `*斜体*` `~~删除线~~` | 中文用星号，别用下划线 |
| [行内代码](/write/text/inline-code) | `` `代码` `` | 里面原样显示，不解析语法 |
| [转义](/write/text/escaping) | `\*` `\#` `\|` | 让符号显示成它本身 |

## 段落与列表

自己占一块的东西。

| 写什么 | 长什么样 | 说明 |
|---|---|---|
| [引用块](/write/blocks/quote) | `> 引用的话` | 每行都要 `>`，包括空行 |
| [列表](/write/blocks/lists) | `- 项` / `1. 项` / `- [x] 项` | 无序、有序、任务列表；可嵌套 |
| [代码块](/write/blocks/code) | ` ```ts ` 包住几行 | 按语言高亮，编译时做完 |
| [表格](/write/blocks/table) | `\| 列 \| 列 \|` | 可设列对齐；不支持合并单元格 |
| [分隔线](/write/blocks/rule) | 单独一行 `---` | 注意文首的 `---` 是配置不是分隔线 |

## 交互组件

Pamphlet 在标准 Markdown 之上加的五种，统称[容器指令](/write/components/)。写法只有一条规则：`:::name[指令标题]{属性}`。

| 指令 | 干什么 | 指令标题 | 属性 |
|---|---|---|---|
| [`info` `tip` `warn` `danger`](/write/components/callout) | 四种提示块 | 可选 | 不接受 |
| [`tabs` / `tab`](/write/components/tabs) | 标签页，点一下切换 | `tab` **必填** | `default` |
| [`collapse`](/write/components/collapse) | 折叠块，点一下展开 | **必填** | `open` |
| [`steps`](/write/components/steps) | 带编号圆圈的操作步骤 | — | 不接受 |
| [`reveal`](/write/components/reveal) | 滚动到这里才淡入 | — | `effect` |

属性的取值：`default` 和 `open` 都不带值；`effect` 取 `fade-up`（缺省）/ `fade-in` / `slide-left` / `slide-right`。

`class` 与 `id` 写了不报错，但**产物里不会输出**——值被静默丢弃。

## 图表

**两种写法都行**：Pamphlet 自己的结构化写法（`:::flow` 这一路，先列声明再列关系），或者 ` ```mermaid ` 围栏。两种都在**编译时**画成 SVG 内联进产物，读者那边不下载绘图库、也不联网。

自有写法在 GitHub 上不渲染，围栏写法会——要哪一种看你把源文档发到哪里。

| 画什么 | 自有写法 | Mermaid 围栏第一行 |
|---|---|---|
| [流程图](/write/diagrams/flowchart) | `:::flow` | `flowchart LR` |
| [时序图](/write/diagrams/sequence) | `:::sequence` | `sequenceDiagram` |
| [状态图](/write/diagrams/state) | `:::state` | `stateDiagram-v2` |
| [类图](/write/diagrams/class) | `:::class` | `classDiagram` |
| [实体关系图](/write/diagrams/er) | `:::er` | `erDiagram` |
| [甘特图](/write/diagrams/gantt) | `:::gantt` | `gantt` |
| [饼图](/write/diagrams/pie) | `:::pie` | `pie` |
| [架构图](/write/diagrams/architecture) | `:::architecture` | `architecture-beta` |
| [系统上下文图](/write/diagrams/c4) | `:::c4` | `C4Context` |
| [数据流图](/write/diagrams/dataflow) | `:::dataflow` | `flowchart LR` |
| [思维导图](/write/diagrams/mindmap) | `:::mindmap` | `mindmap` |
| [git 分支图](/write/diagrams/gitgraph) | `:::gitgraph` | `gitGraph` |
| [块图](/write/diagrams/block) | `:::block` | `block-beta` |
| [泳道图](/write/diagrams/swimlane) | `:::swimlane` | — Mermaid 画不了 |
| [网络拓扑图](/write/diagrams/topology) | `:::topology` | — Mermaid 画不了 |
| [数据图表](/write/diagrams/chart) | `:::chart` | — Mermaid 画不了 |
| [组织架构图](/write/diagrams/orgchart) | `:::orgchart` | — Mermaid 画不了 |

**前十三种由 [Mermaid](/write/diagrams/mermaid) 画**（要先装一次），自有写法会被翻译成它的图源；**后四种 Mermaid 画不了**，由 Pamphlet 自己算布局、自己出 SVG，编译时不需要浏览器。其余七种引擎（`d2` `dot` `math` `vega-lite` `wavedrom` `bytefield` `plantuml`）**都还没实现**，写了报 `DIAG-301` 并且构建失败，见[其余七种](/write/diagrams/others)。

图片单独一页：[图片与资源](/write/diagrams/images)。

## 整篇文档的设置

不写在正文里，写在文档最开头那对 `---` 之间。

| 字段 | 干什么 |
|---|---|
| `title` | 产物的浏览器标签页标题 |
| `theme` | 用哪一套[内置主题](/reference/themes) |
| `toc` | 目录：开不开、收到第几级、放侧边还是正文开头 |
| `lang` | 产物的语言标记 |
| `spec` | 这份文档要求的最低编译器版本 |

完整说明见 [frontmatter 参考](/reference/frontmatter)。

## 不支持的

| 写了会怎样 | |
|---|---|
| **脚注** `[^1]` | 报 `DOC-105` **错误**。静默丢掉意味着你写的注释凭空消失，所以宁可报错。替代写法见[强调](/write/text/emphasis)旁边的括注，或用 `:::info` |
| **行内公式** `$x$` | 不支持，只有块级 ` ```math ` 围栏，而它本身还没实现 |
| **`:::callout`** | 报 `DIR-201` 警告。`callout` 是四种提示块的统称，不是指令名 |
| **单行指令** `::name[内容]` | 报 `DIR-202`。九个指令全部是容器指令，必须成对冒号包住内容 |

## 还能写 HTML

源文档里的 HTML **原样通过，不做任何过滤**——这既是逃生出口，也是唯一能盖掉主题系统的地方。见[裸 HTML](/write/html)。
