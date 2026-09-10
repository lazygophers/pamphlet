# Mermaid

本版本**唯一实现了的引擎**。流程图、时序图、甘特图、状态图都归它画。

````markdown
```mermaid
flowchart LR
  A[请求] --> B{Redis 有吗}
  B -->|有| C[直接返回]
  B -->|没有| D[查数据库]
```
````

Mermaid 自己的语法手册在 <https://mermaid.js.org/intro/>。Pamphlet 不改它的语法，也不加自己的扩展。

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

jsdom（一个纯 JavaScript 的假浏览器）没有实现 `SVGTextElement.getBBox()` —— 量不出一段文字有多宽，就没法为图形排版。

这不是选型偏好。Mermaid 组织成员 @aloisklink 明确否定过 jsdom 方案：<https://github.com/mermaid-js/mermaid/issues/3886#issuecomment-1341694822>

代价落在「装一次」而不是「每次用」。

## 浏览器是惰性启动的

**纯文字文档永远不会拉起它。** 只有真的遇到 ` ```mermaid ` 围栏才启动。

实测数据：

| 场景 | 耗时 |
|---|---|
| 第 1 张图（含浏览器冷启动） | 733ms |
| 之后每张 | 364ms |
| 40 节点大图 | 412ms |

`DIAG-303` 的超时门槛是 **10 秒**，约是最坏值的 13 倍。

## 图源写错了怎么办

得到 `DIAG-303`，提示会建议把图源贴到 <https://mermaid.live> 上定位 —— 那是 Mermaid 官方的在线编辑器，报错比命令行清楚。

## CI 里要多做一步

镜像里得装 Chromium 及其系统依赖：

```bash
npx playwright install --with-deps chromium
```

完整的 CI 配置见[在 CI 里检查文档](/howto/ci)。

> 出处：[ADR-0004](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0004-mermaid-via-headless-browser.md)
