# 简介

Pamphlet 把一份 Markdown 编译成**一个能双击打开的 HTML 文件**。

```bash
npx @nekoleapuki/pamphlet-cli build 方案.md      # 得到 方案.html，发给谁都能直接打开
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

## 什么时候该用它

**适合**：一次性的方案、复盘、周报、给客户的说明、需要发给不确定环境的人的东西。判据是「我希望对方双击就能看，不想让他装什么、也不想搭个站」。

**不适合**：

- **持续更新的多页文档站。** 一份源文档 = 一个 HTML 文件，没有跨页导航和全站搜索。你现在看的这个站就是用 [Rspress](https://rspress.rs/) 做的，不是 Pamphlet 的产物。
- **要在手机上发给别人点开。** iOS 拦本地 HTML 文件，这不是 Pamphlet 能解决的，绕行办法见[产物是什么样的](/design/output)。
- **几百页的书。** 单文件意味着全部内容一次加载。

跟 Pandoc、Typora 这类工具的具体差别，见[方案对比](/design/compare)。

## 为什么不用现成的

调研过一圈：**没有任何现成工具同时做到那四条**。

最接近的是 [Quarto](https://quarto.org/docs/output-formats/html-basics.html) —— `embed-resources: true` 已经自包含，`.panel-tabset` 已经有 Tab，`mermaid-format: svg` 能强制预渲染图表。落选不是因为工作量，是因为**方向不兼容**：Quarto 用的是 Pandoc Markdown 方言，而 Pamphlet 的整个承诺（语法是 CommonMark 严格超集、源文档沿用 `.md`、直接丢上 GitHub 仍然能读）都建立在 CommonMark 上。另外它要装一个约 100MB 的二进制，面向 R / Python 数据科学生态。

其余候选：

| 工具 | 缺口 |
|---|---|
| [Pandoc](https://pandoc.org/MANUAL.html) `--embed-resources` | 自包含有了，交互和图表都没有 |
| [Marp](https://github.com/orgs/marp-team/discussions/516) | 官方明确不支持自包含打包 |
| Docusaurus / Astro | 没有单文件导出 |
| [Typst](https://typst.app/docs/reference/html/) | HTML 导出仍是实验性，官方标注 not for production use |
| [Asciidoctor + Kroki](https://github.com/asciidoctor/asciidoctor-kroki/issues/421) | 能内联，但有图表静默失败的已知 bug，且无原生 Tab |

## 下一步

[快速开始](/start/quickstart) —— 十分钟得到你自己的第一个产物。
