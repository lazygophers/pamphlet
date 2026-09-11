# 换一套主题色

**先看够不够用**：[内置主题](/reference/themes)按文档类型分，各有独立的配色和版式，一行就能换。

```bash
pamphlet build 方案.md --theme editorial
```

这一页讲的是**内置主题不够用时怎么微调** —— 往源文档里写一段 `<style>` 覆盖 CSS 变量。两条路可以叠加：先选一套主题，再盖掉其中一两个值。

## 改主色

```markdown
<style>
  :root { --pf-primary: #7c3aed; }
</style>

# 我的方案

正文……
```

链接、Tab 的选中下划线、步骤的圆圈全部跟着变 —— 因为它们的默认值都是从 `--pf-primary` 派生的。

这条能生效是因为[裸 HTML 原样通过](/write/markdown/commonmark)。

## 改一整套

写在 `:root` 上的就是**屏幕上看到的那一套** —— 产物一律深色，不看读者的系统设置，所以这里填的该是深色的值：

```markdown
<style>
  :root {
    --pf-primary: #a78bfa;
    --pf-bg: #1a1614;
    --pf-fg: #ede4d8;
    --pf-bg-subtle: #251f1b;
    --pf-border: #3a322c;
  }
  /* 打印是唯一还用浅色的场合 */
  @media print {
    :root {
      --pf-primary: #7c3aed;
      --pf-bg: #fffbf5;
      --pf-fg: #2a2118;
      --pf-bg-subtle: #f5efe6;
      --pf-border: #ded3c4;
    }
  }
</style>
```

不写那段 `@media print` 也能跑，只是打印时沿用内置主题自己的浅色值 —— 通常正是你想要的。

全部 18 个语义变量见[主题 token](/reference/theme-tokens)。

## 只改某一处

元素层的变量默认从语义层派生，你可以只覆盖其中一个：

```css
:root {
  --pf-code-bg: #1e1e2e;   /* 只改代码块底色，别的不动 */
}
```

## 图表也跟着变

图表的颜色走的是同一套变量里的六个：

```css
:root {
  --pf-diagram-accent: #ff6b6b;   /* 图里的强调色 */
}
```

引擎输出的硬编码色值换不掉时会报 `DIAG-304` 并列出来 —— 那几个颜色不会跟着主题变。

## 三个代价

:::danger 这段 `<style>` 的权限没有任何限制
它能盖掉整个主题系统，包括你没打算改的部分。写错一个变量名不会有任何提示。
:::

- **每份文档都要写一遍。** 没有共享配置，源文档就是配置的全部载体。只换整套主题的话用 `--theme` 或 frontmatter，不必重复。
- **改的是产物不是源文档的可读性。** 这段 `<style>` 丢上 GitHub 会以纯文本形式露出来。
- **变量名在 0.x 期间可能改。** 改名的代价很高（替换规则、内置主题、文档三处要同时改），但没有承诺。
