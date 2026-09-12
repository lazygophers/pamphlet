# 架构图（Mermaid 围栏）

## 这是什么

和[架构图](/write/diagrams/architecture)画的是同一种图，区别只在**怎么写**：这一页用 ` ```mermaid ` 围栏，直接写 [Mermaid](/write/diagrams/mermaid/) 自己的图源。

## 什么时候用

- **源文档要发到 GitHub，并且希望在 GitHub 上也能看到图**——自有写法在那边显示成一段普通文字
- 已经会 Mermaid，不想再学一套
- 需要自有写法表达不了的细节（下面「坑」那一节写明是哪些）

其余情况用[自有写法](/write/diagrams/architecture)：字段名固定，写错了当场报错并指到具体那一行。

## 怎么写

````markdown
```mermaid
architecture-beta
  group build(cloud)[编译阶段]
  service src(disk)[源文档] in build
  service engine(server)[图表引擎] in build
  service out(database)[产物] in build
  src:R -- L:engine
  engine:R -- L:out
```
````

## 出来是什么样

编译时就画成 SVG 内联进产物，**读者那边不下载任何绘图库、也不联网**。颜色跟着主题走，可以滚轮缩放、按住拖动、双击复位。

## 坑

- **ID 必须是英文**（`service src(disk)[源文档]` 里的 `src`），方括号里的标签可以写中文
- 括号里是图标名，内置的有 `cloud` `database` `disk` `server` `internet`
- `src:R -- L:engine` 里的 `R` `L` `T` `B` 是从哪条边连出去
