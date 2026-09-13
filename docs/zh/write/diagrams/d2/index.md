# d2

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

## 先装一次

它不跟着 Pamphlet 一起装——用到才装，不用的人一个字节都不多（解包约 91.4MB，七个里最大的一个）：

```bash
npm i -D @nekoleapuki/pamphlet-engine-d2
```

装完跑 `pamphlet doctor` 确认：

```
✓ d2（d2）
```

**没装就用这种围栏会怎样**：得到 `DIAG-301` 并且**整次编译失败**（不是留个占位框），提示里就是上面那条命令。

许可证：MPL-2.0。

**注意包名**：官方从 `@terrastruct/d2` 改名到 `@d2lang/d2`，而旧包名没打 deprecated 标记——装错了不会有任何警告，但旧包渲染完进程不退出。引擎包已经钉死新包名，你不用管这件事。

## 坑

- **容器里的形状要用点号引用**：`外层.内层 -> 另一个.形状`
- 连线引用的是形状的**键**，不是它显示出来的标签
- WASM 包约 60MB，是七个引擎里最大的一个

> 出处：[ADR-0041](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0041-engines-are-separate-packages.md)（引擎各自成包）、[ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md)（为什么是这七个）
