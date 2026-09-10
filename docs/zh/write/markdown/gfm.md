# GFM 扩展

除了 CommonMark，Pamphlet 还打开了 **GFM**（GitHub Flavored Markdown，GitHub 那套 Markdown 扩展，规范在 <https://github.github.com/gfm/>）。

也就是说，你在 GitHub 上习惯写的表格、删除线、任务列表，在源文档里同样有效。

## 表格

```markdown
| 环境 | 实例数 | 月成本 |
|---|---|---|
| 生产 | 6 | ¥3,200 |
| 预发 | 2 | ¥800 |
```

表格样式跟着主题走：边框用 `--pf-table-border`，表头底色用 `--pf-table-header-bg`（见[主题 token](/reference/theme-tokens)）。

表格在窄屏上**横向滚动而不是换行挤压** —— 这是有意的，见[产物是什么样的](/design/output)。

## 删除线

```markdown
原方案是 ~~自建 Redis 集群~~，改成托管服务了。
```

## 任务列表

```markdown
- [x] 压测报告
- [x] 成本核算
- [ ] 灰度方案
```

复选框是**只读的**，读者点不动 —— 产物是一份文档，不是一个待办应用。

## 自动链接

裸写的网址会自动变成链接：

```markdown
详见 https://spec.commonmark.org/
```

## 不支持脚注

GFM 有脚注（`[^1]`），**Pamphlet 不支持**。写了会直接报错：

```
error[DOC-105] 本版本不支持脚注
  --> 方案.md:3:4
  = 改写成正文里的括注，或用 :::info 容器承载注释
```

:::info 为什么报错而不是忽略
静默丢掉脚注意味着你写的注释在产物里**凭空消失**，而你不会发现。报错让它当场可见。
:::

两种替代写法：

```markdown
现在 P99 是 800ms（数据来自 3 月压测报告）。
```

```markdown
:::info[数据来源]
3 月压测报告，样本 10 万次请求。
:::
```

顺带一提：Pandoc 的行内脚注写法 `^[注释]` 不属于 GFM，Pamphlet 把它当**普通文字**原样输出，不报错也不特殊处理。
