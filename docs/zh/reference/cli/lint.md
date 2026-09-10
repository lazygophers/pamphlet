# lint

只检查语法、报诊断，**不产出任何文件**。

```bash
pamphlet lint "docs/**/*.md"
pamphlet lint "docs/**/*.md" --format json
```

| 选项 | 说明 |
|---|---|
| `--format json` | 结构化输出 `{ reports, failed }`，给 CI 和编辑器插件用 |
| `--fail-on-warn` | 警告也算失败 |
| `--continue-on-error` | 某份出错后继续检查剩下的 |

## 输出长什么样

诊断**按文件分组**，每组带文件头；每条带源码片段、修复建议和文档链接；末尾**固定打印**一行汇总，哪怕全部通过。

真实输出：

```
pflint/b.md
  error[DIR-204] tab 缺少标题
    --> pflint/b.md:3:1
    |
  3 | :::tab
    | ^
    |
    = 标题写在方括号里：:::tab[标题]。Tab 的标题就是那个可以点的按钮
    https://lazygophers.github.io/pamphlet/reference/diagnostics.html#dir-204

  warning[DIR-201] 未知指令 note，内容已按普通段落输出
    --> pflint/b.md:7:1
    |
  7 | :::note
    | ^
    |
    = note 在 Pamphlet 里叫 info。四种提示块是 info / tip / warn / danger
    https://lazygophers.github.io/pamphlet/reference/diagnostics.html#dir-201

──────────────────────────────────────────────
1 份通过，1 份失败，2 条错误，1 条警告
失败：pflint/b.md
```

汇总行**固定打印**是有意的 —— 静默的成功会让人怀疑它到底跑了没有。

## 放进 CI

见[在 CI 里检查文档](/howto/ci)。
