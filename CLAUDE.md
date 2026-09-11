# Pamphlet 项目约定

## git

**这个仓库允许主动 commit，不必每次问。** 用户 2026-09-10 明确授权（原话：「记住，要自动commit」）。

规矩不变的部分：

- 一批相关改动打成一个 commit，commit message 说清**为什么**，不是罗列改了哪些文件
- **push 仍然要问** —— 推送会触发 GitHub Actions 部署文档站和发布 npm 包
- 强制推送、改写历史、`rm -rf`、删表这类不可逆操作，照旧要先停下来确认

## 包源

**这个仓库只用 npm 官方源**，由根目录的 `.npmrc` 钉住——项目级配置覆盖 `~/.npmrc`，所以在这个目录里跑的每条 `npm` / `npx` / `pnpm` 都走官方源。

禁止把 registry 改成镜像站（`npmmirror` / `taobao` / `cnpmjs`），也禁止给某个作用域单独指别处。`packages/pamphlet/test/registry.test.ts` 看着这件事。

理由不是偏好：**镜像带来的失败，报错指向的原因是错的**。刚发布完去核验时镜像回的是「没有这个版本」，而包已经在官方源上了——照着那条报错查会去翻发布流程，翻不到问题。发布更不能走镜像：它只读，也不认账号登录。

## 术语与设计决策

术语表在 `CONTEXT.md`，设计决策在 `docs/adr/`。改动碰到哪条决策就去读那份 ADR，不确定就新写一份而不是偷偷改旧的。

## Agent skills

### Issue tracker

Issues 存本地 markdown：`.scratch/<feature-slug>/issues/NN-<slug>.md`（每 ticket 一个文件）。见 `docs/agents/issue-tracker.md`。

### Triage labels

默认五角色，标签串等于角色名（`needs-triage` / `needs-info` / `ready-for-agent` / `ready-for-human` / `wontfix`）。见 `docs/agents/triage-labels.md`。

### Domain docs

single-context：根目录 `CONTEXT.md` + `docs/adr/`，所有 packages 共享。见 `docs/agents/domain.md`。
