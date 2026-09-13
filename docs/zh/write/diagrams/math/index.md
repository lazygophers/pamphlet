# MathJax

## 这是什么

MathJax 把 TeX 数学公式排成图。**这是 Mermaid 完全没有的东西**——它一个公式都画不了。

选 MathJax v3 而不是更快的 KaTeX，理由只有一条：KaTeX 默认输出 HTML + CSS 而不是 SVG（<https://katex.org/>），而 Pamphlet 这条管线要的是「编译时变成一段内联 SVG」。

## 它能画哪些图

| 画什么 | 写法 |
|---|---|
| 行间公式 | ` ```math ` 围栏，里面是标准 TeX |

只有这一种。**没有行内公式**——原因见下面「坑」。

## 怎么写

````markdown
```math
E = mc^2
```
````

围栏里写的就是标准 TeX，和你在论文里写的一样。

## 先装一次

它不跟着 Pamphlet 一起装——用到才装，不用的人一个字节都不多（约 50MB，纯 JS）：

```bash
npm i -D @nekoleapuki/pamphlet-engine-mathjax
```

装完跑 `pamphlet doctor` 确认：

```
✓ mathjax（math）
```

**没装就用这种围栏会怎样**：得到 `DIAG-301` 并且**整次编译失败**（不是留个占位框），提示里就是上面那条命令。

许可证：Apache-2.0。

公式的颜色全靠 `currentColor`，跟着正文走——切深色模式时它自己就变了，不需要换色那一套。

## 坑

- **不支持行内 `$E=mc^2$`**。`$` 在技术文档里到处都是（`$ npm install`、`$HOME`、`$99`），支持它就得设计冲突判定和转义规则，而误判会把一段正常文字变成公式。只有一个符号也写成围栏
- 要上标下标又不想动公式引擎，用裸 HTML 的 `<sub>` / `<sup>`（[裸 HTML 原样通过](/write/html)）
- `mathjax-full` 包约 42MB，其中 `speech-rule-engine` 占 8MB

> 出处：[ADR-0041](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0041-engines-are-separate-packages.md)（引擎各自成包）、[ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md)（为什么是这七个）
