# bytefield-svg（还没实现）

## 这是什么

bytefield-svg 画**位域图**：一个协议报文、一段内存布局里，哪几个字节是什么意思。

**Mermaid 完全没有这个能力**，纯 JavaScript，不需要浏览器也不需要 Java。

## 它能画哪些图

| 画什么 | 写法 |
|---|---|
| 协议报文格式 | 一格一个字节，`draw-box` 一行一格 |
| 内存布局 | 同上，用 `draw-gap` 表示中间省略的一大段 |

## 怎么写

围栏里是它自己的 DSL（长得像 Clojure，因为它就是 Clojure 写的）：

````markdown
```bytefield
(draw-column-headers)
(draw-box "Address" {:span 4})
(draw-box "Size" {:span 2})
(draw-box 0 {:span 2})
(draw-gap "Payload")
(draw-bottom)
```
````

`{:span 4}` 表示这一格横跨 4 个字节；`draw-column-headers` 画顶上那行字节编号，不写就没有。

> 出处：<https://bytefield-svg.deepsymmetry.org/bytefield-svg/1.11.0/intro.html>

## 现在什么状态

**围栏语言 `bytefield` 认得，但引擎还没写。** 写了会得到 `DIAG-301`「没有装能画 bytefield 的引擎」，并且**构建失败**——不是画不出来留个占位框，是整次编译不通过。

将来的依赖形态是npm，纯 JS，和其余六个一样列为可选依赖：装 `@nekoleapuki/pamphlet-cli` 只得到编译器本体，一个引擎都不带。为什么这么安排见[其余七种引擎](/write/diagrams/others)。

现在要画这种图，先用 [Mermaid 围栏](/write/diagrams/mermaid/)里最接近的一种顶着。

## 坑

- **`(draw-bottom)` 必须写在最后**，否则最下面那条边不画
- 一行默认十六个字节，要改用 `(def boxes-per-row 4)`
- 数字直接写会渲染成两位十六进制——这是故意的，提醒你那是一个字节

> 出处：[ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md)
