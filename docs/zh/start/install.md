# 安装

**不用装也能跑。**

```bash
npx @nekoleapuki/pamphlet-cli build 方案.md
```

`npx` 是 npm 自带的一条命令，意思是「下载这个包、跑一次、不留在我电脑里」。第一次会花十几秒下载（实测 86 个依赖、15 秒），之后 npx 自己有缓存。

## 装到本地

常用的话装到全局，命令名就是 `pamphlet`，不用每次打那一长串：

```bash
npm i -g @nekoleapuki/pamphlet-cli
pamphlet build 方案.md
```

或者只装进某个项目：

```bash
pnpm add -D @nekoleapuki/pamphlet-cli
```

:::info 包名和命令名不一样
npm 上的包叫 `@nekoleapuki/pamphlet-cli`，装完之后的命令叫 `pamphlet`。

不叫 `pamphlet` 是因为那个名字在 npm 上**被别人 2018 年就占了**（<https://www.npmjs.com/package/pamphlet>，最新版本 4.0.0），不是废弃包，拿不回来。
:::

装完只得到**编译器本体**。图表引擎一个都不带 —— 纯文字文档不需要它们，而它们全加起来约 340MB（见[其余七种图表](/write/diagrams/others)）。

## 要画图的话

本版本只实现了 Mermaid 一个引擎，它走无头浏览器：

```bash
npm i -g mermaid-isomorphic playwright && npx playwright install chromium
```

首次约 150MB、约 1 分钟，装一次就好。纯文字文档永远不会拉起浏览器。为什么非要真实浏览器不可，见 [Mermaid](/write/diagrams/mermaid)。

## 检查装了什么

```bash
pamphlet doctor
```

逐个引擎打印装了没有。装好了长这样：

```
✓ mermaid（mermaid）
```

没装长这样：

```
✗ mermaid（mermaid）：装一次就好：npm i -g mermaid-isomorphic playwright && npx playwright install chromium（首次约 150MB）
```

缺任何一个引擎退出码是 `3`（环境缺失）。

## 版本要求

- **Node.js ≥ 20**（`packages/pamphlet/package.json` 的 `engines.node`）
- **不需要 Java** —— 除非将来用 PlantUML，它是七个引擎里唯一要 Java ≥ 11 的

## 升级前必须知道的一件事

**0.x 期间只承诺修订号兼容。**

| 升级 | 承诺 |
|---|---|
| `0.0.1 → 0.0.2` | **不破坏任何东西** |
| `0.0 → 0.1` | **允许破坏**语法、CLI 参数、AST |

第一个发布的版本是 **0.0.1**。这与[语义化版本对主版本号为零时的规定](https://semver.org/lang/zh-CN/#spec-item-4)一致，不是 Pamphlet 自创的规矩。

**每次次版本升级（中间那位数字变了）都要检查自己的文档是否还能编译**：

```bash
pamphlet lint "docs/**/*.md"
```

放进 CI 里，升级时它会第一时间告诉你哪份文档编不动了 —— 具体怎么放见[在 CI 里检查文档](/howto/ci)。

:::danger 三样明确不稳定的东西
- **AST 结构**（`pamphlet ast` 的输出）—— 0.x 期间不承诺兼容
- **CLI 参数** —— 次版本可以改名、可以删
- **插件 API** —— 同上
:::

这三样恰恰是早期最需要反复调整的部分。把它们在 0.1 就锁死（考虑过，落选）等于把最该改的地方焊死。代价是真实的：对早期采用者不友好。这个代价被接受了，换来的是**语法在 0.x 期间可以自由纠错**。

到 1.0 会重新做这个决定，那时应当给出比修订号兼容强得多的承诺。

> 出处：[ADR-0006](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0006-versioning-promise.md)
