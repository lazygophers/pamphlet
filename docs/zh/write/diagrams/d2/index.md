# d2（还没实现）

## 这是什么

d2 是 Terrastruct 做的图形描述语言，和 Mermaid 一样「写文字、出图」，但**自动布局更强**：节点一多，Mermaid 的线会开始互相压，d2 还排得开。

它自带四套布局引擎，其中 `dagre` 和 `elk` 随 npm 包一起走，不需要浏览器。

## 它能画哪些图

| 画什么 | 靠什么 |
|---|---|
| 流程图、架构图 | 形状 + 连线，容器表示分组 |
| 时序图 | 容器上写 `shape: sequence_diagram` |
| 数据库表关系 | `shape: sql_table` |
| 类图 | `shape: class` |

**它最大的用处是架构图**：[ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md) 里写明，正是因为内置 d2，架构图才不需要 Pamphlet 自造一套语法。

## 怎么写

形状就是一行字，连线用 `->`，冒号后面是标签：

````markdown
```d2
请求 -> 缓存: 先查
缓存 -> 数据库: 没命中
数据库: {
  shape: cylinder
}
```
````

形状名一共十八个：`rectangle`（缺省）/ `square` / `page` / `parallelogram` / `document` / `cylinder` / `queue` / `package` / `step` / `callout` / `stored_data` / `person` / `diamond` / `oval` / `circle` / `hexagon` / `cloud` / `c4-person`。连线有四种：`->` / `<-` / `<->` / `--`。

时序图是给容器加一个字段：

````markdown
```d2
下单: {
  shape: sequence_diagram
  用户
  订单服务
  用户 -> 订单服务: 提交
  订单服务 -> 用户: 单号
}
```
````

> 出处：<https://d2lang.com/tour/shapes>、<https://d2lang.com/tour/connections>、<https://d2lang.com/tour/sequence-diagrams>

## 现在什么状态

**围栏语言 `d2` 认得，但引擎还没写。** 写了会得到 `DIAG-301`「没有装能画 d2 的引擎」，并且**构建失败**——不是画不出来留个占位框，是整次编译不通过。

将来的依赖形态是npm，WASM，无浏览器，和其余六个一样列为可选依赖：装 `@nekoleapuki/pamphlet-cli` 只得到编译器本体，一个引擎都不带。为什么这么安排见[其余七种引擎](/write/diagrams/others)。

现在要画这种图，先用 [Mermaid 围栏](/write/diagrams/mermaid/)里最接近的一种顶着。

## 坑

- **容器里的形状要用点号引用**：`外层.内层 -> 另一个.形状`
- 连线引用的是形状的**键**，不是它显示出来的标签
- WASM 包约 60MB，是七个引擎里最大的一个

> 出处：[ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md)
