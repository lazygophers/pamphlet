# 图表以 Mermaid 为主引擎，预渲染走无头浏览器（Playwright）

Mermaid 是主图表引擎，构建期通过 [mermaid-isomorphic](https://github.com/remcohaszing/mermaid-isomorphic)（官方方案，内部使用 Playwright + Chromium）预渲染为静态 SVG。Playwright 作为可选依赖：没装时纯文本文档照常编译，遇到图表围栏给出诊断并提示安装命令。内置的第二批引擎见 [0008](./0008-builtin-engines.md)。

## Considered Options

原始设计的方案是「Node 内 Mermaid + jsdom 直接渲染，无需 Puppeteer」。**这个假设是错的。** Mermaid 组织成员 @aloisklink 明确否定：Mermaid 依赖真实浏览器的布局引擎计算尺寸与位置，jsdom 做不到（<https://github.com/mermaid-js/mermaid/issues/3886#issuecomment-1341694822>）。根因是 jsdom 未实现 `SVGTextElement.getBBox()`——量不出一段文字的尺寸，就无法为图形排版。官方替代方案 mermaid-isomorphic 的 README 直接要求 `npm install playwright && npx playwright install --with-deps chromium`。

- **只用 d2**（`@terrastruct/d2` 是 npm 包、WASM 实现，Node 里直接跑，输出 SVG 不需要浏览器，只有导 PNG 才需要——<https://www.npmjs.com/package/@terrastruct/d2>；命令行形态也支持 `d2 - -`，<https://d2lang.com/tour/exports/>）：工程上最干净——编译型渲染器、自己算排版、不需要浏览器、毫秒级而非无头浏览器的秒级启动。**但它会抽掉 [0002](./0002-source-extension-is-md.md) 的地基**：沿用 `.md` 后缀的唯一理由是「逃生兼容」，即源文档丢到 GitHub 上 ` ```mermaid ` 代码块能被原样渲染，而 GitHub 只原生渲染 Mermaid。
- **只对接自托管 Kroki**：一个服务覆盖十几种图表，但编译期必须联网或自己跑 Docker，与「自包含」的上游精神冲突，也会把开源采用门槛拉到「先装 Docker」。

## Consequences

**代价是真实的，且必须写进文档站**（不是第一版 README——见 [0018](./0018-mobile-promise-narrowed.md) 的同一处安排）：首次使用图表功能要下载约 150MB 的 Chromium、约 1 分钟。这个代价落在「装一次」而非「每次用」，并靠可选依赖把它挡在纯文本用户之外。

CI 环境要额外处理：镜像里得装 Chromium 及其系统依赖（`--with-deps`），这是原始设计完全没有排期的一块工作，还包括无头浏览器进程池、渲染超时、并发上限。

`Mermaid + Playwright` 这条路的性能特征与 d2 相反（无头浏览器启动是秒级、d2 是毫秒级），因此「增量构建 < 500ms」这个性能目标只在浏览器实例复用（常驻进程）的前提下成立。
