# @nekoleapuki/pamphlet-themes

Pamphlet 的内置主题：**纯数据**的 design token。

独立成包的理由是它不含任何代码——只想要一套 token 而不装整个编译器的人，装这个就够了。

## 三层结构

```
语义层（18 个）→ 元素层（30+ 个，默认从语义层派生）→ 作者只写想改的
```

派生**只能一层**：元素层不得引用元素层。

语义层的 18 个 token：`bg` `bg-subtle` `fg` `fg-muted` `primary` `border` `info` `tip` `warn` `danger` `font-sans` `font-mono` `space-1` `space-2` `space-3` `space-4` `line-height` `radius`。

命名一律语义化（`danger` 而不是 `red`），因为同一套 token 要同时服务亮暗两套主题——`red` 在暗色主题里可能其实是粉色，那种命名会自相矛盾。

## 完整清单

<https://lazygophers.github.io/pamphlet/reference/theme-tokens.html>

## 许可证

AGPL-3.0-or-later
