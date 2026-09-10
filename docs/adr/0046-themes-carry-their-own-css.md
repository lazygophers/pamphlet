# 一套主题 = 一组 token + 一段自己的 CSS，`--theme` 压过 frontmatter

一套主题两部分（`packages/themes/src/index.ts`）：

```ts
interface Theme {
  name: string
  label: string
  light: ThemeTokens   // 18 个语义 token 的值
  dark: ThemeTokens
  css: string          // 追加在基础版式之后的样式
}
```

选哪一套的优先级：**`--theme` > frontmatter 的 `theme:` > `default`**。名字不认识报 `DOC-106`，退回 `default` 继续编译。

内置六套：`default` / `minimal` / `tech-dark` / `notebook` / `receipt` / `glass`。

## 为什么 token 不够

[0020](./0020-theme-tokens-three-layer.md) 定的三层结构只管**配色、字体、间距、圆角**。布局是写死的：

- `theme.ts` 的 `BASE_CSS` 里 `.pf-doc{max-width:52rem}` 决定了所有产物的正文宽度
- `FEATURE_CSS` 里写死了 Tab 长什么样、折叠块长什么样、步骤的圆圈

所以只填 token 值，六套主题的骨架完全一样，差别只有颜色——那不叫「独立的风格与布局」，叫换了个配色。

要做出笔记本、小票、玻璃拟态这种**结构上就不同**的东西，主题必须能写 CSS。

## 追加，不是替换

`css` 是**拼在 `BASE_CSS` 和 `FEATURE_CSS` 之后**的，不是替换它们。

替换（考虑过，落选）会把 [0015](./0015-no-js-degradation.md) 的无 JavaScript 降级承诺从「组装器保证一次」变成「每套主题各自保证一遍」。六套主题就是六个能单独把它捅破的地方，而这条承诺是产品的核心之一，不是可以拿来换视觉效果的东西。

追加的代价是主题只能覆盖不能删除——想去掉某条基础样式，得写一条更具体的规则盖住它。这个代价被接受了。

## 为什么 CLI 压过 frontmatter

命令行是**这一次编译**的意图，frontmatter 是**这份文档一贯的样子**。一次性的意图应该能盖过长期设定——批量换主题出一版预览时不必去改每一份源文档。

## Considered Options

- **只扩展 token（加正文宽度、密度档位、圆角档位这类布局 token）**：最安全、最好维护。落选——扩几个 token 只能改宽度和松紧，Tab 还是那个 Tab，达不到「独立布局」。
- **主题提供整份样式表，替换 `BASE_CSS`**：自由度最高。落选——六套 = 六份完整 CSS 要同步维护，且每套都要独立保证无 JS 降级不破。
- **`theme` 只做 frontmatter 字段，不做 CLI 参数**：少一个参数。落选——用户明确要 CLI 能指定并覆盖。

## Consequences

**`DOC-106` 是新码，`DOC-1xx` 段从 5 个变 6 个。** 严重程度是 `error` 而不是 `warning`：静默换一套主题会让你以为写的那个生效了。但它**不中断编译**，退回 `default` 照样产出——主题错了只影响长相，内容是对的。

**`@nekoleapuki/pamphlet-cli` 现在依赖 `@nekoleapuki/pamphlet-themes`。** 方向是单向的：themes 包保持零依赖，仍然可以被单独消费（[0031](./0031-three-packages.md) 的原意）。原来放在 themes 包里、反向 import 编译器的那个一致性测试搬去了 cli 包，避免出现依赖环。

**六套主题各有 24 条浏览器层测试**（`test/theme-degradation.test.ts`）：无 JS 时两个 Tab 的内容都看得见、折叠块降级成原生 `<details>` 且内容还在、正文字号 ≥14px、有 JS 时只显示选中面板且点得动。**新增主题必须过这四关**，不是可选项。

**主题名一经发布就是公共契约。** `default` / `tech-dark` / `minimal` 在 0.0.1 就随 `BUILTIN_THEMES` 发到了 npm，所以这次是给它们填实现而不是改名。以后只能加不能改。

**没做拟态（neumorphism）。** 用户点名要过，但它的做法是「底色和面板同色、只靠双向阴影区分」，正文与背景的对比度天然逼近下限，和上面那条 ≥14px、可读性优先的底线冲突。要做的话得先想清楚怎么在不破坏对比度的前提下保留那个质感——留到有答案再说。

**`glass` 用了 `backdrop-filter` 和 `color-mix()`。** 不支持的浏览器上磨砂退化成普通半透明底色，光晕退化成纯色——内容照常可读，只是没那个质感。这属于渐进增强，不影响任何承诺。
