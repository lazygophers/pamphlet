# @nekoleapuki/pamphlet-runtime

一本 pamphlet 里那段负责交互的 JavaScript：约 1KB 内核 + 六个互相独立的特性片段。

**你多半不需要单独装它。** 它是 [`@nekoleapuki/pamphlet-cli`](https://www.npmjs.com/package/@nekoleapuki/pamphlet-cli) 的内部依赖，编译时由 cli 按需拼接进产物。

## 它为什么长这样

运行时不是打包出来的，是**字符串拼接**出来的：编译器只把这份文档真正用到的片段拼进产物。纯文字文档最后一个字节的 JavaScript 都不会带。

每个片段自带 `/* data-pf-feature="name" */` 标记，供体积归因报告统计。

产物里那份严格 CSP 用 sha256 哈希白名单放行这段脚本——静态文件没法用 nonce，所以哈希是唯一可行的写法。

## 约束

- 浏览器 + ES2018 + DOM
- **不能用 ES module**：产物要在 `file://` 下能打开，而 `file://` 下 ES module 会被 CORS 拦住

## 文档

<https://lazygophers.github.io/pamphlet/>

## 许可证

AGPL-3.0-or-later
