# 其余七种图表

围栏语言认得，但**引擎还没写**。写了会得到 `DIAG-301`「没有装能画 X 的引擎」，构建失败。

| 围栏语言 | 引擎 | 将来的依赖形态 |
|---|---|---|
| [`d2`](/write/diagrams/d2) | d2 | npm，WASM，无浏览器 |
| [`dot`](/write/diagrams/dot) | Graphviz | npm，WASM，无浏览器 |
| [`math`](/write/diagrams/math) | MathJax v3 | npm，纯 JS，原生输出 SVG |
| [`vega-lite`](/write/diagrams/vega-lite) | Vega-Lite | npm 库 |
| [`wavedrom`](/write/diagrams/wavedrom) | WaveDrom | npm 库 |
| [`bytefield`](/write/diagrams/bytefield) | bytefield-svg | npm，纯 JS |
| [`plantuml`](/write/diagrams/plantuml) | PlantUML | **jar，需 Java ≥ 11** |

**每一种一页**，点上表第一列进去：那一页写清它是什么、能画哪些图、围栏里怎么写、现在什么状态。

源码里 `packages/pamphlet/src/diagrams/` 目前只有 `mermaid.ts`。形态在 [ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md) 里已经定了，只是还没写。

## 为什么引擎全是可选依赖

装 `@nekoleapuki/pamphlet-cli` 只得到**编译器本体**，一个引擎都不带。

这不是懒，是算过账的：**全部引擎加起来约 340MB**。实测（`npm install` 六个引擎 + `du -sh node_modules`）是 **270 个包、189MB**，再叠上 Playwright + Chromium 约 150MB。

对一个 Markdown 工具来说这是采用率杀手。可选依赖把体积代价精确落在真正用到那个引擎的人身上 —— **纯文字文档的用户一个引擎都不装**。

## 数学公式只有块级

````markdown
```math
E = mc^2
```
````

**不支持行内 `$E=mc^2$`。**

原因是 `$` 在技术文档里到处都是 —— `$ npm install`、`$HOME`、`$99` —— 支持它就必须设计冲突判定和转义规则，而误判会把一段正常文字变成公式。

只有一个符号也要写成块级围栏；或者用裸 HTML 的 `<sub>` / `<sup>`（[裸 HTML 原样通过](/write/)）。

顺带一提，数学引擎选的是 MathJax v3 而不是 KaTeX：KaTeX 默认输出 HTML+CSS 而不是 SVG（<https://katex.org/>），不适合「预渲染为内联 SVG」这条管线。

## PlantUML 需要 Java

七个引擎里只有它要 Java ≥ 11。这是明知代价的选择 —— 它是唯一能补上高级 UML 与真 C4 建模的引擎。

所以 Java 是一项**文档化的可选前置条件**，不是隐藏要求。`pamphlet doctor` 会检测 `java -version` 并在缺失时给出清楚的诊断，而不是让底层 `spawn` 失败的原始错误冒到你面前。

## 一律用库，不用命令行包

实测发现六个引擎的 189MB 里，约 **38MB 是光栅图输出**的依赖 —— 而 Pamphlet 只需要 SVG：

- `vega-cli` 拖进 `canvas` 19MB（而且它是需要本地编译的原生模块，是 CI 里最常装不上的那类包）
- `wavedrom-cli` 拖进 `@jimp` / `gifwrap` / `@resvg` 共约 19MB

改用 `vega` + `vega-lite` 库（`view.toSVG()`）和 `wavedrom` 库本身，这 38MB 全部消掉。

## 自己接一个引擎

frontmatter 里的 `engines` 字段是为这件事准备的，但**目前尚未实现**，写了只会得到 `DOC-104` 警告。详见[接一个自定义图表引擎](/howto/custom-engine)。

> 出处：[ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md)
