# 时序图

## 这是什么

几个参与者之间，**按时间先后**来回传消息。

## 什么时候用

画接口调用顺序、画握手过程、画「谁先谁后」说不清的地方。

## 怎么写

Pamphlet 自己的写法——**先列声明、再列关系**，十七种图共用这副骨架：

````markdown
:::sequence[一次编译]
participants:
  author = "作者"
  compiler = "编译器"
messages:
  author -> compiler : pamphlet build 方案.md
  compiler --> author : 方案.html
:::
````

这种写法在 GitHub 上不会渲染。要 GitHub 也能看，用[时序图的 Mermaid 围栏写法](/write/diagrams/mermaid/sequence)，画出来是同一张图。

## 出来是什么样

编译时就画成 SVG 内联进产物，**读者那边不下载任何绘图库、也不联网**。颜色跟着主题走，可以滚轮缩放、按住拖动、双击复位。

## 坑

- 块名固定是 `participants:` 和 `messages:`
- `->` 是实线请求，`-->` 是虚线回复，两条线的意思不同
- 消息内容写在冒号后面：`作者 -> 编译器 : build`
- 消息里引用了没声明过的参与者报 `DIAG-306`
