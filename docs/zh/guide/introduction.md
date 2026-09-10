# 这是什么

Pamphlet 把一份 Markdown 编译成**一个能双击打开的 HTML 文件**。

```bash
pamphlet build 方案.md      # 得到 方案.html，发给谁都能直接打开
```

产物里没有 `<link>`、没有 `<script src>`、没有 CDN 引用。图表在编译时就画成静态 SVG 内联进去了，字体是子集化后的 data URI，图片是 base64。断网、`file://`、U 盘拷来拷去，行为完全一样。

## 四条承诺

| 承诺 | 具体是什么 |
|---|---|
| **自包含** | 打开时不向网络要任何东西。引用远程图片会直接编译失败（`EMB-403`），没有绕过开关 |
| **图表预渲染** | 图在你的机器上画完，读者那边不跑任何图表库 |
| **交互可点** | Tab 可切换、折叠块可展开、图表可缩放拖动 |
| **无 JavaScript 可降级** | 关掉 JavaScript，Tab 变成全部展开、折叠块变成原生 `<details>`，内容一个字不丢 |

第四条是前三条的约束条件：任何交互都必须先有一个不依赖 JavaScript 的形态，再往上叠脚本。

## 为什么不用现成的

调研过一圈：**没有任何现成工具同时做到这四条**。

最接近的是 [Quarto](https://quarto.org/docs/output-formats/html-basics.html)——`embed-resources: true` 已经自包含，`.panel-tabset` 已经有 Tab，`mermaid-format: svg` 能强制预渲染图表。落选不是因为工作量，是因为**方向不兼容**：Quarto 用的是 Pandoc Markdown 方言，而 Pamphlet 的整个承诺（语法是 CommonMark 严格超集、源文档沿用 `.md`、把源文档直接丢上 GitHub 仍然能读）都建立在 CommonMark 上。这条在 Quarto 上根本立不住。另外它要装一个约 100MB 的二进制，面向 R / Python 数据科学生态，跟「npm 生态里的一个 Markdown 工具」错位。

其余候选：

| 工具 | 缺口 |
|---|---|
| [Pandoc](https://pandoc.org/MANUAL.html) `--embed-resources` | 自包含有了，交互和图表都没有 |
| [Marp](https://github.com/orgs/marp-team/discussions/516) | 官方明确不支持自包含打包 |
| Docusaurus / Astro | 没有单文件导出 |
| [Typst](https://typst.app/docs/reference/html/) | HTML 导出仍是实验性，官方标注 not for production use |
| [Asciidoctor + Kroki](https://github.com/asciidoctor/asciidoctor-kroki/issues/421) | 能内联，但有图表静默失败的已知 bug，且无原生 Tab |

## 它不做什么

- **不做多页站点。** 一份源文档 = 一个 HTML 文件。你现在看的这个文档站是用 [Rspress](https://rspress.rs/) 做的，不是 Pamphlet 的产物。
- **不做服务端。** 没有运行时，没有数据库，没有构建服务。
- **不猜你要编译哪些文件。** 路径必须显式给出，见[编译目标只能显式传路径](/limits/file-paths)。

## 下一步

1. [安装](/guide/install) —— 装编译器本体，按需装图表引擎
2. [语法手册](/guide/syntax) —— 九个容器指令 + 八种图表围栏
3. [命令行](/guide/cli) —— 六个命令与退出码

上手之前建议先扫一眼 [已知边界](/limits/mobile)：那五页每一条都对应一个**看起来完全像 bug、但其实是设计**的行为。
