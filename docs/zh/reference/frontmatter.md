# frontmatter 参考

**没有配置文件。** 全部配置都写在源文档开头的 frontmatter 里——那两行 `---` 中间的部分。

```yaml
---
spec: 1
title: 架构方案
lang: zh-CN
toc:
  enable: true
  deep: 3
---
```

这么定的理由是：一份源文档 = 一个产物，配置跟着文档走，拷贝文档就等于拷贝配置。多一个配置文件就多一处「文档在这、设置在那」的脱节。

## 认识的字段

只有六个。写别的会报 `DOC-102` 警告并列出这份清单——**不静默忽略**，因为静默忽略会让你以为配置生效了。

| 字段 | 类型 | 缺省 | 说明 |
|---|---|---|---|
| `spec` | 整数 | 不填 = 不检查 | 这份文档要求的最低编译器语法版本 |
| `title` | 字符串 | 第一个 `#` 标题 | 产物的 `<title>` |
| `theme` | 字符串 | — | ⚠️ 见下方说明 |
| `lang` | 字符串 | `zh-CN` | 产物 `<html lang="…">` |
| `toc` | 布尔或对象 | 关 | 目录 |
| `engines` | 对象 | — | ⚠️ 尚未实现 |

## spec

```yaml
spec: 1
```

作用是**单一的：标记「这是一本 pamphlet 的源文档」**。当前编译器支持的版本是 `1`。

写得比编译器支持的高会报 `DOC-101`，提示升级。不是整数报 `DOC-103`。

它**不再**触发多套解析器行为——只维护一套解析器。见[兼容性承诺](/limits/versioning)。

## title

```yaml
title: 架构方案
```

不填时按这个顺序找：文档里第一个 `#` 一级标题 → 都没有就用字面量 `pamphlet`。

## theme

:::warning 这个字段目前不起作用
`theme` 会被解析和校验（不是字符串报 `DOC-103`），但**没有任何代码读它**。

`@pamphlet/themes` 里定义了三个内置主题名（`default` / `tech-dark` / `minimal`），但还没有接进编译器。

现在能改样式的只有[主题 token](/reference/theme-tokens) 那一层。
:::

## lang

```yaml
lang: en
```

写进产物的 `<html lang="…">`。缺省 `zh-CN`。

它影响屏幕阅读器怎么念、浏览器怎么断行和拼写检查，不影响编译器的任何行为。

## toc

最简写法：

```yaml
toc: true
```

完整写法：

```yaml
toc:
  enable: true
  deep: 3
  skipTabs: true
  position: top
```

| 子字段 | 类型 | 缺省 | 说明 |
|---|---|---|---|
| `enable` | 布尔 | `false` | 不显式打开就没有目录 |
| `deep` | 1–6 的整数 | `2` | 收到第几级标题 |
| `skipTabs` | 布尔 | `true` | 目录里跳过 Tab 生成的标题 |
| `position` | `top` / `side` | `top` | `side` 尚未实现 |

目录是**纯静态的**：一段嵌套列表加锚点链接，零 JavaScript。

一级标题（`#`）不进目录——它是文档标题本身。`deep` 超出 1–6 报 `DOC-103`。

### skipTabs 为什么缺省是 true

Tab 面板在语义上是**同一话题的几种视角**，出现在目录里会让读者以为它们是不同章节。

但 Tab 标题为了无障碍和深链被做成了**真标题**，注定会进文档大纲——所以目录这一侧必须有这个开关。

### position: side 会报错

```yaml
toc:
  position: side
```

得到 `DOC-104` **错误**（不是警告），提示改用 `position: top`。

报错而不是静默降级成 `top` 是有意的：静默降级会让你以为侧边栏已经生效了，只是样式没生效。

## engines

```yaml
engines:
  myengine:
    langs: [foo]
    command: [mytool, --svg]
```

:::warning 尚未实现
写了会得到 `DOC-104` 警告：「engines（自定义引擎）尚未实现，这段声明暂时不起作用」。内置引擎照常工作。
:::

将来的形态已经定了：图源走 stdin，SVG 走 stdout，声明式，不写插件代码。

## 诊断定位到具体字段

frontmatter 的诊断**指向出问题那个字段所在的行**，不是笼统地指向 `---`：

```
error[DOC-103] toc.deep 必须是 1 到 6 之间的整数
  --> 方案.md:5:3
  |
5 |   deep: 9
  |   ^^^^
```
