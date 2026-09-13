# 引擎各自成包，按需装；主包只认识 Mermaid

除 Mermaid 之外的七个图表引擎，**每个是一个官方的独立 npm 包**，用到哪个装哪个：

```
@nekoleapuki/pamphlet-cli                 主包，内置 Mermaid
@nekoleapuki/pamphlet-engine-graphviz     dot
@nekoleapuki/pamphlet-engine-mathjax      math
@nekoleapuki/pamphlet-engine-vega-lite    vega-lite
@nekoleapuki/pamphlet-engine-bytefield    bytefield
@nekoleapuki/pamphlet-engine-wavedrom     wavedrom
@nekoleapuki/pamphlet-engine-d2           d2
@nekoleapuki/pamphlet-engine-plantuml     plantuml（走外部命令，要 Java）
```

引擎包只含**适配代码**（几 KB 的胶水），真正的渲染器是它的依赖。没装引擎包的人一个字节都不多。

**本篇取代 [0008](./0008-builtin-engines.md) 的「内置」二字**，那份 ADR 原样保留：它列的引擎清单、各自补什么缺口、以及「全部可选依赖」的账都仍然成立，变的只是这些引擎住在哪里。

## 为什么不再内置

**账是一样的，位置不一样。** 0008 已经算过：六个 npm 引擎实测 189MB，叠上 Playwright + Chromium 约 150MB，全量约 340MB。它当时的解法是 npm 的 `optionalDependencies`。

现在换成独立包，因为可选依赖解决不了两件事：

- **可选依赖仍然写在主包的 `package.json` 里**，装主包时 npm 会去尝试解析它们。d2 一个包解包就 91.4MB（实测，新版把开源出来的 TALA 布局引擎打了进去），这个代价不该由只写纯文字的人承担哪怕一次尝试。
- **引擎的版本被主包钉住**。Mermaid 升一版和 MathJax 升一版没有任何关系，压在同一个 `package.json` 里的结果是两者互相牵制：改一个引擎的依赖就要发一次主包。

独立包把两件事都解开：不装就完全不存在，各自按各自的节奏发版。

## 和「三个包，不是十个」的关系

[0031](./0031-three-packages.md) 明确否掉了原始设计的十个包，理由是「`core`、`diagrams`、`html` 在单文件工具里几乎总是一起变」。引擎包不属于那一类，而且那份 ADR 自己写了口子：

> 真需要拆时**往外拆是加法**，不破坏使用方；反过来一上来就拆错，每次改动都变成跨六个包的连锁提交。

引擎包正是这种加法：主包的形状不变，`pamphlet build` 的行为对不装引擎的人一模一样。0031 里「包边界的价值只有两个：让多人并行、让外部按需依赖」这句话在这里成立的是第二个——而且是它最强的一次成立，因为单个引擎就 91.4MB。

## 发现机制：一张静态表加一次动态 import

主包里有一张常量表：围栏语言 → 引擎包名。渲染前，只为文档里**真的用到**的语言做一次动态 `import`；导入成功就用它导出的 `createEngine()`，失败就记下来，最后连同安装命令一起报出来。

不做插件系统，因为不需要：围栏语言的集合是固定的（`ast.ts` 的 `FENCE_LANGUAGES`），所以映射是常量，不需要扫描目录、不需要注册表、不需要配置文件。[0007](./0007-declarative-custom-engines.md) 的「配置零代码执行」因此原样保住——官方引擎包走的是内部抽象，第三方引擎仍然只能走声明式外部命令那条路。

## Considered Options

- **继续内置，靠 `optionalDependencies`**（0008 的原方案）：装法最简单，`pamphlet doctor` 一眼看全。落选理由见上：91.4MB 的 d2 和「引擎版本被主包钉住」。
- **只发 Mermaid，其余全走外部命令**（[0007](./0007-declarative-custom-engines.md) 那条路）：主包维护成本最低，一条机制包打所有。落选——那条路当初就写明了它的代价：「npm 上那些纯 JS 的渲染包无法直接挂上，必须自己套一层 CLI」。七个引擎里有五个正是纯 JS 包，逼每个用户自己包 CLI 是把成本转嫁给他们。
- **官方引擎包 + 外部命令并存**（本篇）：两条路各管各的——npm 生态里的渲染器走官方包，已经存在的外部程序走声明式命令。PlantUML 同时是两者的交点：它是 jar 不是 npm 包，所以那个官方包内部就是外部命令这条路。

## Consequences

**要多维护七个包的发版。** 这是本篇最实在的代价：七份 `package.json`、七条构建配置、发版时七个版本号。缓解办法是它们共用主包的 `engine-kit` 出口（换色、尺寸钉定、超时、哨兵表），引擎包自己只剩「怎么调那个渲染器」和「哨兵怎么注进去」两件事。

**换色规则必须留在主包。** 引擎包各自实现换色的话，「切主题图跟着变」这条承诺会在某一个引擎上悄悄失效，而这正是 [0016](./0016-diagram-theming-by-post-processing.md) 整篇在防的事。所以 `engine-kit` 不是便利，是约束。

**缺引擎仍然让整次构建失败**（沿用现状）。因此诊断里那条安装命令必须能直接粘贴运行——整次构建都因它失败，那条提示是作者唯一的出路。

**`pamphlet doctor` 要列出七个包各自装没装**，没装不计进退出码：在这一版里「没装」是常态而不是环境坏了。
