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

上面那种写法在 GitHub 上不会渲染。要 GitHub 也能看，用下面这种：

### 另一种写法：Mermaid 围栏

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
