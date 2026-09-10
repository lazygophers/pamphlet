# Pamphlet 项目约定

## git

**这个仓库允许主动 commit，不必每次问。** 用户 2026-09-10 明确授权（原话：「记住，要自动commit」）。

规矩不变的部分：

- 一批相关改动打成一个 commit，commit message 说清**为什么**，不是罗列改了哪些文件
- **push 仍然要问** —— 推送会触发 GitHub Actions 部署文档站和发布 npm 包
- 强制推送、改写历史、`rm -rf`、删表这类不可逆操作，照旧要先停下来确认

## 术语与设计决策

术语表在 `CONTEXT.md`，设计决策在 `docs/adr/`。改动碰到哪条决策就去读那份 ADR，不确定就新写一份而不是偷偷改旧的。

## Agent skills

### Issue tracker

Issues 存本地 markdown：`.scratch/<feature-slug>/issues/NN-<slug>.md`（每 ticket 一个文件）。见 `docs/agents/issue-tracker.md`。

### Triage labels

默认五角色，标签串等于角色名（`needs-triage` / `needs-info` / `ready-for-agent` / `ready-for-human` / `wontfix`）。见 `docs/agents/triage-labels.md`。

### Domain docs

single-context：根目录 `CONTEXT.md` + `docs/adr/`，所有 packages 共享。见 `docs/agents/domain.md`。
