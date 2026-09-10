# HTML 组装器 · spec

把 AST 变成一本 pamphlet：一个自包含的单文件 HTML。这份 spec 定的是**行为契约**——每条都写清判据（怎么算通过），因为它同时是测试清单。

依据的决定：[0012](./adr/0012-runtime-assembled-not-bundled.md) 运行时拼接、[0014](./adr/0014-embed-source-in-html-comment.md) 源文档内嵌、[0015](./adr/0015-tab-titles-are-real-headings.md) Tab 标题、[0017](./adr/0017-strict-csp-in-artifact.md) CSP、[0021](./adr/0021-raw-html-passes-through-untouched.md) 裸 HTML、[0022](./adr/0022-toc-config.md) 目录、[0016](./adr/0016-diagram-theming-by-post-processing.md) 图表换色、[0011](./adr/0011-no-size-gate.md) 体积报告。

## 接口

```ts
assemble(parseResult, options) => Promise<{
  html: string
  diagnostics: Diagnostic[]
  report: SizeReport
}>
```

**不碰硬盘。** 读资源靠 `options.readAsset(path) => Promise<Uint8Array>`，测试里喂内存实现。写文件是 CLI 的事。

```ts
interface AssembleOptions {
  readAsset?: (path: string) => Promise<Uint8Array>
  /** 用来算相对路径的基准目录，只参与拼路径，不读硬盘 */
  basePath?: string
  theme?: ThemeTokens
  /** 单个资源的字节上限，默认 2MB */
  assetLimitBytes?: number
  /** 关掉源文档内嵌 */
  embedSource?: boolean
}
```

## 产物结构

顺序是固定的，因为 CSP 只对它之后加载的内容生效：

```html
<!doctype html>
<html lang="{frontmatter.lang ?? zh-CN}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="…sha256-…">
<meta name="color-scheme" content="dark light">
<title>{frontmatter.title ?? 第一个一级标题 ?? 'pamphlet'}</title>
<style>/* 主题变量 + 版式 + 用到的特性的样式 */</style>
</head>
<body>
<main class="pf-doc">{目录}{正文}</main>
<script>/* 内核 + 用到的特性片段 */</script>
</body>
</html>
<!-- pamphlet:source v1 {base64} -->
```

## 十个 seam 的判据

### 1. 顶层 `assemble()`

- 一段纯文字 → 产出含 `<!doctype html>`、`<h1>`、正文、CSP meta、`<style>`、源文档注释的 HTML。
- `frontmatter.title` 决定 `<title>`；没写时取第一个一级标题；都没有时用 `pamphlet`。
- `frontmatter.lang` 决定 `<html lang>`，缺省 `zh-CN`。
- 纯文字文档**不含** `<script>`（没有任何特性要交互 → 运行时 0 字节）。

### 2. 运行时拼接（ADR-0012）

- 只用 Tab 的文档：产物含 tabs 片段标记，**不含** collapse / steps / reveal / theme / diagram-zoom 的标记。
- 六个特性都用到的文档：六个标记都在。
- 纯文字文档：完全没有 `<script>` 标签。
- 片段之间不共享代码——判据是任取一个片段单独放进页面都能跑（用「片段里不出现其它片段定义的标识符」近似）。

### 3. CSP 哈希（ADR-0017）

- CSP 固定形状：`default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; script-src 'sha256-…'`。
- 运行时脚本改一个字节 → 哈希必须变。
- 没有 `<script>` 时，`script-src` 写 `'none'`。
- **真浏览器判据**：产物在 `file://` 下打开，运行时脚本执行（哈希对），而额外注入的内联脚本被拦。

### 4. 资源内嵌

- `![](./a.png)` → `<img src="data:image/png;base64,…">`，产物里不含原路径。
- 超过 `assetLimitBytes`（默认 2MB）→ `EMB-401` 错误，图片位置留一个说明性的占位。
- 读不到文件 → `EMB-402` 错误。
- `https://` 开头的资源 → `EMB-403` 错误（自包含不允许外链，无 `--allow-remote`）。
- 按扩展名判 MIME：png / jpg / jpeg / gif / webp / svg / avif。

### 5. 字体子集化

- `theme.fontFace` 给了字体文件时：抽出文档实际用到的字符 → 子集化 → woff2 → data URI 内嵌进 `@font-face`。
- 判据：从产物里取出 base64，解出来用 fontkit 读字符集——**文档里的字都在，不在文档里的字不在**。
- `.ttc` 字体集合：先报 `EMB-404` 说明要先拆出单个字面（实测 `subset-font` 不吃 ttc）。
- 没给字体时用系统字体栈，产物里没有 `@font-face`。

### 6. 无 JS 降级（ADR-0015）

- Tab 标题渲染成真实标题元素，层级 = 最近祖先标题 + 1，带由标题文本生成的 `id`（中文保留、空格转连字符、重名追加 `-2`）。
- 有 JavaScript 时这些标题被隐藏、变成可点的按钮。
- **真浏览器判据**：禁用 JavaScript 打开产物 → 所有面板内容可见、标题是真标题元素、每个标题有 id、按 id 能跳。

### 7. 目录（ADR-0022）

- `toc.enable` 为真时在正文开头插一段嵌套列表 + 锚点链接。
- `toc.deep` 控制收几级，缺省 2。
- `toc.skipTabs` 缺省 true：目录里不含 Tab 生成的标题。
- `toc.position: side` 已在 frontmatter 层报「尚未实现」，组装器不需要处理。

### 8. 源文档内嵌 + `extract`（ADR-0014）

- 产物末尾一行 `<!-- pamphlet:source v1 {base64} -->`。
- `extract(html) => string` 从产物反解源文档，**字节级相等**。
- `embedSource: false` 时不内嵌，`extract` 报错说明这份产物没带源文档。

### 9. 零外部请求

- **真浏览器判据**：产物在 `file://` 下打开，拦截网络层，请求数为 0。
- 覆盖三种内容：内嵌图片的文档、内嵌字体的文档、含图表 SVG 的文档。

### 10. 体积归因报告（ADR-0011）

- 分项：正文 HTML、样式、运行时、图表 SVG、内嵌图片、字体、源文档注释。
- 各项字节数之和 = 产物总字节数（允许几十字节的框架结构误差）。
- 按贡献降序。
- 每项同时给原始与 gzip 后的字节数。

## 切片顺序

一次一刀，每刀一个失败的测试 → 刚好够让它通过的实现。

| 刀 | 内容 | 完成后能做什么 |
|---|---|---|
| 1 | 骨架：doctype / head / title / lang / 正文 / 主题变量 | 有第一个能打开的产物 |
| 2 | 源文档内嵌 + `extract` 往返 | 产物能反解 |
| 3 | 运行时拼接 + CSP 哈希（严格先后） | 产物有交互，CSP 生效 |
| 4 | Tab 降级为真标题 + 锚点 | 无 JS 可读 |
| 5 | 目录 | 长文档可导航 |
| 6 | 图表 SVG 内联（接上已完成的图表管线） | 图能出现在产物里 |
| 7 | 资源内嵌 + 上限与错误 | 图片进产物 |
| 8 | 字体子集化 | 中文字体进产物 |
| 9 | 体积归因报告 | `--verbose` 能治理体积 |
| 10 | 浏览器层三条承诺（CSP 认哈希 / 零请求 / 无 JS 降级） | 核心承诺有自动化凭据 |
