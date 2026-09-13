# 常见问题

## 一定要先安装吗

不用。

```bash
npx @nekoleapuki/pamphlet-cli build 方案.md
```

`npx` 会下载、跑一次、不留在电脑里。常用的话再[装到本地](/start/install)。

## 为什么命令叫 `pamphlet`，包叫 `@nekoleapuki/pamphlet-cli`

不带命名空间的 `pamphlet` 在 npm 上**被别人 2018 年就占了**（<https://www.npmjs.com/package/pamphlet>，最新 4.0.0），不是废弃包，拿不回来。

装完之后命令名就是 `pamphlet`。

## 我的图为什么没画出来

先看诊断码：

| 码 | 意思 | 怎么办 |
|---|---|---|
| `DIAG-301` | 引擎没装 | 跑 `pamphlet doctor`，按提示装 |
| `DIAG-303` | 图源写错了或超时 | 贴到 <https://mermaid.live> 上定位 |

只有 Mermaid 一个引擎能用，写 ` ```d2 ` 这类必然报 `DIAG-301`。见[其余七种图表](/write/diagrams/others)。

## 为什么非要下 150MB 的浏览器

Mermaid 必须用真实浏览器的布局引擎算文字宽度，jsdom 没实现 `SVGTextElement.getBBox()`。Mermaid 组织成员明确否定过 jsdom 方案（<https://github.com/mermaid-js/mermaid/issues/3886#issuecomment-1341694822>）。

**纯文字文档永远不会拉起浏览器**，装了也不会白跑。

## 我的 `:::tabs` 为什么没生效

八成是冒号数量。**外层必须比内层多**：

```markdown
::::tabs        ← 四个
:::tab[甲]      ← 三个
内容
:::
::::
```

一样多的话，第一个 `:::` 就把外层关掉了。

## 能改字体和颜色吗

能。[内置主题](/reference/themes)按文档类型分，各有独立的配色和版式：

```bash
pamphlet build 方案.md --theme fiction
```

也可以写进 frontmatter 让它跟着文档走（`--theme` 会压过它）。只想动一两个颜色的话再走[换一套主题色](/howto/theme)。

## 为什么我贴的 HTML 把整个页面搞乱了

因为**裸 HTML 原样通过，编译器不做任何过滤**。一段 `<style>` 能盖掉整个主题系统。

这不是 bug 是设计，见 [CommonMark 基础](/write/)。

## 产物为什么这么大

跑一下：

```bash
pamphlet build 方案.md --verbose
```

它会把账摊开。最常见的大头是图表 SVG（示例文档里占 48%）和内嵌图片（base64 会让体积膨胀 33.3%）。

Pamphlet **不设体积门槛**，删不删是你的判断。

## 发给别人在手机上打不开

iOS 18.5 起 Safari 不允许直接打开本地 HTML 文件，微信内置浏览器也拦。三条绕行办法见[产物是什么样的](/design/output)。

## 我写的脚注不见了

写 `[^1]` 现在会**直接报错** `DOC-105`，不会静默消失。替代写法见 [GFM 扩展](/write/blocks/table)。

## 能写行内公式吗

不能。只有块级 ` ```math ` 围栏——装 [MathJax 引擎](/write/diagrams/math)之后它就能用了。

原因是 `$` 在技术文档里到处都是（`$ npm install`、`$HOME`、`$99`），误判会把正常文字变成公式。

## 升级会不会把我的文档搞坏

**0.x 期间只承诺修订号兼容**：`0.0.1 → 0.0.2` 不破坏任何东西，`0.0 → 0.1` 允许破坏语法。

把 `pamphlet lint` 放进 CI，升级时第一时间知道哪份编不动了。见[在 CI 里检查文档](/howto/ci)。

## 源文档丢了怎么办

只要产物是默认参数编的，源文档就在里面：

```bash
pamphlet extract 方案.html > 还原.md
```

用了 `--no-embed-source` 编的就没有。

## 它能做多页站点吗

不能。一份源文档 = 一个 HTML 文件，没有跨页导航和全站搜索。

要多页站点用 VitePress / Rspress / mdBook —— 你现在看的这个站就是 Rspress 做的。
