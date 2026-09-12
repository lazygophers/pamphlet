# WaveDrom（还没实现）

## 这是什么

WaveDrom 画**数字波形图**——时钟、信号在时间上的高低变化，硬件文档和协议文档里那种图。

**Mermaid 完全没有这个能力。**

## 它能画哪些图

| 画什么 | 写法 |
|---|---|
| 时序波形图 | `signal` 数组，每条信号一行 `wave` 字符串 |

位域图（协议报文格式）不归它，归 [bytefield-svg](/write/diagrams/bytefield)。

## 怎么写

围栏里是一段 JSON（WaveJSON），`wave` 字符串里一个字符就是一个时间片：

````markdown
```wavedrom
{ signal: [{ name: "Alfa", wave: "01.zx=ud.23.456789" }] }
```
````

`.` 表示「保持上一个状态」，`0` `1` 是高低电平，`x` 是未知，`z` 是高阻。

> 出处：<https://wavedrom.com/tutorial.html>

## 现在什么状态

**围栏语言 `wavedrom` 认得，但引擎还没写。** 写了会得到 `DIAG-301`「没有装能画 wavedrom 的引擎」，并且**构建失败**——不是画不出来留个占位框，是整次编译不通过。

将来的依赖形态是npm 库（`wavedrom`），和其余六个一样列为可选依赖：装 `@nekoleapuki/pamphlet-cli` 只得到编译器本体，一个引擎都不带。为什么这么安排见[其余七种引擎](/write/diagrams/others)。

现在要画这种图，先用 [Mermaid 围栏](/write/diagrams/mermaid/)里最接近的一种顶着。

## 坑

- **用 `wavedrom` 库，不用 `wavedrom-cli`**：后者拖进 `@jimp` / `gifwrap` / `@resvg` 共约 19MB 的光栅图依赖，而 Pamphlet 只要 SVG
- `wave` 字符串的长度就是时间轴的长度，几条信号要对齐就得一样长
- WaveJSON 用的是宽松 JSON（键不加引号），和标准 JSON 不完全一样

> 出处：[ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md)
