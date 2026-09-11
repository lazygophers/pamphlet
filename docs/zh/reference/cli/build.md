# build

编译成单文件 HTML。

```bash
pamphlet build 方案.md
pamphlet build "docs/**/*.md" --continue-on-error
```

产物默认写在**源文档旁边**：`方案.md` → `方案.html`。

## 选项

| 选项 | 说明 |
|---|---|
| `-o <路径>`、`--out <路径>` | 产物写到哪。只在编译单份时可用；配多份报错退出 `2` |
| `--theme <名字>` | 换一套主题，压过 frontmatter。见[内置主题](/reference/themes) |
| `--font <字体文件>` | 内嵌字体，只留文档用到的字 |
| `--verbose` | 打印体积归因 |
| `--no-embed-source` | 不内嵌源文档 |
| `--fail-on-warn` | 警告也算失败 |
| `--continue-on-error` | 某份出错后继续编译剩下的 |

:::warning 通配符要加引号
通配符由 Pamphlet 自己展开，不依赖 shell。**而且不做任何默认排除** —— `"**/*.md"` 会把 `node_modules` 里成百上千份第三方文档一起编译。详见[图片与资源](/write/diagrams/images)。
:::

## 图没画出来时仍然写出产物

那张图的位置会留一个说明性的占位框，其余部分是对的，**同时退出码为 `1`** —— 这样你能立刻看出问题只在那一张图上。

## 多份的「部分成功」

| 情况 | 行为 |
|---|---|
| 任一失败 | 退出码 `1`，**已产出的产物仍然留在磁盘上** |
| 加 `--continue-on-error` | 继续编译剩下的，退出码仍按是否有失败决定 |
| 诊断输出 | 按文件分组，每组带文件头 |
| 汇总行 | **固定打印**，哪怕全部成功；失败的文件名单独列出 |
| 加 `--verbose` | 体积报告逐份输出，末尾给一个合计 |

「读不到的文件」只进失败名单，不参与「通过数」的统计。

## 体积归因

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
