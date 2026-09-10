# 自研 Pamphlet，不在 Quarto 上做扩展

调研确认：没有任何现成工具同时做到「自包含 + 图表预渲染为静态 SVG + 交互可点 + 无 JavaScript 时可降级」。最接近的是 Quarto，而且它的缺口本来是可以补上的——但方向不兼容，因此自研。

## Considered Options

**Quarto**（<https://quarto.org/docs/output-formats/html-basics.html>）：`embed-resources: true` 已经实现自包含（data: URI 内联 JS/CSS/图片），`.panel-tabset` 已经实现 Tab 交互，`mermaid-format: svg` 是官方内置开关、可以强制图表预渲染。也就是说走 Quarto 路线**不需要写任何 Pandoc filter**。它的已知缺口只有一个：默认会把整个 Mermaid.js 塞进产物让浏览器现场画图，官方自己承认 Mermaid「doesn't produce the correct output in self-contained mode」（<https://github.com/orgs/quarto-dev/discussions/669>）。

落选的决定性理由是**方向不兼容，而非工作量**：

1. **Quarto 用的是 Pandoc Markdown 方言，不是 CommonMark。** Pamphlet 的核心承诺——「语法是 CommonMark 严格超集」「源文档沿用 `.md` 后缀」「逃生兼容」（见 [0002](./0002-source-extension-is-md.md)）——全部建立在 CommonMark 之上。在 Quarto 上做，这条承诺根本无法成立。
2. **它要装一个约 100MB 的二进制**，且面向 R / Python 数据科学生态，与「npm 生态里的一个 Markdown 工具」这个定位错位。
3. **交互清单更宽**：`:::steps` 步骤揭示、滚动动效、可缩放图表，Quarto 都没有。

**其余候选全部出局**：Pandoc `--embed-resources` 有自包含但无交互无图表（<https://pandoc.org/MANUAL.html>）；Marp 官方明确不支持自包含打包（<https://github.com/orgs/marp-team/discussions/516>）；Docusaurus / Astro 没有单文件导出；Typst 的 HTML 导出仍是实验性，官方标注 not for production use（<https://typst.app/docs/reference/html/>）；Asciidoctor + Kroki 能内联但有图表静默失败的已知 bug（<https://github.com/asciidoctor/asciidoctor-kroki/issues/421>）且无原生 Tab。

## Consequences

记录这份 ADR 的价值在于：「为什么不用 Quarto」是一个半年内必然会被重新提出的问题（提问者可能包括作者自己）。这份记录让这个讨论只发生一次。

同时要诚实记下没验证的部分：`mermaid-format: svg` + `embed-resources: true` 组合下产物是否真的零 JavaScript 依赖、`.panel-tabset` 在禁用 JavaScript 时的实际表现，都**没有实测**。落选理由 1 是结构性的、不依赖这两个数字，所以跳过了那 1-2 小时的实测。如果将来理由 1 不再成立（比如 Quarto 支持了 CommonMark 模式），这份 ADR 需要重新评估。
