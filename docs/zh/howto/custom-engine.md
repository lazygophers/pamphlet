# 接一个自定义图表引擎

:::info 只支持 command
`command`（外部程序）这条路可以用了。`http`（远程渲染服务）那条还没写，写了会得到一条 `DOC-104` 说明。
:::

## 怎么写

在 frontmatter 里用一条外部命令描述引擎：

```yaml
---
engines:
  myengine:
    langs: [foo]
    command: [mytool, --svg]
---
```

约定极简：

| 项 | 约定 |
|---|---|
| 图源怎么进去 | 走**标准输入** |
| SVG 怎么出来 | 走**标准输出** |
| 出错怎么表达 | 非零退出码 |

之后源文档里写 ` ```foo ` 围栏，内容就会被送进 `mytool --svg`。

## 为什么是声明式而不是写插件

**不提供 JavaScript 层面的插件接口。** 任何能读 stdin、吐 SVG 到 stdout 的程序都能接上 —— 不管它是用什么语言写的。

三个理由：

- **不用发布一个 npm 包**就能接自己的工具
- **不用跟着 Pamphlet 的内部结构走**，那些结构在 0.x 期间不承诺稳定
- **进程边界天然隔离**，第三方引擎崩了不会带崩编译器

代价是每张图多一次进程启动的开销。对图表这种编译期一次性的工作，这个代价可以接受。

## 现在能做什么

没有替代路径。要画 Mermaid 之外的图，只有两条：

1. **自己画成 SVG，用内联 `<svg>` 贴进文档。** 注意它[绕过消毒和换色](/write/) —— 切深色模式时不会跟着变。
2. **画成图片再引用。** 走 [`![]()`](/write/diagrams/images)，会被 base64 内嵌进产物。

> 出处：[ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md)
