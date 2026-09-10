# 安装

```bash
pnpm add -D pamphlet
```

装完只得到**编译器本体**。图表引擎一个都不带——纯文字文档不需要它们，而它们全加起来约 340MB（见[图表引擎全部是可选依赖](/limits/engines)）。

## 先跑一遍

```bash
pamphlet build 方案.md
```

得到 `方案.html`。产物默认写在源文档旁边，双击就能打开。

想看体积都花在哪：

```bash
pamphlet build 方案.md --verbose
```

会逐项打印骨架、样式、运行时、图表、字体、图片各占多少字节和 gzip 后多少。Pamphlet 不设体积门槛，只把账摊开给你看。

## 要画图的话

本版本**只实现了 Mermaid 一个引擎**。源码里 `packages/pamphlet/src/diagrams/` 只有 `mermaid.ts`，其余六个引擎在 [ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md) 里已经定了形态但还没写。写 ` ```d2 ` 这类围栏会得到 `DIAG-301`「没有装能画 d2 的引擎」。

Mermaid 走无头浏览器（Playwright + Chromium），因为 Mermaid 必须用真实浏览器的布局引擎算文字尺寸——jsdom 没实现 `SVGTextElement.getBBox()`，量不出一段文字有多宽就没法排版。这不是选型偏好，是 Mermaid 组织成员 @aloisklink 明确说过的事（<https://github.com/mermaid-js/mermaid/issues/3886#issuecomment-1341694822>）。

```bash
npm i -g mermaid-isomorphic playwright && npx playwright install chromium
```

首次约 150MB、约 1 分钟。这个代价落在「装一次」而不是「每次用」。

## 检查装了什么

```bash
pamphlet doctor
```

逐个引擎打印装了没有；缺任何一个退出码是 `3`（环境缺失）。装好了长这样：

```
✓ mermaid（mermaid）
```

没装长这样：

```
✗ mermaid（mermaid）：装一次就好：npm i -g mermaid-isomorphic playwright && npx playwright install chromium（首次约 150MB）
```

## 版本要求

- **Node.js ≥ 20**（`packages/pamphlet/package.json` 的 `engines.node`）
- **不需要 Java**——除非将来用 PlantUML，它是七个引擎里唯一要 Java ≥ 11 的

## 升级前先看一眼

0.x 期间**只承诺修订号兼容**：`0.1.0 → 0.1.1` 不破坏任何东西，`0.1 → 0.2` 允许破坏语法、CLI 参数和 AST。详见[兼容性承诺](/limits/versioning)。
