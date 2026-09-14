# Issue tracker：本地 markdown

票是 markdown 文件，存在 `.scratch/issues/` 下，按**开着还是做完了**分两个目录：

```
.scratch/issues/
├── open/    还没做完的
└── done/    做完了的
```

一张票一个文件，文件名 `NN-<短标题>.md`。

> 2026-09-14 从 GitHub Issues 换回来的（此前 2026-09-11 从本地换去过 GitHub）。
> 换回来时把 GitHub 上那 48 张票连同全部评论导出到了 `done/` 和 `open/`，
> GitHub 上的原票没有删，还在 <https://github.com/lazygophers/pamphlet/issues>。

## ⚠️ `.scratch/` 不进版本库

`.gitignore` 第 7 行排除 `.scratch/`。**这是明知的选择**（2026-09-14 用户确认），但代价要写在这里，因为它踩过一次：

> 2026-09-11 从本地换去 GitHub 的原因就是这个——上一个功能的五张票连同 spec 随 `.scratch/` 一起没了，git 里找不回来。

所以：

- 票只活在这台机器上，`rm -rf` 或换台机器就没了
- **重要结论不要只写在票里**。实测数据、设计决策、术语，该落到 `docs/adr/`、`CONTEXT.md` 或代码注释里——那些进版本库
- 导出的那 48 张票同理：它们是本地副本，真正的备份是 GitHub 上那些没删的原票

## 没有 triage 标签

这个仓库不用五角色标签（2026-09-14 用户确认）。票只有两种状态，**靠它在哪个目录表示**：

- `open/` = 还没做完
- `done/` = 做完了，`git mv` 过去（它不进 git，所以其实就是 `mv`）

`triage` 这个 skill 的五个角色在这里用不上。

## 约定

- **建一张票**：在 `.scratch/issues/open/` 下写一个 `NN-<短标题>.md`，`NN` 取当前最大号加一
- **读一张票**：直接读那个文件
- **列全部**：`ls .scratch/issues/open/`
- **搜**：`grep -rl "关键词" .scratch/issues/`
- **关掉**：`mv .scratch/issues/open/NN-*.md .scratch/issues/done/`
- **评论**：追加在文件末尾，用 `---` 分隔，写清是谁什么时候写的

## 票的模板

```markdown
# NN: 标题

**要做出什么：** 做完之后从使用者角度看是什么样，不是分层的实现清单。

**被谁挡着：** 哪几张票做完了它才能开始，或者「没有，随时能开」。

- [ ] 验收条件 1
- [ ] 验收条件 2
```

## skill 说「发布到 issue tracker」时

在 `.scratch/issues/open/` 下建一个 markdown 文件。

## skill 说「取那张票」时

读 `.scratch/issues/*/NN-*.md`。

## wayfinder 用到的那几样

`/wayfinder` 需要「地图 + 子票 + 阻塞关系 + 前沿」，本地目录上这样表示：

- **地图**：`.scratch/issues/open/NN-map-<名字>.md`，正文含「目的地 / Notes / Decisions so far / Not yet specified / Out of scope」五段
- **子票**：普通票文件，正文头一行写 `Part of NN`
- **阻塞**：票里写一行 `**被谁挡着：** NN, NN`
- **前沿**：`open/` 里那些「被谁挡着」列的票都已经在 `done/` 里的
- **认领**：票里写一行 `**在做：** <名字>`
- **解决**：把答案追加到票末尾，`mv` 进 `done/`，再把一行摘要加到地图的 Decisions so far
