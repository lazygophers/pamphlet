# 写作

Pamphlet 的语法是 **CommonMark 严格超集**：标准 Markdown 的一切照常工作，另外加两样东西。

| 你想写的东西 | 写在哪一页 |
|---|---|
| 标题（六级）、段落、换行、粗体斜体、引用块、列表、代码块、链接、图片、分隔线、转义 | [Markdown 基础语法](/write/markdown/commonmark) |
| **表格**（含列对齐）、删除线、任务列表、自动链接 | [GFM 扩展](/write/markdown/gfm) |
| 提示块、标签页、折叠块、步骤、滚动入场 | [九个指令](/write/directives/) |
| 流程图、时序图、架构图、数据流图、C4、甘特图…… | [图表围栏](/write/diagrams/) |
| 插图、内嵌字体、体积上限 | [图片与资源](/write/assets) |
| 文档标题、目录、主题、语言 | [frontmatter 参考](/reference/frontmatter) |

**前两行是标准 Markdown**，后面才是 Pamphlet 加的东西。每一页都把语法逐条写全，不会用「和标准 Markdown 一样」带过去。

要查某个指令接什么参数，去[语法速查表](/reference/syntax)，那一页只有表格没有讲解。

## 源文档没有专属后缀

源文档就是 `.md`，直接丢上 GitHub 仍然能读：指令会被当成普通段落，图表围栏里 ` ```mermaid ` 会被 GitHub 原生渲染。

这叫**逃生兼容** —— 你的内容不会被锁在 Pamphlet 里。
