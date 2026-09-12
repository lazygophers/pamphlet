# Vega-Lite（还没实现）

## 这是什么

Vega-Lite 是数据可视化的语法：**你描述数据和映射关系，它决定怎么画**。

Mermaid 也有柱状折线（`xychart-beta`），但很弱，而且它的颜色由引擎自己算，既不是哨兵又躲过替换，每次都报 `DIAG-304`——[数据图表](/write/diagrams/chart)那一页就是因为这个才自研的。

## 它能画哪些图

| 画什么 | `mark` 写什么 |
|---|---|
| 柱状图 | `bar` |
| 折线图 | `line` |
| 散点图 | `point` |
| 面积图 | `area` |
| 热力图 | `rect` |

一个围栏语言画所有这些，区别只在 `mark` 那一个字段。

## 怎么写

围栏里是一段 JSON：

````markdown
```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "data": {
    "values": [
      {"a": "A", "b": 28}, {"a": "B", "b": 55}, {"a": "C", "b": 43}
    ]
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "a", "type": "nominal"},
    "y": {"field": "b", "type": "quantitative"}
  }
}
```
````

`encoding` 里的 `type` 有四档：`nominal`（分类）/ `ordinal`（有序分类）/ `quantitative`（数值）/ `temporal`（时间）。

> 出处：<https://vega.github.io/vega-lite/examples/bar.html>

## 现在什么状态

**围栏语言 `vega-lite` 认得，但引擎还没写。** 写了会得到 `DIAG-301`「没有装能画 vega-lite 的引擎」，并且**构建失败**——不是画不出来留个占位框，是整次编译不通过。

将来的依赖形态是npm 库（`vega` + `vega-lite`），和其余六个一样列为可选依赖：装 `@nekoleapuki/pamphlet-cli` 只得到编译器本体，一个引擎都不带。为什么这么安排见[其余七种引擎](/write/diagrams/others)。

现在要画这种图，先用 [Mermaid 围栏](/write/diagrams/mermaid/)里最接近的一种顶着。

## 坑

- **用 `vega` + `vega-lite` 库调 `view.toSVG()`，不用 `vega-cli`**：后者会拖进 `canvas`（19MB，而且是需要本地编译的原生模块，CI 里最常装不上的那类包），而 Pamphlet 只要 SVG
- JSON 写错不会「差不多能看」，是整张图画不出来
- 数据直接写在 `values` 里；引用外部 URL 的数据在自包含产物里取不到

> 出处：[ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md)
