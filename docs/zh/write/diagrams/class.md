# 类图

## 这是什么

类、字段、方法，以及类之间的关系。

## 什么时候用

画数据结构、画接口继承、画模块之间谁依赖谁。

## 怎么写

Pamphlet 自己的写法——**先列声明、再列关系**，十七种图共用这副骨架：

````markdown
:::class[主题的数据结构]
classes:
  Theme
  ThemeTokens
relations:
  Theme -> ThemeTokens : light / dark
:::
````

这种写法在 GitHub 上不会渲染。要 GitHub 也能看，用[类图的 Mermaid 围栏写法](/write/diagrams/mermaid/class)，画出来是同一张图。

## 出来是什么样

编译时就画成 SVG 内联进产物，**读者那边不下载任何绘图库、也不联网**。颜色跟着主题走，可以滚轮缩放、按住拖动、双击复位。

## 坑

- 块名固定是 `classes:` 和 `relations:`
- **字段和方法列不出来**，只画类和类之间的关系——要列字段用 Mermaid 围栏
- 所有关系都画成一条普通箭头；继承、组合这些专用箭头也只有围栏写法有
- `{dir=...}` 翻成 Mermaid 的 `direction`，`TD` 自动换成 `TB`
