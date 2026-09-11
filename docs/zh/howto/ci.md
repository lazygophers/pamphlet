# 在 CI 里检查文档

目标：有人改坏了源文档，**在合并之前**就发现，而不是等到编译的时候。

用 `pamphlet lint` —— 它只检查语法、报诊断，**不产出任何文件**。

```bash
npx @nekoleapuki/pamphlet-cli lint "docs/**/*.md"
```

退出码非 `0` 就是有问题，CI 直接据此判断，不必解析输出。

## GitHub Actions

```yaml
name: 检查文档

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npx @nekoleapuki/pamphlet-cli lint "docs/**/*.md"
```

**通配符必须加引号** —— 不加的话 shell 会先抢着展开，而 `bash` 默认不支持 `**` 递归匹配，结果是只检查了一层却没有任何报错。详见[图片与资源](/write/diagrams/images)。

## 把警告也当成失败

```bash
npx @nekoleapuki/pamphlet-cli lint "docs/**/*.md" --fail-on-warn
```

默认只有 `error` 让退出码变 `1`，`warning` 不影响。加这个开关之后警告也算失败。

建议**新项目一开始就加上** —— 警告都是「现在能用但以后会咬人」的东西，等积累几十条再治理会很痛苦。

## 顺带编译出产物

`lint` 只检查不产出。要真的编译，用 `build`：

```yaml
      - run: npx @nekoleapuki/pamphlet-cli build "docs/**/*.md" --continue-on-error
```

`--continue-on-error` 让某一份出错后继续编译剩下的，退出码仍按「有没有失败」决定。不加的话第一份出错就停。

## 文档里有图的话

Mermaid 要真实浏览器，CI 镜像里得先装 Chromium：

```yaml
      - run: npm i -g mermaid-isomorphic playwright
      - run: npx playwright install --with-deps chromium
      - run: npx @nekoleapuki/pamphlet-cli build "docs/**/*.md"
```

`--with-deps` 会连系统依赖一起装（Linux 上必需）。这一步约 1 分钟。

**纯文字文档不需要这三行** —— 浏览器是惰性启动的，没有图就永远不会拉起它。

## 结构化输出给编辑器插件用

```bash
npx @nekoleapuki/pamphlet-cli lint "docs/**/*.md" --format json
```

输出 `{ reports, failed }`。

:::warning `--format json` 只对 `lint` 有效
`build` 忽略这个开关，永远输出人类可读的诊断；`ast` 本来就输出 JSON，这个开关只是让它不再往 stderr 打人类可读的诊断。
:::

## 升级编译器之后先跑一遍

0.x 期间**次版本升级允许破坏语法**（`0.0 → 0.1`）。把 `lint` 放进 CI 的最大价值就在这里 —— 升级时它第一时间告诉你哪份文档编不动了。详见[安装页的兼容性承诺](/start/install)。
