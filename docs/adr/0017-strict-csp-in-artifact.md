# 产物注入严格 CSP，脚本靠 sha256 哈希白名单

每一本 pamphlet 的 `<head>` 里注入：

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; script-src 'sha256-<运行时哈希>'">
```

除了 data: 图片、data: 字体、内联样式、以及那一段哈希匹配的运行时脚本，其他一切都拦——包括任何网络请求、任何其他脚本、iframe、object。

## 实测依据

这些不是从规范推的，是在 Chrome / macOS / `file://` 下跑探针页验的：

- `<meta>` 注入的 CSP 在 `file://` 下**生效**：`script-src 'none'` 时内联脚本确实被拦（探针文本停在未执行的初始值）。
- `script-src 'sha256-...'` **双向都对**：哈希匹配的脚本执行，同一页里另一段没加哈希的脚本被拦。
- data URI 字体、`location.hash`、`prefers-color-scheme` 在 `file://` 下均正常。

规范层面的三条约束（决定了策略只能长这样）：

- meta CSP **不支持** `frame-ancestors` / `sandbox` / `report-uri`，解析时静默移除（<https://www.w3.org/TR/CSP2/>；原因见 <https://lists.w3.org/Archives/Public/public-webappsec/2014Nov/0057.html>——这几个指令要在文档开始解析前生效，meta 出现时来不及）。所以产物无法自我上报违规，也无法用 sandbox 兜底。
- **nonce 在静态文件场景必然不可用**：规范要求 nonce 每次响应唯一、由 CSPRNG 生成、至少 128 bit 熵（<https://www.w3.org/TR/CSP3/>）。静态文件没有「每次响应」，写死即公开。原始设计写的「服务端 nonce 不可得时用 sha256」方向对，但「不可得」不是偶发情况而是必然——所以只有哈希这一条路。
- **运行时不能用 `<script type="module">`**：module script 按规范要走 CORS 协议抓取，`file://` 没有 origin，双击打开直接失效。运行时必须是普通内联 script。Service Worker 在 `file://` 同样完全不可用（要求安全上下文）。

## Considered Options

- **额外允许 `img-src data: https:`**，给「作者想引用一张网络图片」留一条路。落选：产物会在打开时发起网络请求，直接推翻「自包含」这个核心承诺。
- **不注入 CSP**，只靠构建期消毒。落选：失去纵深防御，一旦消毒器有绕过（DOMPurify 历史上有过），产物里就没有第二道防线。

## Consequences

CSP 顺带成了「零外部请求」的强制执行者。`--check-offline` 那个校验只在构建期跑一次，而 CSP 在每一次打开时都生效——产物里如果不小心留了外链，浏览器会直接拦掉而不是悄悄发出请求。

`style-src` 只能用 `'unsafe-inline'`，这是这份策略里唯一的松口：样式全部内联，哈希对样式不实用。可接受——样式注入的危害远小于脚本注入，且 `default-src 'none'` 已经挡住了样式里引用外部资源。

运行时脚本的哈希必须在组装阶段的最后计算（内容一变哈希就变），因此「拼接运行时」（见 [0012](./0012-runtime-assembled-not-bundled.md)）和「算哈希写进 CSP」有严格的先后顺序，不能并行。
