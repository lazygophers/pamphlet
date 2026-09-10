# 编译目标只能显式传路径

`pamphlet build` 必须明确告诉它编译哪些文件。**不带参数时不猜任何默认值**，也没有 `include` / `exclude` 配置字段。

```bash
pamphlet build docs/方案.md
pamphlet build docs/方案.md docs/预算.md
pamphlet build "docs/**/*.md"
```

## 通配符要加引号

**通配符由 Pamphlet 自己展开，不依赖 shell。**

```bash
pamphlet build "docs/**/*.md"     # ✅ 加引号
pamphlet build docs/**/*.md       # ❌ shell 会先抢着展开
```

不加引号时 shell 会先展开一遍，而不同 shell 对 `**` 的支持并不一致：`zsh` 原生支持递归匹配，`bash` 要先 `shopt -s globstar`，否则 `docs/**/*.md` **只匹配一层**。

后果是 CI 里出现「只编译了一部分文件却没有任何报错」——那比报错更难发现。

## 不做任何默认排除

:::danger 这一条会咬人
```bash
pamphlet build "**/*.md"     # ❌ 别这么写
```

在一个装了依赖的仓库里，这会命中 `node_modules` 下**成百上千份第三方 Markdown**。而产物写在源文档旁边，于是那些 HTML 会散落在你的依赖目录里。

正确写法是把范围限定住：

```bash
pamphlet build "docs/**/*.md"    # ✅
```
:::

编译器不隐藏任何决定。通配符匹配到什么就编译什么——这是明知代价的选择，换来的是「行为完全可预期」。

## 为什么不读 `.gitignore`

`.gitignore` 说的是**「什么不要提交」**，与**「什么不要编译」**是两件事。

混用会产生静默的意外：有人因为产物在 `docs/` 里而把整个目录加进 `.gitignore`，结果源文档也一起不编译了。

## 多文件的「部分成功」

传多个路径时会出现「一部分成功一部分失败」这个状态，处理方式是：

| 情况 | 行为 |
|---|---|
| 任一失败 | 退出码 `1`，**已产出的产物仍然留在磁盘上** |
| 加 `--continue-on-error` | 继续编译剩下的，退出码仍按是否有失败决定 |
| 诊断输出 | 按文件分组，每组带文件头 |
| 汇总行 | **固定打印**，哪怕全部成功；失败的文件名单独列出 |
| 加 `--verbose` | 体积报告逐份输出，末尾给一个合计 |

「读不到的文件」只进失败名单，不参与「通过数」的统计。

## 为什么不做配置文件

考虑过两种，都落选：

- **配置里的 `include` / `exclude` 清单**：编译一批文档时最省事，而且可以隐式排除 `node_modules`。落选。
- **不带参数时默认编译当前目录下所有 `.md`**：开箱即用。落选——会把 `README.md`、`CHANGELOG.md` 以及依赖目录里的第三方 Markdown 一起编译，产出一堆没人要的文件。

根本原因是：任何 `.md` 都是 Pamphlet 的合法输入（源文档不需要任何身份标记），既然如此，「编译哪些」就必须完全由你说清楚，不能由编译器推断。

> 出处：[ADR-0023](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0023-explicit-file-paths-only.md)
