# Pamphlet

把一份 Markdown 编译成**一个能双击打开的 HTML 文件**。不联网、不带依赖、图是提前画好的静态 SVG、面板可以点、关掉 JavaScript 照样从头读到尾。

```bash
pnpm add -D pamphlet
pamphlet build 方案.md      # 得到 方案.html，发给谁都能直接打开
```

## 为什么不用现成的

调研过一圈：**没有任何现成工具同时做到「自包含 + 图表预渲染成静态 SVG + 交互可点 + 无 JavaScript 时可降级」**。

最接近的是 **[Quarto](https://quarto.org/docs/output-formats/html-basics.html)**——`embed-resources: true` 已经自包含，`.panel-tabset` 已经有 Tab，`mermaid-format: svg` 能强制预渲染图表。落选不是因为工作量，是因为**方向不兼容**：Quarto 用的是 Pandoc Markdown 方言，而 Pamphlet 的整个承诺（语法是 CommonMark 严格超集、源文档沿用 `.md`、把源文档直接丢上 GitHub 仍然能读）都建立在 CommonMark 上。这条在 Quarto 上根本立不住。另外它要装一个约 100MB 的二进制，面向 R / Python 数据科学生态，跟「npm 生态里的一个 Markdown 工具」错位。

其余候选：

| 工具 | 缺口 |
|---|---|
| [Pandoc](https://pandoc.org/MANUAL.html) `--embed-resources` | 自包含有了，交互和图表都没有 |
| [Marp](https://github.com/orgs/marp-team/discussions/516) | 官方明确不支持自包含打包 |
| Docusaurus / Astro | 没有单文件导出 |
| [Typst](https://typst.app/docs/reference/html/) | HTML 导出仍是实验性，官方标注 not for production use |
| [Asciidoctor + Kroki](https://github.com/asciidoctor/asciidoctor-kroki/issues/421) | 能内联，但有图表静默失败的已知 bug，且无原生 Tab |

完整取舍见[文档站的「这是什么」](https://lazygophers.github.io/pamphlet/guide/introduction)。

## 看一眼产物

**<https://lazygophers.github.io/pamphlet/demo/>**

那个页面是 [`examples/demo.md`](./examples/demo.md) 编译出来的，就一个 HTML 文件。可以试试：

- 把系统切成深色再看 —— 图里的线和字跟着一起变深浅，纯 CSS，没有一行 JavaScript 参与
- 滚轮缩放那张图、按住拖动、双击复位
- 在浏览器里关掉 JavaScript 再刷新 —— 三个面板会全部展开，一个字都不会丢
- 存到本地断网打开 —— 一样能看，它不向网络要任何东西
- 存下来跑 `pamphlet extract demo.html` —— 原样吐回那份 `.md`

自己编一份：

```bash
pamphlet build examples/demo.md --verbose
```

## 许可证

AGPL-3.0-or-later，见 [LICENSE](./LICENSE)。

## 文档

**<https://lazygophers.github.io/pamphlet/>**（[English](https://lazygophers.github.io/pamphlet/en/)）

- [语法手册](https://lazygophers.github.io/pamphlet/guide/syntax) —— 九个容器指令 + 八种图表围栏
- [命令行](https://lazygophers.github.io/pamphlet/guide/cli) —— 六个命令与退出码
- [已知边界](https://lazygophers.github.io/pamphlet/limits/mobile) —— 五条看起来像 bug、其实是设计的行为
- [诊断码表](https://lazygophers.github.io/pamphlet/reference/diagnostics) —— 19 个码分别什么意思、怎么修

术语表在 [`CONTEXT.md`](./CONTEXT.md)。

本地起文档站：

```bash
pnpm docs:dev
```
