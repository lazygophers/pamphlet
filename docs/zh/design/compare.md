# 方案对比

只比两个真正接近的：**Pandoc** 和 **Typora / Obsidian 的导出 HTML**。

不比 VitePress、mdBook、Docusaurus 这类 —— 它们产出的是**一个网站**（几百个文件，要有服务器或 GitHub Pages 才能看），Pamphlet 产出的是**一个文件**（双击就开）。这不是同一类东西，比较没有意义。

:::info 这一页会过时
别人发新版本我们就可能写错了。下面每条都标了核对日期和出处，你可以自己去核。
:::

## Pandoc

**最接近的对手。** Pandoc 也能把 Markdown 转成一个自包含 HTML：

```bash
pandoc 方案.md --embed-resources --standalone -o 方案.html
```

出处 <https://pandoc.org/MANUAL.html#option--embed-resources>（核对于 2026-09）。

| | Pandoc | Pamphlet |
|---|---|---|
| 自包含单文件 | ✅ `--embed-resources` | ✅ 默认，且**无法关闭** |
| 远程图片 | 会下载并内嵌 | **直接报错** `EMB-403` |
| 标签页 / 折叠块 | ❌ 无原生语法 | ✅ 九个容器指令 |
| 图表预渲染 | ❌ 要自己接 filter | ✅ Mermaid 编译时画成 SVG |
| 无 JavaScript 降级 | 不适用（本来就没交互） | ✅ 明确承诺 |
| Markdown 方言 | **Pandoc Markdown**（自有方言） | **CommonMark 严格超集** |
| 输出格式 | 几十种（PDF、docx、LaTeX…） | 只有 HTML |
| 安装 | 单个二进制，约 150MB | npm 包，约 86 个依赖 |

**什么时候选 Pandoc**：要 PDF、Word、LaTeX 这些其它格式；或者只要静态文档、不需要任何交互。它在格式转换这件事上做得比谁都全。

**什么时候选 Pamphlet**：要可点的标签页和折叠块；要图表自动画好；要源文档丢上 GitHub 仍然能正常阅读。

最关键的差别其实是**方言**：Pandoc Markdown 有自己的一套扩展，源文档在 GitHub 上不一定显示正常。Pamphlet 的整个承诺建立在 CommonMark 上。

## Typora / Obsidian 的导出 HTML

**非程序员最可能拿来比的东西。** 两个都是所见即所得的 Markdown 编辑器，都有「导出 / 另存为 HTML」。

出处 <https://typora.io/>、<https://help.obsidian.md/export>（核对于 2026-09）。

| | Typora / Obsidian 导出 | Pamphlet |
|---|---|---|
| 怎么用 | GUI 里点几下 | 命令行 |
| 批量处理 | ❌ 一次一个 | ✅ `pamphlet build "docs/**/*.md"` |
| 进 CI | ❌ | ✅ 退出码直接判断 |
| 自包含 | Typora 有开关；Obsidian 取决于插件 | ✅ 默认且强制 |
| 标签页 / 折叠块 | ❌（Obsidian 的 callout 只在自家生效） | ✅ |
| 图表 | Mermaid 通常内联成 SVG | ✅ 且跟随主题变色 |
| 语法检查 | ❌ | ✅ `pamphlet lint` + 19 条诊断码 |
| 还原源文档 | ❌ | ✅ `pamphlet extract` |

**什么时候选编辑器导出**：你本来就在用它写作，偶尔导出一份，不需要重复做。

**什么时候选 Pamphlet**：这件事要做很多次、要进流水线、要保证每次结果一样。

## 一句话

| 你的情况 | 用什么 |
|---|---|
| 要 PDF / Word | Pandoc |
| 偶尔手动导出一份 | 你正在用的编辑器 |
| 要交互、要批量、要进 CI、要每次结果一样 | Pamphlet |
| 要一个持续更新的多页站点 | VitePress / Rspress / mdBook |
