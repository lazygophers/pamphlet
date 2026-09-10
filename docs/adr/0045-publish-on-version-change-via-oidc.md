# 版本号变了就自动发布，身份走 OIDC 不放 token

`.github/workflows/publish.yml`：推到 `master` 就跑，跑通全部检查后执行 `pnpm publish -r`。

**发不发由版本号决定**，不由人决定：`pnpm -r publish` 会先问 registry「这个版本发过没有」，发过的直接跳过。官方原话是 "pnpm will publish all the packages that have versions not yet published to the registry"（<https://pnpm.io/cli/publish>）。所以改 `version` 并推送，就是发布动作本身。

**CI 里没有任何凭据。** 身份走 npm 的 Trusted Publishing：GitHub Actions 用 OIDC 向 npm 证明「我是 `lazygophers/pamphlet` 仓库里那条 `publish.yml`」，npm 据此签发一个一次性的发布权限。工作流里只需要：

```yaml
permissions:
  contents: read
  id-token: write
```

出处 <https://docs.npmjs.com/trusted-publishers/>。

## 为什么不放 token

上一次手工发布暴露了这条路的真实成本：npm token 明文躺在 `~/.npmrc` 里，排查问题时被一条 `grep` 带进了终端记录。放进 GitHub Secrets 只是换个地方躺着——它仍然长期有效，泄露了任何人都能冒名发包，而且要等你发现才作废得掉。

OIDC 没有「可被偷走的东西」。凭据在每次运行时现签、用完即失效。

## 三个前提，都已满足

| 前提 | 状态 |
|---|---|
| npm CLI ≥ 11.5.1、Node ≥ 22.14.0 | CI 里钉了 `node-version: 22` |
| pnpm 支持 OIDC | 11.0.7 起 OIDC 优先于静态 token（<https://github.com/pnpm/pnpm/releases/tag/v11.0.7>），本仓库钉的是 12.3.4 |
| **首个版本必须手工发过** | 三个包的 0.0.1 已于 2026-09-10 手工发布 |

第三条原本是拦路虎：OIDC 发不了一个还不存在的包。

## Considered Options

- **打 tag 才发（`v0.0.2`）**：「什么时候发」完全由人掌控，还顺带在 git 里留下发布点。落选——tag 和 `package.json` 的版本号要靠人保持一致，对不上时会发出一个和 tag 不符的版本，而这种错位没有任何东西会拦。
- **只做 `workflow_dispatch` 手工触发**：最保守。落选——那不是自动发布。
- **把 Granular Access Token 放进 Secrets**：配置快 3 分钟。落选，理由见上。

## Consequences

**发布前跑全套检查**：`pnpm typecheck`、`pnpm test`（362 条）、`pnpm docs:build`。文档站也编一遍，是因为编不过通常意味着文档里引了不存在的页面，那种错误不该跟着包发出去。

**CI 里要装 Chromium。** `artifact-in-browser` 和 `contrast` 两个测试需要真实浏览器（[0004](./0004-mermaid-via-headless-browser.md)），少了它们会失败而不是跳过。这一步约 1 分钟，整条工作流约 3 分钟。

**每个包都要在 npm 上单独配一次信任关系**（填 GitHub 组织、仓库、工作流文件名）。三个包就是三次。**改工作流文件名等于断掉这层信任**，得回 npm 上同步改。

**`publish.yml` 这个文件名是配置的一部分**，不能随手重命名。

**2FA 在这条路上会不会仍然要动态码，官方文档没写。** 按设计不需要（CI 里没人能输码），但这一条到第一次真跑之前都只是推断。真失败的代价是白跑一次工作流，不会发出坏包。

**`deploy.yml` 和 `publish.yml` 会在同一次推送上并行跑。** 两者互不依赖：一个发站点，一个发包。发布失败不影响文档站上线，反之亦然。
