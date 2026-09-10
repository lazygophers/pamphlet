# 内置主题

六套，每套都是**独立的配色加独立的版式** —— 不只是换颜色，正文宽度、标题体系、提示块和 Tab 的形态都不一样。

```bash
pamphlet build 方案.md --theme notebook
```

或者写进源文档，让它跟着文档走：

```yaml
---
theme: notebook
---
```

**`--theme` 压过 frontmatter。** 命令行是「这一次编译」的意图，frontmatter 是「这份文档一贯的样子」—— 一次性的意图应该能盖过长期设定，批量出一版预览时不必去改每一份源文档。

名字写错报 `DOC-106`，**退回 `default` 继续编译** —— 主题错了只影响长相，内容是对的。

---

## default

通用中性，GitHub 那套色。它是缺省值，所以最不容易出错、最不抢内容。

![default 主题](/themes/default.png)

## minimal

只有黑白灰和一条细线。窄栏（38rem）、大留白、衬线标题、直角。提示块退成一条左线加一行小标题，不要底色。

![minimal 主题](/themes/minimal.png)

## tech-dark

等宽标题、方角、青色强调。`##` 标记直接显示在标题前面。提示块做成整块底色加顶部标记条，四种颜色分得开。

![tech-dark 主题](/themes/tech-dark.png)

## notebook

横格纸底色，行高 2 让文字正好坐在线上。衬线标题、便签式提示块（带一点投影）、索引标签式的 Tab。

横格线是 `repeating-linear-gradient` 画的，**不引任何图片** —— 自包含照旧成立。

![notebook 主题](/themes/notebook.png)

## receipt

小票。全等宽字体、34rem 窄栏、虚线分隔、居中大写标题。提示块是虚线框加方括号标题，步骤是方框序号。

![receipt 主题](/themes/receipt.png)

## glass

玻璃拟态。彩色光晕背景 + 磨砂半透明面板 + 胶囊 Tab。

光晕是三团径向渐变，纯 CSS。`backdrop-filter` 不被支持时磨砂退化成普通半透明底色，内容照常可读。

![glass 主题](/themes/glass.png)

---

## 每一套都守同一条底线

主题能改布局，但**这四条对六套一视同仁**，有 24 条浏览器层测试钉着（`test/theme-degradation.test.ts`）：

| 底线 | 怎么验的 |
|---|---|
| 关掉 JavaScript 时两个 Tab 的内容都看得见 | 真浏览器关 JS 跑一遍 |
| 折叠块降级成原生 `<details>`，内容还在 | 查 DOM 里的 `<details>` 文本 |
| 正文字号 ≥ 14px | 读 `getComputedStyle` |
| 有 JavaScript 时只显示选中面板，点得动 | 真的点一下再断言 |

**新增主题必须过这四关**，不是可选项。

## 自己改一点

不想整套换、只想动一两个颜色，走[换一套主题色](/howto/theme) —— 往源文档里写一段 `<style>` 覆盖 CSS 变量。两条路可以叠加：先 `--theme glass` 再覆盖 `--pf-primary`。

全部 18 个语义 token 和 16 个元素 token 见[主题 token](/reference/theme-tokens)。

> 出处：[ADR-0046](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0046-themes-carry-their-own-css.md)
