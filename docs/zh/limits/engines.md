# 图表引擎全部是可选依赖

装 `pamphlet` 只得到**编译器本体**。图表引擎一个都不带，第一次用到某个引擎时才提示你装。

这不是懒，是算过账的：全部引擎加起来约 **340MB**。对一个 Markdown 工具来说这是采用率杀手。

## 账是这么算的

实测（`npm install` 六个引擎 + `du -sh node_modules`）：**270 个包、189MB**，叠上 Playwright + Chromium 约 150MB。

可选依赖把体积代价精确落在真正用到那个引擎的人身上——**纯文字文档的用户一个引擎都不装**。

## 本版本只实现了 Mermaid

| 围栏语言 | 引擎 | 依赖形态 | 本版本 |
|---|---|---|---|
| `mermaid` | Mermaid | npm + **无头浏览器** | ✅ 已实现 |
| `d2` | d2 | npm，WASM，无浏览器 | 计划中 |
| `dot` | Graphviz | npm，WASM，无浏览器 | 计划中 |
| `math` | MathJax v3 | npm，纯 JS，原生输出 SVG | 计划中 |
| `vega-lite` | Vega-Lite | npm 库 | 计划中 |
| `wavedrom` | WaveDrom | npm 库 | 计划中 |
| `bytefield` | bytefield-svg | npm，纯 JS | 计划中 |
| `plantuml` | PlantUML | **jar，需 Java ≥ 11** | 计划中 |

「计划中」的写了会得到 `DIAG-301`「没有装能画 X 的引擎」，构建失败。源码里 `packages/pamphlet/src/diagrams/` 目前只有 `mermaid.ts`。

## Mermaid 为什么要下 150MB 的浏览器

```bash
npm i -g mermaid-isomorphic playwright && npx playwright install chromium
```

因为 **Mermaid 必须用真实浏览器的布局引擎算文字尺寸**。jsdom（一个纯 JavaScript 的假浏览器）没有实现 `SVGTextElement.getBBox()`——量不出一段文字有多宽，就没法为图形排版。

这不是选型偏好。Mermaid 组织成员 @aloisklink 明确否定过 jsdom 方案：<https://github.com/mermaid-js/mermaid/issues/3886#issuecomment-1341694822>

代价落在「装一次」而不是「每次用」：首次约 150MB、约 1 分钟。

**浏览器是惰性启动的**：纯文字文档永远不会拉起它（实测冷启动 733ms，白付很浪费）。

## PlantUML 需要 Java

七个引擎里只有它要 Java ≥ 11。这是明知代价的选择——它是唯一能补上高级 UML 与真 C4 建模的引擎。

所以 Java 是一项**文档化的可选前置条件**，不是隐藏要求。`pamphlet doctor` 会检测 `java -version` 并在缺失时给出清楚的诊断，而不是让底层 `spawn` 失败的原始错误冒到你面前。

## CI 里要额外做的事

镜像里得装 Chromium 及其系统依赖：

```bash
npx playwright install --with-deps chromium
```

## 一律用库，不用命令行包

实测发现六个引擎的 189MB 里，约 **38MB 是光栅图输出**的依赖——而 Pamphlet 只需要 SVG：

- `vega-cli` 拖进 `canvas` 19MB（而且它是需要本地编译的原生模块，是 CI 里最常装不上的那类包）
- `wavedrom-cli` 拖进 `@jimp` / `gifwrap` / `@resvg` 共约 19MB

改用 `vega` + `vega-lite` 库（`view.toSVG()`）和 `wavedrom` 库本身，这 38MB 全部消掉。

## 数学公式不用 KaTeX

KaTeX 默认输出 HTML+CSS 而不是 SVG（<https://katex.org/>），不适合「预渲染为内联 SVG」这条管线。所以选 MathJax v3。

## 先看看装了什么

```bash
pamphlet doctor
```

缺任何一个引擎，退出码是 `3`（环境缺失）。

> 出处：[ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md)、[ADR-0004](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0004-mermaid-via-headless-browser.md)
