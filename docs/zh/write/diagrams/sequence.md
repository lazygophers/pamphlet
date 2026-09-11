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

上面那种写法在 GitHub 上不会渲染。要 GitHub 也能看，用下面这种：

### 另一种写法：Mermaid 围栏

````markdown
```mermaid
sequenceDiagram
  participant 作者
  participant 编译器
  作者->>编译器: pamphlet build 方案.md
  编译器-->>作者: 方案.html
```
````

## 出来是什么样

编译时就画成 SVG 内联进产物，**读者那边不下载任何绘图库、也不联网**。颜色跟着主题走，可以滚轮缩放、按住拖动、双击复位。

## 坑

- `->>` 实线箭头是请求，`-->>` 虚线是返回
- 参与者超过五个就很难读，考虑拆成两张
- 参与者名字可以写中文
