# 架构图

## 这是什么

系统由哪几个部件组成，**部件之间怎么连**，自带云、数据库、磁盘、服务器这些图标。

## 什么时候用

画部署架构、画一个系统的组成。

## 怎么写

Pamphlet 自己的写法——**先列声明、再列关系**，十七种图共用这副骨架：

````markdown
:::architecture[编译阶段]
services:
  src = disk "源文档"
  engine = server "图表引擎"
  out = database "产物"
links:
  src -- engine
  engine -- out
:::
````

这种写法在 GitHub 上不会渲染。要 GitHub 也能看，用[架构图的 Mermaid 围栏写法](/write/diagrams/mermaid/architecture)，画出来是同一张图。

## 出来是什么样

编译时就画成 SVG 内联进产物，**读者那边不下载任何绘图库、也不联网**。颜色跟着主题走，可以滚轮缩放、按住拖动、双击复位。

## 坑

- 块名固定是 `services:` 和 `links:`
- 服务行是 `id = 图标 "文字"`，图标名直接透给 Mermaid：`cloud` / `database` / `disk` / `server` / `internet`，不写就是 `server`
- 连线写 `甲 -- 乙`；连到哪条边由编译器定（一律 `R` 连 `L`）
- **分组（`group`）画不出来**——要分组用 Mermaid 围栏
