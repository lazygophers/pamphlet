# 其余七个引擎

Mermaid 内置在 Pamphlet 里，**其余七个各自是一个包，用到哪个装哪个**。不装的人一个字节都不多——七个全装约 340MB，其中 d2 一个就 91.4MB。

| 围栏语言 | 引擎 | 装什么 | 体积 |
|---|---|---|---|
| [`dot`](/write/diagrams/dot) | Graphviz | `npm i -D @nekoleapuki/pamphlet-engine-graphviz` | 2.1MB |
| [`math`](/write/diagrams/math) | MathJax | `npm i -D @nekoleapuki/pamphlet-engine-mathjax` | 50MB |
| [`vega-lite`](/write/diagrams/vega-lite) | Vega-Lite | `npm i -D @nekoleapuki/pamphlet-engine-vega-lite` | 26MB |
| [`wavedrom`](/write/diagrams/wavedrom) | WaveDrom | `npm i -D @nekoleapuki/pamphlet-engine-wavedrom` | 3.3MB |
| [`bytefield`](/write/diagrams/bytefield) | bytefield-svg | `npm i -D @nekoleapuki/pamphlet-engine-bytefield` | 2.1MB |
| [`d2`](/write/diagrams/d2) | d2 | `npm i -D @nekoleapuki/pamphlet-engine-d2` | 91.4MB |
| [`plantuml`](/write/diagrams/plantuml) | PlantUML | `npm i -D @nekoleapuki/pamphlet-engine-plantuml` | jar + Java |

**每一种一页**，点上表第一列进去：那一页写清它是什么、能画哪些图、围栏里怎么写、有什么坑。

没装就用那种围栏会得到 `DIAG-301` 并且**整次编译失败**（不是留个占位框），提示里就是上表第三列那条命令。`pamphlet doctor` 一次列全七个装了没有。

## 为什么不干脆全内置

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

上面七个是官方包。要接别的渲染器，用 frontmatter 里的 `engines` 字段描述一条外部命令——**图源走标准输入进、SVG 走标准输出出**：

```yaml
engines:
  my-engine:
    langs: [mylang]
    command: [my-renderer, --svg, -]
```

这条路不需要写任何 JavaScript，所以构建期不会跑第三方代码。官方的 PlantUML 引擎内部走的就是它。详见[接一个自定义图表引擎](/howto/custom-engine)。

> 出处：[ADR-0041](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0041-engines-are-separate-packages.md)、[ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md)
