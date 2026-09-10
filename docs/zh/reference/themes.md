# 内置主题

十二套，**按文档类型分，不按审美分**。每套都是独立的配色**和版式** —— 正文宽度、标题体系、提示块形态、Tab 形态、表格线各不相同。

```bash
pamphlet build 方案.md --theme incident
```

或者写进源文档，让它跟着文档走：

```yaml
---
theme: incident
---
```

**`--theme` 压过 frontmatter。** 命令行是「这一次编译」的意图，frontmatter 是「这份文档一贯的样子」—— 一次性的意图应该能盖过长期设定。

名字写错报 `DOC-106`，**退回 `default` 继续编译**：主题错了只影响长相，内容是对的。

## 一览

| 主题 | 写什么用它 |
|---|---|
| [`default`](#default) | 拿不准就用它 |
| [`minimal`](#minimal) | 短文、随笔、一页纸的东西 |
| [`tech-dark`](#tech-dark) | 暗色偏好的技术内容 |
| [`editorial`](#editorial) | 正式提案、白皮书 |
| [`console`](#console) | 运维手册、面板说明 |
| [`paper`](#paper) | 研究记录、论文式写作 |
| [`fiction`](#fiction) | 小说章节、叙事 |
| [`manual`](#manual) | 技术文档、API 手册 |
| [`prd`](#prd) | 需求文档 |
| [`architecture`](#architecture) | 系统设计文档 |
| [`blueprint`](#blueprint) | 详细设计文档 |
| [`incident`](#incident) | 故障报告、复盘 |

---

## default

通用中性。缺省值，所以最不容易出错、最不抢内容。

![default 主题](/themes/default.png)

## minimal

只有黑白灰和一条细线。窄栏、大留白、衬线标题、直角。提示块退成一条左线加一行小标题。

![minimal 主题](/themes/minimal.png)

## tech-dark

等宽标题、方角、青色强调，`##` 标记显示在标题前。提示块整块底色加顶部色条。

![tech-dark 主题](/themes/tech-dark.png)

## editorial

杂志内页。3.2rem 衬线大标题、`01` `02` 章节编号、报头式 Tab、引言居中横线包夹、表格只留上下粗线。

![editorial 主题](/themes/editorial.png)

## console

盯着看的面板。全等宽、带竖线的菜单栏、方括号标签的提示块、分段控件式 Tab、高密度表格。

![console 主题](/themes/console.png)

## paper

论文。衬线正文、`1.` `2.` 编号标题、斜体三级标题、提示块变边注、三线表。

![paper 主题](/themes/paper.png)

## fiction

为连续阅读排的版：窄栏、**首行缩进两字、段间不留空**、首字下沉、场景分隔是居中三点。提示块变成作者旁白。

![fiction 主题](/themes/fiction.png)

## manual

代码块是主角：左侧色条、更大的内边距。**长表格的表头吸顶**、斑马纹，文件夹标签式 Tab。

![manual 主题](/themes/manual.png)

## prd

每个二级标题是**一条带 `R01` 徽章的需求**。验收清单是真的复选框，提示块变成约束卡片，Tab 是胶囊分段控件。

![prd 主题](/themes/prd.png)

## architecture

图占最宽的画布（94rem）并带边框。引用块渲染成「决策」记录，表格是三线表，标题带 `§` 编号。

![architecture 主题](/themes/architecture.png)

## blueprint

密度优先。**三级编号 `1` / `1.1` / `1.1.1`**、等宽标题、紧凑字段表 —— 给「一条条对着实现」的人看的。

![blueprint 主题](/themes/blueprint.png)

## incident

**步骤变时间轴**（竖线 + 红点）。标题带「事故报告」眉批，`danger` 压过页面上其它一切，影响面表格一眼看完。

![incident 主题](/themes/incident.png)

---

## 每一套都守同一条底线

主题能改布局，但**这四条对十二套一视同仁**，有浏览器层测试逐套钉着：

| 底线 | 怎么验的 |
|---|---|
| 关掉 JavaScript 时两个 Tab 的内容都看得见 | 真浏览器关 JS 跑一遍 |
| 折叠块降级成原生 `<details>`，内容还在 | 查 DOM 里的 `<details>` 文本 |
| 正文字号 ≥ 14px | 读 `getComputedStyle` |
| 有 JavaScript 时只显示选中面板，点得动 | 真的点一下再断言 |

**新增主题必须过这四关**，不是可选项 —— 测试遍历主题清单，加一套就自动被覆盖。

## 侧边菜单

目录缺省是**常驻侧边菜单**，纯 CSS sticky，零 JavaScript：

```yaml
---
toc:
  enable: true
---
```

窄屏（< 60rem）自动退回文档顶部。想放回正文开头写 `toc: { position: top }`，详见 [frontmatter 参考](/reference/frontmatter)。

## 自己改一点

不想整套换、只想动一两个颜色，走[换一套主题色](/howto/theme)。两条路可以叠加：先 `--theme paper` 再覆盖 `--pf-primary`。

全部 18 个语义 token 和 16 个元素 token 见[主题 token](/reference/theme-tokens)。

> 出处：[ADR-0046](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0046-themes-carry-their-own-css.md)
