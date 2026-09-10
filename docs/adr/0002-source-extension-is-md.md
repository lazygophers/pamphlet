# 源文档沿用 `.md` 后缀，不自造 `.pmf` / `.docd`

Pamphlet 的语法是 CommonMark 的严格超集，因此源文档沿用 `.md` 后缀，靠 frontmatter 里的 `spec: 1` 字段标记「这是一本 pamphlet 的源文档」。要编译哪些文件由 CLI 参数显式指定（`pamphlet build docs/**/*.md`），不靠后缀区分。

## Considered Options

- **自造后缀（`.docd`、`.pmf`）**：语义清晰，一眼能看出是 Pamphlet 文档。但 GitHub 用 linguist 按后缀判定语言（[github-linguist/linguist](https://github.com/github-linguist/linguist/blob/main/lib/linguist/languages.yml)），自造后缀会让文件在 GitHub 上显示为纯文本——「逃生兼容」这个成功标准当场作废。编辑器高亮、Prettier、既有 Markdown lint 也全部不认，都要自己重建一遍。
- **沿用 `.md`**：白拿整条 Markdown 工具链。代价是无法只看后缀区分普通 Markdown 和 pamphlet 源文档。

## Consequences

这是一个反直觉的选择——新语言通常都有自己的后缀，未来会有人提议「我们该有自己的扩展名」。记录在此以免重复讨论。

代价是真实存在的：任何工具都无法只凭后缀判断一个 `.md` 是否用了 Pamphlet 语法，必须读 frontmatter。这个代价被接受，因为它换来的是「没装 Pamphlet 的人拿到源文档照样能读」——而这正是项目的设计原则「降级优先」在源文档一侧的体现。
