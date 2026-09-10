# npm 上用用户名作用域，包叫 `@nekoleapuki/pamphlet-*`

三个包发到 npm 时叫：

| 包 | 名字 |
|---|---|
| 编译器 + 命令行 | `@nekoleapuki/pamphlet-cli` |
| 浏览器侧运行时 | `@nekoleapuki/pamphlet-runtime` |
| 主题 token | `@nekoleapuki/pamphlet-themes` |

可执行文件名仍然是 `pamphlet`。文档和 README 的第一条命令是 `npx @nekoleapuki/pamphlet-cli build 方案.md`。

**取代 [0041](./0041-npm-package-is-scoped-cli.md)。**

## 0041 错在哪

0041 认定 `@pamphlet/*` 是唯一还成立的路径，因为不带作用域的 `pamphlet` 2018 年就被占了。那一半是对的。

它漏查的是**另一半**：`@pamphlet` 这个作用域到底属不属于我们。

npm 上带 `@` 的作用域只有两种合法来源（<https://docs.npmjs.com/cli/v10/using-npm/scope>）：

| 作用域 | 谁能用 |
|---|---|
| `@<用户名>/xxx` | 自动就有，不用申请 |
| `@<组织名>/xxx` | 必须先在 npm 上建那个组织 |

`@pamphlet` 两种都不是。账号 `nekoleapuki` 名下既没有这个用户名，也没有叫 `pamphlet` 的组织。

发布因此失败，而报错极具误导性：

```
× Failed to publish package @pamphlet/runtime@0.0.1 (status 404 Not Found):
  {"error":"Not found"}
```

**404 不是「找不到」，是「你没这个权限」。** npm 故意用 404 而不是 403——403 会泄露「这个名字存在」。

排查时确认过 token 和 2FA 都没问题：`npm whoami --registry=https://registry.npmjs.org/` 返回 `nekoleapuki`，`npm profile get` 显示 `two-factor auth: auth-and-writes`。

## Considered Options

- **在 npm 上建一个叫 `pamphlet` 的组织**：名字一个字不用改，约 2 分钟，还顺带把 `@pamphlet` 占住。落选——需要额外注册并长期维护一个组织，而组织名 `pamphlet` 是否还空着无法在未登录状态下确认（npm 把未登录用户的组织页面一律挡成 403）。
- **不带作用域，叫 `pamphlet-cli`**：最短、最好打，实测 `pamphlet-cli` / `pamphletjs` / `pamphlet-compiler` 在 npm 上都还空着。落选——把 `@pamphlet` 留给别人去占，而且三个包之间失去命名空间上的关联。

## Consequences

**名字变长了。** `npx @nekoleapuki/pamphlet-cli build x.md` 比 `npx @pamphlet/cli build x.md` 长 12 个字符。缓解方式和 0041 一样：npx 那条命令下面紧跟一句「常用就 `npm i -g @nekoleapuki/pamphlet-cli`，之后命令名是 `pamphlet`」。

**包名和品牌名对不上。** 项目叫 Pamphlet，包名前缀却是一个人的用户名。这是用户名作用域的固有代价。

**用户名作用域天然属于账号所有者，不会再出现所有权问题。** 这是选它的核心理由——它不依赖任何需要申请、可能被抢注、需要维护的外部资源。

**将来要搬回 `@pamphlet` 是一次不兼容的改名。** 老名字得留一个指向新名字的废弃包，或者直接断掉。所以这个决定的实际有效期是「到有人真的去建那个组织为止」。

**[0001](./0001-name-pamphlet.md) 锁定的三样东西里，只有 npm scope 这一样被推翻了。** CLI 命令名 `pamphlet` 和对外品牌 Pamphlet 都没变——用户敲的仍然是 `pamphlet build`。0001 说「npm scope 一经发布就等于公共契约」，而这次改名发生在**第一次发布成功之前**，所以没有破坏任何已有契约。

**[0031](./0031-three-packages.md) 里写的三个内部包名已经过时**（`@pamphlet/runtime`、`@pamphlet/themes`）。那份 ADR 记录的是「为什么拆三个包」，拆分的理由不受影响，所以原文保留不改；名字以本文为准。
