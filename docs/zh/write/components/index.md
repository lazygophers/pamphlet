# 指令怎么写

五种能点、能跳出正文的东西，统称**容器指令**。它们是 Pamphlet 在标准 Markdown 之上加的部分。

| 指令 | 干什么 |
|---|---|
| [`info` `tip` `warn` `danger`](/write/components/callout) | 四种提示块 |
| [`tabs` / `tab`](/write/components/tabs) | 标签页 |
| [`collapse`](/write/components/collapse) | 折叠块 |
| [`steps`](/write/components/steps) | 步骤 |
| [`reveal`](/write/components/reveal) | 滚动入场 |

## 一条规则

```
:::name[指令标题]{属性}
```

- **`[指令标题]` 永远是给读者看的字**
- **`{属性}` 永远是给编译器看的参数**

记住这一条就够，不用逐个指令背。

:::info 「指令标题」和「标题」是两个东西
「标题」在本项目专指 Markdown 的 `#`（见[标题](/write/text/headings)）。方括号里那行字一律叫「**指令标题**」——报错消息里也是这么写的。
:::

## 全部是容器指令

九个指令名都必须用**成对的冒号**包住内容。写成 `::name[内容]` 这种单行形态会报 `DIR-202`。

### 嵌套时外层冒号要更多

:::warning 这是最容易踩的一条
`:::tabs` 包 `:::tab` **不成立**——冒号一样多，第一个 `:::` 就把外层关掉了。

写成 `::::tabs` 包 `:::tab`：外层四个冒号，内层三个。
:::

## 打错了也不要紧

诊断认得出别的工具的写法：

| 你写的 | 提示 |
|---|---|
| `note` | 在 Pamphlet 里叫 `info` |
| `warning` / `caution` | 在 Pamphlet 里叫 `warn` |
| `important` | 在 Pamphlet 里叫 `danger` |
| `details` / `accordion` | 在 Pamphlet 里叫 `collapse` |
| `tabset` | 在 Pamphlet 里叫 `tabs` |

编辑距离 ≤ 2 的拼写错误也会给出「是不是想写 X？」。

不认识的指令只是 `DIR-201` **警告**不是错误，因为**内容仍然会原样输出**，不会丢字。

## 不认识的属性会被忽略

写了指令不认识的属性会报 `DIR-207` 警告并列出它认识的属性。

:::warning `class` 和 `id` 目前不起作用
directive 语法本身允许写 `{.myclass}` 和 `{#myid}`，Pamphlet 解析时**不会报警告**，但产物里**也不会输出这两个属性**——值被静默丢弃。

想改样式请走[主题 token](/reference/theme-tokens)。
:::
