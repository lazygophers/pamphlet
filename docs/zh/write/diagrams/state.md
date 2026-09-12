# 状态图

## 这是什么

一个东西有哪几种状态，**什么条件下从一种变成另一种**。

## 什么时候用

画订单状态、画连接生命周期、画审批流转。

## 怎么写

Pamphlet 自己的写法——**先列声明、再列关系**，十七种图共用这副骨架：

````markdown
:::state[编译状态]
states:
  parse = "解析"
  render = "画图"
  assemble = "组装"
transitions:
  parse -> render : 有图表围栏
  parse -> assemble : 纯文字
  render -> assemble
:::
````

这种写法在 GitHub 上不会渲染。要 GitHub 也能看，用[状态图的 Mermaid 围栏写法](/write/diagrams/mermaid/state)，画出来是同一张图。

## 出来是什么样

编译时就画成 SVG 内联进产物，**读者那边不下载任何绘图库、也不联网**。颜色跟着主题走，可以滚轮缩放、按住拖动、双击复位。

## 坑

- 块名固定是 `states:` 和 `transitions:`
- `{dir=...}` 翻成 Mermaid 的 `direction`；`TD` 会自动换成 `TB`，因为 Mermaid 的状态图只认 `TB`
- 触发条件写在冒号后面：`idle -> busy : 开工`。不写条件的箭头等于没说清为什么会变
- **开始和结束那两个圆点画不出来**——要它们用 Mermaid 围栏的 `[*]`
