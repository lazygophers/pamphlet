# ast

打印这份文档解析出来的语法树。

```bash
pamphlet ast 方案.md
```

输出 `{ path, frontmatter, ast, diagnostics }` 的 JSON 到标准输出。

一次只接一个文件，匹配到多个会报错退出 `2`。

:::danger 0.x 期间 AST 不稳定
AST 结构在 0.x 期间**不承诺兼容**，次版本升级就可能变。别拿它当稳定接口做工具。见[安装页的兼容性承诺](/start/install)。
:::

## 这几个开关对它无效

| 开关 | 实际行为 |
|---|---|
| `--format json` | 它本来就输出 JSON。这个开关只是让它不再往 stderr 打人类可读的诊断 |
| `--fail-on-warn` | **忽略** |
| `--continue-on-error` | **忽略**（本来就只接一个文件） |

## 什么时候用得上

调试用。写指令写不对、想知道解析器到底把它当成了什么，`ast` 能直接看到。

日常写文档用不到它。
