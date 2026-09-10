# 命令行

```
pamphlet build   <路径...> [选项]   编译成单文件 HTML
pamphlet serve   <路径>    [选项]   本地预览，源文档改了就重新加载
pamphlet lint    <路径...> [选项]   检查语法并报诊断
pamphlet ast     <路径>    [选项]   输出 AST JSON
pamphlet extract <产物.html>        从产物反解出源文档
pamphlet doctor                     各图表引擎装了没有
```

没装的话前面加 `npx @pamphlet/cli`，例如 `npx @pamphlet/cli build 方案.md`。

## 退出码

| 码 | 含义 |
|---|---|
| `0` | 成功 |
| `1` | 编译错误 |
| `2` | 参数或用法错误 |
| `3` | 环境缺失（`doctor` 发现引擎没装） |

CI 里直接用退出码判断即可，不必解析输出。

不带任何参数跑 `pamphlet` 会打印说明并退出 `2` —— 因为「没说要做什么」是一种用法错误，不是成功。

## 选项

| 选项 | 对哪些命令有效 | 说明 |
|---|---|---|
| `-o <路径>`、`--out <路径>` | `build` | 产物写到哪。只在编译单份时可用；配多份会报错退出 `2` |
| `--font <字体文件>` | `build` | 内嵌这个字体，**只留文档用到的字** |
| `--verbose` | `build` | 编译后打印体积归因 |
| `--no-embed-source` | `build` | 产物里不内嵌源文档（`extract` 就用不了了） |
| `--port <端口>` | `serve` | 缺省 `4321` |
| `--format json` | **只有 `lint`** | 结构化输出，给 CI 和编辑器用 |
| `--fail-on-warn` | `build` `lint` | 把警告也当成失败 |
| `--continue-on-error` | `build` `lint` | 某份文档出错后继续处理剩下的 |
| `--no-color` | 全部 | 不上色 |
| `-h`、`--help` | 全部 | 说明 |

:::warning `--format json` 不是全局选项
只有 `lint` 真的按它切换输出格式。

`build` **忽略**它，永远打印人类可读的诊断；`ast` 本来就往标准输出写 JSON，这个开关只是让它不再往 stderr 打人类可读的诊断。

同理 `--fail-on-warn` 和 `--continue-on-error` 对 `ast` 无效。
:::

## 环境变量

| 变量 | 作用 |
|---|---|
| `NO_COLOR` | 设了就不上色，等同于 `--no-color`。这是跨工具的通行约定（<https://no-color.org/>） |
