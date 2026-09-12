# 甘特图（Mermaid 围栏）

## 这是什么

和[甘特图](/write/diagrams/gantt)画的是同一种图，区别只在**怎么写**：这一页用 ` ```mermaid ` 围栏，直接写 [Mermaid](/write/diagrams/mermaid/) 自己的图源。

## 什么时候用

- **源文档要发到 GitHub，并且希望在 GitHub 上也能看到图**——自有写法在那边显示成一段普通文字
- 已经会 Mermaid，不想再学一套
- 需要自有写法表达不了的细节（下面「坑」那一节写明是哪些）

其余情况用[自有写法](/write/diagrams/gantt)：字段名固定，写错了当场报错并指到具体那一行。

## 怎么写

````markdown
```mermaid
gantt
  title 一次改版的排期
  dateFormat YYYY-MM-DD
  axisFormat %m-%d
  section 设计
  定方案        :done, a1, 2026-03-02, 5d
  评审          :done, a2, after a1, 2d
  section 实现
  编译器改动     :active, b1, after a2, 8d
```
````

## 出来是什么样

编译时就画成 SVG 内联进产物，**读者那边不下载任何绘图库、也不联网**。颜色跟着主题走，可以滚轮缩放、按住拖动、双击复位。

## 坑

- `done` 已完成（灰）、`active` 进行中（主色）、`crit` 关键路径（强调色）
- `after a1` 表示接着上一项开始，不用自己算日期
- **`dateFormat X`（纯数字轴）容易排得很奇怪**，用真实日期更稳
