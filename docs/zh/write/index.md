# 写作

Pamphlet 的语法是 **CommonMark 严格超集**：标准 Markdown 的一切照常工作，另外加两样东西。

| 你想做什么 | 用什么 |
|---|---|
| 普通正文、标题、列表、链接 | [CommonMark 基础](/write/markdown/commonmark) |
| 表格、删除线、任务列表 | [GFM 扩展](/write/markdown/gfm) |
| 提示框、标签页、折叠、步骤 | [九个指令](/write/directives/) |
| 流程图、时序图 | [图表围栏](/write/diagrams/) |
| 插图、字体 | [图片与资源](/write/assets) |

要查某个指令接什么参数，去[语法速查表](/reference/syntax)，那一页只有表格没有讲解。

## 源文档没有专属后缀

源文档就是 `.md`，直接丢上 GitHub 仍然能读：指令会被当成普通段落，图表围栏里 ` ```mermaid ` 会被 GitHub 原生渲染。

这叫**逃生兼容** —— 你的内容不会被锁在 Pamphlet 里。
