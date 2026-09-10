# 命令行

```
pamphlet build   <路径...> [选项]   编译成单文件 HTML
pamphlet serve   <路径>    [选项]   本地预览，源文档改了就重新加载
pamphlet lint    <路径...> [选项]   检查语法并报诊断
pamphlet ast     <路径>    [选项]   输出 AST JSON
pamphlet extract <产物.html>        从产物反解出源文档
pamphlet doctor                     各图表引擎装了没有
```

## 退出码

| 码 | 含义 |
|---|---|
| `0` | 成功 |
| `1` | 编译错误 |
| `2` | 参数或用法错误 |
| `3` | 环境缺失（`doctor` 发现引擎没装） |

CI 里直接用退出码判断即可，不必解析输出。

## 选项

| 选项 | 说明 |
|---|---|
| `-o <路径>` | 产物写到哪。只在编译单份时可用；配多份会报错退出 `2` |
| `--font <字体文件>` | 内嵌这个字体，**只留文档用到的字** |
| `--verbose` | 编译后打印体积归因 |
| `--no-embed-source` | 产物里不内嵌源文档（`extract` 就用不了了） |
| `--port <端口>` | `serve` 的端口，缺省 `4321` |
| `--format json` | 结构化输出，给 CI 和编辑器用 |
| `--fail-on-warn` | 把警告也当成失败 |
| `--continue-on-error` | 某份文档出错后继续处理剩下的 |
| `--no-color` | 不上色 |
| `-h`, `--help` | 说明 |

不带任何参数跑 `pamphlet` 会打印说明并退出 `2`——因为「没说要做什么」是一种用法错误，不是成功。

## build

```bash
pamphlet build 方案.md
pamphlet build "docs/**/*.md" --continue-on-error
```

产物默认写在**源文档旁边**：`方案.md` → `方案.html`。

:::warning 通配符要加引号
通配符由 Pamphlet 自己展开，不依赖 shell。不加引号的话 shell 会先抢着展开一遍，而不同 shell 对 `**` 的支持并不一致。**而且 Pamphlet 不做任何默认排除**——`"**/*.md"` 会把 `node_modules` 里成百上千份第三方文档一起编译。详见[编译目标只能显式传路径](/limits/file-paths)。
:::

**图没画出来时仍然写出产物，同时退出码为 1。** 那张图的位置会留一个说明性的占位框，其余部分是对的——这样你能立刻看出问题只在那一张图上。

### 体积归因

```bash
pamphlet build 方案.md --verbose
```

真实输出（编译本仓库的 `examples/demo.md`）：

```
demo.html  33.7KB
  体积 33.7KB（gzip 10.6KB）
    图表 SVG          16.0KB  gzip     2.8KB  48%
    样式               5.7KB  gzip     1.4KB  17%
    正文 HTML          4.0KB  gzip     2.1KB  12%
    源文档注释            3.8KB  gzip     2.4KB  11%
    运行时              3.1KB  gzip     1.3KB  9%
    骨架                933B  gzip      574B  3%
```

各段互不重叠、加起来正好是整份产物。Pamphlet **不设体积门槛**，只把账摊开。要不要为了 16KB 去掉一张图，是你的判断不是编译器的。

## serve

```bash
pamphlet serve 方案.md --port 8080
```

起一个本地服务器，源文档改了自动重新编译并刷新页面（走 SSE）。一次只能预览一个文件；通配符匹配到多个会报错退出 `2`。

## lint

```bash
pamphlet lint "docs/**/*.md" --format json
```

只检查语法、报诊断，不产出任何文件。

诊断**按文件分组**，每组带文件头；每条带源码片段、修复建议和文档链接；末尾**固定打印**一行汇总，哪怕全部通过——静默的成功会让人怀疑它到底跑了没有。真实输出：

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

`--format json` 输出 `{ reports, failed }`，给 CI 和编辑器插件用。

## ast

```bash
pamphlet ast 方案.md
```

打印 `{ path, frontmatter, ast, diagnostics }` 的 JSON。

:::danger 0.x 期间 AST 不稳定
AST 结构在 0.x 期间**不承诺兼容**，次版本升级就可能变。别拿它当稳定接口做工具。见[兼容性承诺](/limits/versioning)。
:::

一次只接一个文件，匹配到多个会报错退出 `2`。

## extract

```bash
pamphlet extract 方案.html > 还原.md
```

从产物里把源文档原样吐回来——源文档默认内嵌在产物的 HTML 注释里，所以**产物即备份**。

用 `--no-embed-source` 编出来的产物里没有这段，`extract` 会失败退出 `1`。

## doctor

```bash
pamphlet doctor
```

逐个引擎打印装了没有、怎么装。缺任何一个退出 `3`。

本版本只实现了 Mermaid 一个引擎，所以这里只有一行。见[图表引擎全部是可选依赖](/limits/engines)。
