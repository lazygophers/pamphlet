# 图表围栏只用引擎原生名，不做自有别名

图表围栏的语言名就是引擎自己的名字：`mermaid` / `d2` / `dot` / `vega-lite` / `wavedrom` / `bytefield` / `plantuml`，加一个 `math`（MathJax 没有「原生围栏名」的惯例，所以这个名字是唯一的名字而非别名）。

原始设计里的自有短名 `seq` / `flow` / `state` 全部删除。写时序图就是 ` ```mermaid ` 里面写 `sequenceDiagram`——和在 GitHub、Notion、VS Code 里写 Mermaid 完全一样。（`arch` 更早就因为内置 d2 而删除，见 [0008](./0008-builtin-engines.md)。）

## Considered Options

- **保留 `seq` / `flow` / `state` 作为别名**：作者可以少打几个字。落选：同一件事有两种写法（团队里会混用）、要维护别名到引擎的映射表、别名在 GitHub 上不渲染，而且 `flow` 该映射到 Mermaid 的 `flowchart` 还是 d2 本身就是个需要决定并解释的问题。
- **全部走自有短名、把引擎名藏起来**（`seq` / `flow` / `arch` / `chart` / `wave` / `bits` / `uml`）：语言表面最整齐，将来换引擎不影响源文档。落选：彻底放弃逃生兼容，而且作者写图源时仍然必须懂那个引擎的语法——「隐藏引擎」只隐藏了名字，没有隐藏复杂度。

## Consequences

这是 [0002](./0002-source-extension-is-md.md) 的直接延伸。当初选 `.md` 后缀的全部理由就是让 ` ```mermaid ` 在 GitHub 上能被渲染；如果作者习惯写 ` ```seq `，那个理由就白费了。

作者学到的东西可以带到别处去：他在 Pamphlet 里练会的 Mermaid 语法，在 GitHub issue、Notion 页面、VS Code 预览里同样有效。反过来也成立——别人已经会的 Mermaid 直接就能用。

代价是打字多一点：` ```seq ` 比 ` ```mermaid ` 加一行 `sequenceDiagram` 少两处输入。解法是文档而不是语法——语法手册里给每种图一个可直接复制的起手模板。
