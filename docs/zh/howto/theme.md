# 换一套主题色

:::warning 目前只有一条路
frontmatter 的 `theme` 字段**还没接进编译器** —— 写了会被校验但没有任何代码读它。`@pamphlet/themes` 里那三个内置主题名（`default` / `tech-dark` / `minimal`）也还没接上。

现在唯一能改的办法是往源文档里写一段 `<style>` 覆盖 CSS 变量。
:::

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

深浅两套要分开写。产物靠 `prefers-color-scheme` 切换：

```markdown
<style>
  :root {
    --pf-primary: #7c3aed;
    --pf-bg: #fffbf5;
    --pf-fg: #2a2118;
    --pf-bg-subtle: #f5efe6;
    --pf-border: #ded3c4;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --pf-primary: #a78bfa;
      --pf-bg: #1a1614;
      --pf-fg: #ede4d8;
      --pf-bg-subtle: #251f1b;
      --pf-border: #3a322c;
    }
  }
</style>
```

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

- **每份文档都要写一遍。** 没有共享配置，源文档就是配置的全部载体。
- **改的是产物不是源文档的可读性。** 这段 `<style>` 丢上 GitHub 会以纯文本形式露出来。
- **变量名在 0.x 期间可能改。** 改名的代价很高（替换规则、内置主题、文档三处要同时改），但没有承诺。
