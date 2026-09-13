# bytefield-svg

## 这是什么

bytefield-svg 画**位域图**：一个协议报文、一段内存布局里，哪几个字节是什么意思。

**Mermaid 完全没有这个能力**，纯 JavaScript，不需要浏览器也不需要 Java。

## 它能画哪些图

| 画什么 | 写法 |
|---|---|
| 协议报文格式 | 一格一个字节，`draw-box` 一行一格 |
| 内存布局 | 同上，用 `draw-gap` 表示中间省略的一大段 |

## 怎么写

围栏里是它自己的 DSL（长得像 Clojure，因为它就是 Clojure 写的）：

````markdown
```bytefield
(draw-column-headers)
(draw-box "Address" {:span 4})
(draw-box "Size" {:span 2})
(draw-box 0 {:span 2})
(draw-gap "Payload")
(draw-bottom)
```
````

`{:span 4}` 表示这一格横跨 4 个字节；`draw-column-headers` 画顶上那行字节编号，不写就没有。

> 出处：<https://bytefield-svg.deepsymmetry.org/bytefield-svg/1.11.0/intro.html>

## 先装一次

它不跟着 Pamphlet 一起装——用到才装，不用的人一个字节都不多（2.1MB，七个里体积最小的）：

```bash
npm i -D @nekoleapuki/pamphlet-engine-bytefield
```

装完跑 `pamphlet doctor` 确认：

```
✓ bytefield（bytefield）
```

**没装就用这种围栏会怎样**：得到 `DIAG-301` 并且**整次编译失败**（不是留个占位框），提示里就是上面那条命令。

许可证：EPL-2.0。

有 7 处边框线换不成线条色，用的是文字色——那几条线的默认颜色写死在它源码里，DSL 层够不着。颜色仍然跟着主题变，只是语义偏了一点。

## 坑

- **`(draw-bottom)` 必须写在最后**，否则最下面那条边不画
- 一行默认十六个字节，要改用 `(def boxes-per-row 4)`
- 数字直接写会渲染成两位十六进制——这是故意的，提醒你那是一个字节

> 出处：[ADR-0041](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0041-engines-are-separate-packages.md)（引擎各自成包）、[ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md)（为什么是这七个）
