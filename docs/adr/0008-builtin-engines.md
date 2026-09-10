# 内置七个图表引擎，全部列为可选依赖

除主引擎 Mermaid（见 [0004](./0004-mermaid-via-headless-browser.md)）之外，内置以下引擎，**全部列为可选依赖**：装 `@pamphlet/cli` 只得到编译器本体，第一次用到某个引擎时才提示安装。

| 引擎 | 补上 Mermaid 的什么缺口 | 依赖形态 | 出处 |
|---|---|---|---|
| d2 | 架构图、更强的自动布局 | npm，WASM，无浏览器 | <https://www.npmjs.com/package/@terrastruct/d2> |
| Graphviz | 节点多的图（依赖关系、调用链、网络拓扑） | npm，WASM，无浏览器 | <https://www.npmjs.com/package/@hpcc-js/wasm-graphviz> |
| MathJax v3 | 数学公式（Mermaid 完全没有） | npm，纯 JS，原生输出 SVG | <https://github.com/mathjax/mathjax-node-cli> |
| Vega-Lite | 数据图表（Mermaid 的 xychart 很弱） | npm，用 `vega` + `vega-lite` 库调 `view.toSVG()`，**不用 `vega-cli`** | <https://www.npmjs.com/package/vega-cli> |
| WaveDrom | 数字波形图（Mermaid 完全没有） | npm，用 `wavedrom` 库，**不用 `wavedrom-cli`** | <https://www.npmjs.com/package/wavedrom-cli> |
| bytefield-svg | 位域图 / 协议报文格式 | npm，纯 JS | <https://www.npmjs.com/package/bytefield-svg> |
| PlantUML | 真实 UML 组件图、真 C4 视图分层 | **jar，需 Java ≥11** | <https://plantuml.com/command-line> |

数学公式不用 KaTeX：它默认输出 HTML+CSS 而不是 SVG（<https://katex.org/>），不适合「预渲染为内联 SVG」这条管线。

## Consequences

**d2 让一个开放问题消失了。** 原始设计纠结「`arch` 自有图表语法该用 C4 语义还是 Mermaid 子集」——内置 d2 之后架构图直接用 d2，不需要自造语法，因此也不需要为自造语法承担永久兼容。

**PlantUML 打破了「不强制装 Java」这条线**，这是明知代价的选择：它是唯一能补上高级 UML 与真 C4 建模的引擎。因此 Java 成为一项**文档化的可选前置条件**：`pamphlet doctor` 必须检测 `java -version` 并在缺失时给出清楚的诊断，而不是让 `spawn` 失败的原始错误冒到用户面前。Unix 上调用时必须带 `-Djava.awt.headless=true`，否则依赖 X11 图形库（<https://plantuml.com/faq-install>）。

**一律用库，不用命令行包。** 实测（`npm install` 六个引擎 + `du -sh node_modules`）得到 270 个包、189MB，其中约 38MB 是**光栅图输出**的依赖，而 Pamphlet 只需要 SVG：`vega-cli` 拖进 `canvas` 19MB（且它是需要本地编译的原生模块，是 CI 里最常装不上的那类包），`wavedrom-cli` 拖进 `@jimp` / `gifwrap` / `@resvg` 共约 19MB。改用 `vega` + `vega-lite`（`view.toSVG()`）和 `wavedrom` 库本身即可全部消掉。

**可选依赖是这个清单能成立的前提。** 六个 npm 引擎实测 189MB（d2 的 WASM 60MB、`mathjax-full` 42MB 含 `speech-rule-engine` 8MB；Graphviz WASM 反而只有 2.1MB），叠上 Playwright + Chromium 约 150MB，全量安装约 340MB——对一个 Markdown 工具来说这是采用率杀手。可选依赖把体积代价精确落在真正用到该引擎的人身上，纯文字文档的用户一个引擎都不装。

代价是每个引擎都要写一条清楚的缺失诊断（引擎名 + 安装命令 + 文档链接），并且 `pamphlet doctor` 必须列出全部引擎的安装状态。这两样是本决定的必要配套，不是可选项。
