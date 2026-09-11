# 让 AI 帮你写 Pamphlet 文档

仓库里有三份**写给 AI 看的说明书**（skill）。装上之后，AI 助手写 Pamphlet 文档时会自己把它们读进去——不用你每次粘一遍语法。

```bash
npx skills add lazygophers/pamphlet
```

这条命令会列出三份让你挑，装到当前项目的 `.claude/skills/`。装到全局（所有项目都能用）加 `-g`。

## 三份分别管什么

| 名字 | 什么时候被用上 |
|---|---|
| `pamphlet-syntax` | 写 frontmatter、九个指令、图表围栏、插图；编译报出 `DOC` / `DIR` / `DIAG` / `EMB` 开头的码 |
| `pamphlet-theme` | 挑主题、只改一两个颜色 |
| `pamphlet-best-practices` | 判断题：什么时候该用标签页、图画到什么程度、交付前查什么 |

只装其中一份：

```bash
npx skills add lazygophers/pamphlet --skill pamphlet-syntax
```

`--skill` 是单数，可以重复写多次。

## 它和文档站是什么关系

两份东西给的是不同的东西：

| | 给谁 | 什么时候被读 |
|---|---|---|
| 这个文档站 + [`llms.txt`](https://lazygophers.github.io/pamphlet/llms.txt) | 人 / AI | 要查某一页时去抓 |
| skill | AI | **一遇到相关的活就自动加载** |

文档是资料，skill 是照着做的步骤。比如「这份文档是事故报告，所以该用 `incident` 主题、步骤会渲染成时间轴」——这是判断，文档里不会这么写。

站点的每一页都另存了一份 Markdown：把地址里的 `.html` 换成 `.md` 就是。全站索引在 `/llms.txt`，全文打包在 `/llms-full.txt`。

## 装的是什么、怎么更新

`npx skills add` 从这个 git 仓库直接拉文件，所以它拉到的就是 `skills/` 目录里那三个文件夹。更新：

```bash
npx skills update
```

主题清单、token 清单、诊断码表这三份附件**由构建脚本从源码生成**（`pnpm skills:sync`），仓库里有测试盯着它们不许过期——所以不会出现「代码加了一套主题、说明书还是旧的」。

`skills` 这个命令行工具不是 Pamphlet 的东西，是 <https://github.com/vercel-labs/skills>，支持 Claude Code、Cursor、Codex 等几十种 AI 助手。
