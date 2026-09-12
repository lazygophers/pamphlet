# git 分支图

## 这是什么

分支从哪里拉出来、在哪里合回去。

## 什么时候用

讲清一次发布的分支策略、复盘一次合并冲突。

## 怎么写

Pamphlet 自己的写法——**先列声明、再列关系**，十七种图共用这副骨架：

````markdown
:::gitgraph[一次改版]
commits:
  commit 初始
  branch themes
  commit 十三套主题
  checkout main
  merge themes
:::
````

这种写法在 GitHub 上不会渲染。要 GitHub 也能看，用[git 分支图的 Mermaid 围栏写法](/write/diagrams/mermaid/gitgraph)，画出来是同一张图。

## 出来是什么样

编译时就画成 SVG 内联进产物，**读者那边不下载任何绘图库、也不联网**。颜色跟着主题走，可以滚轮缩放、按住拖动、双击复位。

## 坑

- 只有一个块：`commits:`
- 每行一条操作，只有四个：`commit 名字` / `branch 名字` / `checkout 名字` / `merge 名字`，写别的报 `DIAG-306`
- 提交名里的引号由编译器补
- 提交超过十个就挤成一条线，只画关键的几个
