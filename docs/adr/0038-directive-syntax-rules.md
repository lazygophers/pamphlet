# 指令语法只有一条规则：`[label]` 是标题，`{attrs}` 是参数

全部指令都是容器指令，语法是 `:::name[label]{attrs}`。规则只有一条：

- **`[label]` 永远是给读者看的标题**
- **`{attrs}` 永远是给编译器看的参数**

作者只需要记这一条，不必逐个指令记。

| 指令 | 标题 | 属性 | 说明 |
|---|---|---|---|
| `tabs` | — | — | 容器，至少含一个 `tab` |
| `tab` | **必填** | `default` | 只能直接放在 `tabs` 里；同组最多一个 `{default}` |
| `collapse` | **必填** | `open` | 折叠块 |
| `steps` | — | — | 里面必须有一个有序列表（见 [0025](./0025-steps-use-native-ordered-list.md)） |
| `reveal` | — | `effect` | `fade-up`（缺省）/ `fade-in` / `slide-left` / `slide-right` |
| `info` `tip` `warn` `danger` | 可选 | — | 四种提示块（见 [0024](./0024-callout-four-types-svg-icons.md)） |

`class` 与 `id` 是 directive 语法原生的，任何指令都能带。

## 为什么要专门定这个

原始设计文档里的指令写法**全都是非法的**，而且是同一个错误重复了五次：`:::tab 部署视图 | 成本视图`、`:::callout warn`、`:::collapse 高级参数`、`:::steps auto`、`:::reveal fade-up`。指令语法不允许在名字后面跟没有括号包裹的自由文本（见 [0013](./0013-tab-syntax-is-nested-directives.md) 里的出处）。

也就是说这不是「挑一种写法」的问题——原来那套根本解析不出来，必须重定。既然要重定，就定成一条能覆盖全部指令的规则，而不是每个指令各一套。

## Considered Options

- **`collapse` 标题可选，缺省用一句固定文案**（如「展开详情」）：作者少打字。落选——产物里会出现编译器编的文案，而它得跟着 `lang` 变，等于引入一套要维护的内建文案表。而且没有标题的折叠块在无 JavaScript 时降级成 `<details>`，连可点的 `<summary>` 都没有。
- **`reveal` 的效果名放 label**（`:::reveal[fade-up]`）：打字更短。落选——`fade-up` 显然不是给读者看的标题，这会破坏那条统一规则。
- **`tab` 不支持 `{default}`，永远选中第一个**：语法最小。落选——「叙述顺序」和「展示优先级」不总是一致（先讲备选、再讲推荐，但想让推荐的先显示），绑死它们是一个真实的表达缺口。

## Consequences

不认识的属性给**警告**（`DIR-207`）并列出该指令认识的属性，而不是静默忽略——静默忽略会让作者以为参数生效了。

同一组 `tabs` 里出现多个 `{default}` 报**错误**（`DIR-205`），不静默取第一个。理由与本项目其它决定一致：静默猜测会产出和作者意图不同的产物。

**撞上别的工具写法时给指路的提示。** `note` / `warning` / `caution` / `important`（Docusaurus 与 GitHub 的写法）、`callout`（本项目早期设计稿）、`details` / `accordion`、`tabset` 这些词都不是 Pamphlet 的指令名，但很可能被打出来。诊断会说明对应的名字是什么，而不是只报一句「未知指令」。这份映射表随生态变化，属于诊断质量而非语法契约。
