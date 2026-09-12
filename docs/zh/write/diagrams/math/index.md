# MathJax（还没实现）

## 这是什么

MathJax 把 TeX 数学公式排成图。**这是 Mermaid 完全没有的东西**——它一个公式都画不了。

选 MathJax v3 而不是更快的 KaTeX，理由只有一条：KaTeX 默认输出 HTML + CSS 而不是 SVG（<https://katex.org/>），而 Pamphlet 这条管线要的是「编译时变成一段内联 SVG」。

## 它能画哪些图

| 画什么 | 写法 |
|---|---|
| 行间公式 | ` ```math ` 围栏，里面是标准 TeX |

只有这一种。**没有行内公式**——原因见下面「坑」。

## 怎么写

````markdown
```math
E = mc^2
```
````

围栏里写的就是标准 TeX，和你在论文里写的一样。

## 现在什么状态

**围栏语言 `math` 认得，但引擎还没写。** 写了会得到 `DIAG-301`「没有装能画 math 的引擎」，并且**构建失败**——不是画不出来留个占位框，是整次编译不通过。

将来的依赖形态是npm，纯 JS，原生输出 SVG，和其余六个一样列为可选依赖：装 `@nekoleapuki/pamphlet-cli` 只得到编译器本体，一个引擎都不带。为什么这么安排见[其余七种引擎](/write/diagrams/others)。

现在要画这种图，先用 [Mermaid 围栏](/write/diagrams/mermaid/)里最接近的一种顶着。

## 坑

- **不支持行内 `$E=mc^2$`**。`$` 在技术文档里到处都是（`$ npm install`、`$HOME`、`$99`），支持它就得设计冲突判定和转义规则，而误判会把一段正常文字变成公式。只有一个符号也写成围栏
- 要上标下标又不想动公式引擎，用裸 HTML 的 `<sub>` / `<sup>`（[裸 HTML 原样通过](/write/html)）
- `mathjax-full` 包约 42MB，其中 `speech-rule-engine` 占 8MB

> 出处：[ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md)
