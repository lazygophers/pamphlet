# Mermaid（画图的引擎）

## 这是什么

上面那些图**都是它画的**。Mermaid 是一个用文字描述图形的工具，本版本是 Pamphlet **唯一实现了的引擎**。

一个围栏语言 `mermaid`，第一行的关键字决定画哪种图。

## 先装一次

```bash
npm i -g mermaid-isomorphic playwright && npx playwright install chromium
```

首次约 150MB、约 1 分钟。装完跑 `pamphlet doctor` 确认：

```
✓ mermaid（mermaid）
```

## 为什么要下一个浏览器

因为 **Mermaid 必须用真实浏览器的布局引擎算文字尺寸**。

jsdom（一个纯 JavaScript 的假浏览器）没有实现 `SVGTextElement.getBBox()`——量不出一段文字有多宽，就没法为图形排版。

这不是选型偏好。Mermaid 组织成员 @aloisklink 明确否定过 jsdom 方案：<https://github.com/mermaid-js/mermaid/issues/3886#issuecomment-1341694822>

代价落在「装一次」而不是「每次用」。

## 浏览器是惰性启动的

**纯文字文档永远不会拉起它。** 只有真的遇到 ` ```mermaid ` 围栏才启动。

| 场景 | 耗时 |
|---|---|
| 第 1 张图（含浏览器冷启动） | 733ms |
| 之后每张 | 364ms |
| 40 节点大图 | 412ms |

`DIAG-303` 的超时门槛是 **10 秒**，约是最坏值的 13 倍。

## 它能画哪些图

十三种。**每一种都有两页**：一页讲 Pamphlet 自己的写法，一页讲这里的 Mermaid 围栏写法，画出来是同一张图。

| 画什么 | 自有写法 | Mermaid 围栏写法 |
|---|---|---|
| 流程图 | [`:::flow`](/write/diagrams/flowchart) | [围栏写法](/write/diagrams/mermaid/flowchart) |
| 时序图 | [`:::sequence`](/write/diagrams/sequence) | [围栏写法](/write/diagrams/mermaid/sequence) |
| 状态图 | [`:::state`](/write/diagrams/state) | [围栏写法](/write/diagrams/mermaid/state) |
| 类图 | [`:::class`](/write/diagrams/class) | [围栏写法](/write/diagrams/mermaid/class) |
| 实体关系图 | [`:::er`](/write/diagrams/er) | [围栏写法](/write/diagrams/mermaid/er) |
| 甘特图 | [`:::gantt`](/write/diagrams/gantt) | [围栏写法](/write/diagrams/mermaid/gantt) |
| 饼图 | [`:::pie`](/write/diagrams/pie) | [围栏写法](/write/diagrams/mermaid/pie) |
| 架构图 | [`:::architecture`](/write/diagrams/architecture) | [围栏写法](/write/diagrams/mermaid/architecture) |
| 系统上下文图 | [`:::c4`](/write/diagrams/c4) | [围栏写法](/write/diagrams/mermaid/c4) |
| 数据流图 | [`:::dataflow`](/write/diagrams/dataflow) | [围栏写法](/write/diagrams/mermaid/dataflow) |
| 思维导图 | [`:::mindmap`](/write/diagrams/mindmap) | [围栏写法](/write/diagrams/mermaid/mindmap) |
| git 分支图 | [`:::gitgraph`](/write/diagrams/gitgraph) | [围栏写法](/write/diagrams/mermaid/gitgraph) |
| 块图 | [`:::block`](/write/diagrams/block) | [围栏写法](/write/diagrams/mermaid/block) |

### 画得出来但有瑕疵的

`timeline` / `quadrantChart` / `journey` / `packet-beta` / `radar-beta` / `xychart-beta` 能画，但**有几处颜色不跟主题走**，会报 `DIAG-304`。原因是那几种图的配色由引擎从主色算出来，算完的值既不是我们喂进去的哨兵、又躲过了替换。

### 不认中文的两种

`sankey-beta`（桑基图）和 `requirementDiagram`（需求图）的解析器**只认 ASCII 标识符**，中文节点名直接报 `DIAG-303`。实测于 mermaid 11.17.2。

要画流量分配，用[流程图](/write/diagrams/flowchart)把数值写在连线标签上。

## 图源写错了怎么办

得到 `DIAG-303`，提示会建议把图源贴到 <https://mermaid.live> 上定位——那是 Mermaid 官方的在线编辑器，报错比命令行清楚。

**图画不出来时产物照样写出来**：那张图的位置留一个占位框写明原因，其余部分完全正常，退出码是 `1`。

## CI 里要多做一步

镜像里得装 Chromium 及其系统依赖：

```bash
npx playwright install --with-deps chromium
```

完整的 CI 配置见[在 CI 里检查文档](/howto/ci)。

> 出处：[ADR-0004](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0004-mermaid-via-headless-browser.md)
