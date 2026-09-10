# 指令怎么写

**指令**是扩展 Markdown 的唯一单元，写成 `:::name[标题]{属性}`。规则只有一条：

- **`[标题]` 永远是给读者看的字**
- **`{属性}` 永远是给编译器看的参数**

记住这一条就够了，不用逐个指令背。

```markdown
:::collapse[高级参数]
这里是折叠起来的内容。
:::
```

全部九个指令都是**容器指令** —— 必须用成对的冒号包住内容。写成 `::name[内容]` 这种单行形态会报 `DIR-202`。

## 嵌套时外层冒号要更多

:::warning 这是最容易踩的一条
`:::tabs` 包 `:::tab` **不成立** —— 冒号一样多，第一个 `:::` 就把外层关掉了。

写成 `::::tabs` 包 `:::tab`：外层四个冒号，内层三个。
:::

```markdown
::::tabs

:::tab[甲]
内容
:::

::::
```

## 九个指令

| 指令 | 干什么 |
|---|---|
| [`info` `tip` `warn` `danger`](/write/directives/callout) | 四种提示块 |
| [`tabs` / `tab`](/write/directives/tabs) | 标签页 |
| [`collapse`](/write/directives/collapse) | 折叠块 |
| [`steps`](/write/directives/steps) | 步骤 |
| [`reveal`](/write/directives/reveal) | 滚动入场动效 |

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
directive 语法本身允许写 `{.myclass}` 和 `{#myid}`，Pamphlet 解析时**不会报警告**，但产物里**也不会输出这两个属性** —— 值被静默丢弃。

想改样式请走[主题 token](/reference/theme-tokens)。
:::
