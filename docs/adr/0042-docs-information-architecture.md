# 文档站按 Diátaxis 四分，一个概念一个文件

文档站的顶层目录改成 **开始 / 写作 / 指南 / 参考 / 设计 / 常见问题**，34 个页面 × 2 种语言，一个概念一个文件。

```
docs/zh/
├─ index.md
├─ start/      what-is-it · install · quickstart
├─ write/      index
│              markdown/   commonmark · gfm
│              directives/ index · callout · tabs · collapse · steps · reveal
│              diagrams/   index · mermaid · others
│              assets
├─ howto/      ci · theme · custom-engine
├─ reference/  syntax
│              cli/  index · build · serve · lint · ast · extract · doctor
│              frontmatter · theme-tokens · diagnostics
├─ design/     output · compare
└─ faq.md
```

`docs/en/` 严格对等。[0040](./0040-docs-site-uses-rspress-not-vitepress.md) 定的 Rspress、Actions 部署、ADR 不进站点全部不变。

## 换掉的是什么

原来是 13 页 × 2：`guide/`（4）+ `limits/`（5）+ `reference/`（3）+ 首页。

拿 [Diátaxis](https://diataxis.fr/) 量一遍，四类里只有两类存在：

| 类型 | 读者在干嘛 | 原来有吗 |
|---|---|---|
| Tutorial | 第一次用，要一次成功 | **没有** |
| How-to | 有具体任务，要答案 | **没有** |
| Reference | 写到一半要查 | 有 3 页 |
| Explanation | 想懂设计意图 | 有 5 页 + 41 份 ADR |

缺的正好是最贴近新用户的两类。而 `limits/` 那 5 页占了顶层，等于新人第一眼看见 5 页「我做不到什么」。

Diátaxis 不是随便选的：Django、Cloudflare、Gatsby 都用它（<https://diataxis.fr/adoption/>），读者在别处养成的扫描习惯在这里直接生效。

## 五条边界拆散并入

`limits/` 那 5 页按「读者什么时候撞上它」并进相关页面：

| 原页面 | 并到 |
|---|---|
| versioning | `start/install.md` |
| raw-html | `write/markdown/commonmark.md` |
| file-paths | `write/assets.md` |
| engines | `write/diagrams/others.md` |
| mobile | `design/output.md` |

[0037](./0037-readme-is-a-pitch-docs-site-holds-the-edges.md) 要求每条边界有稳定 URL。核实过：**代码里没有任何指向 `limits/` 的链接**（`grep -rn "limits/" packages/*/src/` 无结果），那条要求当时没有落地成事实，所以拆散不打断任何东西。

**唯一真的写死在代码里的文档 URL 只有一条**：`packages/pamphlet/src/diagnostics.ts:52` 的 `DOC_BASE`，指向 `reference/diagnostics.html#`。这个路径在新结构里原地不动。

## 一个概念一个文件

9 个指令拆成 6 个文件（4 种提示块合成 1 页），6 个 CLI 子命令各 1 页。

收益是**改一个指令只动一个文件**：git 历史干净、冲突少、AI 改起来不用读整页。代价是页数翻倍（13 → 34），中英对等意味着 68 个文件。

配套的一条约束：`reference/syntax.md` **只放速查表，不写讲解**。它和指令详情页天然重复，把讲解剔掉之后重复的只剩「参数名」那一列，那一列几乎不会变。

## Considered Options

- **按动作分（上手 / 写作 / 参考 / 深入）**：14 页，比 A 少 3 页。落选——没有独立的 how-to 区，CI、自定义引擎这类任务只能塞进「深入」，不好找。
- **只分「学 / 查」两类**：12 页，最省。落选——how-to 同样无处可放。
- **5 页边界合成 1 页留在「设计」区**：改动最小。落选——仍然要读者主动跳过去看，而「拆开并入」让答案出现在他撞上问题的那一页。
- **保持 13 页只重排目录**：约 30 分钟。落选——查代码发现现有文档有 6 处在描述不存在的功能（见下），那不是重排能修的。

## Consequences

**重写顺带修掉了六处「文档说谎」。** 这些是拿代码逐条核对出来的，不是推测：

| 文档原话 | 代码事实 |
|---|---|
| `syntax.md:37` `{class}` `{id}` 任何指令都能带 | `directives.ts:83` 只跳过警告，`html.ts:209,221,255` 只读 `open`/`effect`/`default`，值被静默丢弃 |
| `theme-tokens.md:49,53-60` 共 9 个变量 | `--pf-code-fg` 和 8 个 `--pf-callout-*` 在 `theme.ts` 里根本不存在 |
| `syntax.md:3`「没有第三种扩展」 | `parse.ts:35` 开了 GFM，表格 / 删除线 / 任务列表都能用 |
| `cli.md:32` `--format json` 是全局选项 | `cli.ts:314` 只有 `lint` 认它 |
| `cli.md` 没写 `--out` | `cli.ts:150` 它是 `-o` 的别名 |
| `cli.md` 没写 `NO_COLOR` | `cli.ts:135` 支持 |

**顺带修了一个真 bug**：脚注被静默吞掉（`parse.ts:35` 解析得出来，`html.ts:172-175` 没有分支）。现在报 `DOC-105` 错误，见 [0043](./0043-footnotes-error-not-dropped.md)。

**`CONTEXT.md` 里三处术语定义也是错的**，一并改了：callout 说「带底色和图标」（两样都没有）、语义层说 17 个（实为 18）、元素层说「30 多个」（实为 16）。

**旧的 26 个文件全部删除。** git 历史里永远存在（`f6b65b3` 及之前）。留着会让 Rspress 的约定式路由同时收录两套页面，侧边栏出现重复条目。

**多语言维护成本翻倍。** 每加一页就是两个文件。这个代价在第 1 轮问答里被明确接受——发到 npm 的开源项目，英文版缺页比没有英文版更伤。

**「方案对比」这一页会自己过时。** 它比的是 Pandoc 和 Typora / Obsidian，别人发新版就可能写错。缓解方式是每条都标了核对日期和出处。不比 VitePress / mdBook——那是网站生成器，和单文件产物不是一类东西。
