---
title: 结构化写法
---

# 十七种图共用一副骨架

:::flow[登录链路]{dir=LR}
nodes:
  request = "请求"
  cache = diamond "有缓存吗？"
  hit = "直接返回"
edges:
  request -> cache
  cache -> hit : 有
:::

:::sequence
participants:
  a = "作者"
  b = "编译器"
messages:
  a -> b : build
  b --> a : 产物
:::

:::er
entities:
  文档
  图表
relations:
  文档 -> 图表 : 含有
:::

:::swimlane
lanes:
  u = "用户"
  o = "订单"
steps:
  u : 下单
  o : 出单
:::

写错的那一张留占位框，文档照常编译：

:::flow
nodes:
  a
edges:
  a -> ghost
:::
