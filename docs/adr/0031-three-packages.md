# 三个包，不是十个

- **`pamphlet`** —— 库加 CLI：解析、AST、图表引擎适配、HTML 组装、资源内嵌、诊断、命令行。全部是 Node 侧、同一个构建目标。
- **`@pamphlet/runtime`** —— 浏览器侧：约 1KB 事件委托内核加六个独立特性片段。这个包必须独立，是 [0012](./0012-runtime-assembled-not-bundled.md) 的硬约束（它要被单独构建成浏览器能跑的片段，和 Node 侧是两套构建目标）。
- **`@pamphlet/themes`** —— 纯数据：内置主题的 token YAML。独立是因为使用者可能只想装一套主题而不装编译器。

原始设计规划的十个包（`core` / `diagrams` / `runtime` / `html` / `themes` / `cli` / `config` / `diagnostics` / `language-server` / `vscode`）不采用。语言服务与编辑器插件将来真做时再开新包。

## Considered Options

- **五个包**（`core` / `diagrams` / `html` / `runtime` / `cli`，合掉 config、themes、diagnostics）：保留原始设计的主要分层。落选——`core`、`diagrams`、`html` 在单文件工具里几乎总是一起变（加一个图表引擎要同时动适配和内联输出），跨包联动依然存在。
- **原始的十个包**：结构清晰，将来做语言服务时位置已留好。落选。
- **单个包，`runtime` 也放进去**：配置最少。落选——与 [0012](./0012-runtime-assembled-not-bundled.md) 冲突，且让「只想要运行时」的使用者被迫装整个编译器。

## Consequences

包边界的价值只有两个：让多人并行、让外部按需依赖。单人开发拿不到第一个；第二个在这里只对 `runtime`（浏览器构建目标）和 `themes`（纯数据）成立。

被合掉的那六个全是 Node 侧、同一构建目标、且只有一个消费者——拆开的唯一效果是六份 `package.json`、六条构建配置、跨包改一行要走版本号联动。

真需要拆时**往外拆是加法**，不破坏使用方；反过来一上来就拆错，每次改动都变成跨六个包的连锁提交。

`config` 包本来就随配置文件的删除而消失（见 [0030](./0030-frontmatter-only-configuration.md)）。

三个包在「语法与解析器」阶段就全部建起来了。`@pamphlet/runtime` 与 `@pamphlet/themes` 此时只有各自的常量与说明（特性片段名、语义层 token 名），实现内容随 HTML 输出一起到位。这样做的代价是两个包会在 `pnpm -r build` 里各占一个几乎空跑的目标；换来的是构建配置一次立好——尤其 `runtime` 的构建目标（浏览器、ES2018、不能用 ES module）和 Node 侧完全不同，早立起来就不会到时候才发现配置冲突。
