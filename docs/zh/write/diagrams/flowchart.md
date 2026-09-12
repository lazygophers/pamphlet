# 流程图

## 这是什么

一件事从头走到尾，中间有分支。**最常用的一种图**。

## 什么时候用

画业务流程、画判断分支、画一条链路的几个环节。

## 怎么写

Pamphlet 自己的写法——**先列声明、再列关系**，十七种图共用这副骨架：

````markdown
:::flow[登录链路]{dir=LR}
nodes:
  request = "请求"
  cache = diamond "有缓存吗？"
  hit = "直接返回"
  miss = cylinder "查数据库"
edges:
  request -> cache
  cache -> hit : 有
  cache -> miss : 没有
:::
````

这种写法在 GitHub 上不会渲染。要 GitHub 也能看，用[流程图的 Mermaid 围栏写法](/write/diagrams/mermaid/flowchart)，画出来是同一张图。

## 出来是什么样

编译时就画成 SVG 内联进产物，**读者那边不下载任何绘图库、也不联网**。颜色跟着主题走，可以滚轮缩放、按住拖动、双击复位。

## 坑

- 块名固定是 `nodes:` 和 `edges:`，少一个报 `DIAG-305`
- 形状只有六个：`box` / `round` / `stadium` / `diamond` / `cylinder` / `circle`，写别的报 `DIAG-307` 并把能用的列出来
- `edges:` 里引用了 `nodes:` 没声明过的名字报 `DIAG-306`——名字拼错是最常见的写错法
- `{dir=...}` 只认 `LR` / `RL` / `TD` / `TB` / `BT`，不写就是 `TD`
