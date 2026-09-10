# npm 上叫 `@pamphlet/cli`，入口是 `npx` 而不是先安装

> **已被 [0044](./0044-npm-scope-is-the-username-scope.md) 取代。** 本文漏查了一件事：`@pamphlet` 这个作用域并不属于本账号，往它发布会得到误导性的 `404`。下面的内容保留为当时的记录，名字以 0044 为准。

发到 npm 的包名是 **`@pamphlet/cli`**，可执行文件名仍然是 `pamphlet`。文档和 README 的第一条命令一律写成：

```bash
npx @pamphlet/cli build 方案.md
```

首个发布版本 **0.0.1**。

## 为什么不是 `pamphlet`

[0001](./0001-name-pamphlet.md) 当初锁定了 npm scope `@pamphlet/*` 和 CLI 命令名 `pamphlet`，但没查过**不带 scope 的 `pamphlet` 还在不在**。查了：

| 项 | 值 |
|---|---|
| 归谁 | `savelbr` |
| 简介 | Write faster without distractions |
| 首次发布 | 2018-02-16 |
| 最新版本 | 4.0.0（2022-05-12） |

出处 <https://registry.npmjs.org/pamphlet>。这不是废弃包，npm 不会转让。

所以「不带 scope」这条路根本不存在，不是被权衡掉的——0001 定的 `@pamphlet/*` 反而是唯一还成立的那条。

## Considered Options

- **`@lazygophers/pamphlet`**：跟 GitHub 组织名一致。落选——代码里的内部包已经叫 `@pamphlet/runtime`，选它会让 npm 上并存两套命名空间，而 0001 明确说过「npm scope 一经发布就等于公共契约」。
- **`pamphlet-cli`**（不带 scope）：打字最短。落选——同上，和 `@pamphlet/runtime` 对不上，且把 `@pamphlet` 这个命名空间留给别人去占。

## 为什么把 `npx` 摆在第一条

原来文档的第一条命令是 `pnpm add -D pamphlet`，也就是**先要求读者做一个决定**（装到哪、用哪个包管理器），才能看到这东西干什么。

`npx` 把那个决定推后：下载、跑一次、不留在机器上。实测代价是 86 个依赖、15 秒，之后 npx 自己有缓存。对一个「试一下值不值得用」的人来说，这 15 秒比一次安装决定便宜。

`npx @pamphlet/cli` 能跑起来是因为包里**只有一个可执行文件**，npx 此时不要求它和包名同名。装到全局之后命令名是 `pamphlet`——和 0001 定的一致。

## Consequences

**必须同时发布 `@pamphlet/runtime`。** `pnpm` 打包时会把 `"@pamphlet/runtime": "workspace:*"` 改写成具体版本号，那个包不在 npm 上，装的人就缺件。`@pamphlet/themes` 也一起发——它不是依赖，但 [0031](./0031-three-packages.md) 说过它是可以单独消费的纯数据包，而且不发就等于把这个名字留给别人。

**三个包的版本号必须一起走。** 现在都是 0.0.1。cli 与 runtime 之间是精确依赖，版本对不上就是坏的。

**首版是 0.0.1 而不是 0.1.0。** [0006](./0006-versioning-promise.md) 的规则（0.x 只承诺修订号兼容）不受影响，只是那些拿 `0.1.0 → 0.1.1` 举例的地方全部改成 `0.0.1 → 0.0.2`，让文档和现实对得上。

**发布是不可逆的。** npm 只允许 72 小时内撤回，之后版本号永久占用。所以名字这件事在第一次 `npm publish` 之后就定死了。

**代价：读者要打的字变长了。** `npx @pamphlet/cli build x.md` 比 `pamphlet build x.md` 长 14 个字符。缓解方式只有一条——文档里在 `npx` 那条命令下面紧跟一句「常用就 `npm i -g @pamphlet/cli`，之后命令名是 `pamphlet`」。
