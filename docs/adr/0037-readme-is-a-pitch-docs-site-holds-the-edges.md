# 第一版 README 只讲定位，技术边界全部放文档站

第一版 README 只写两段内容：**为什么不用 Quarto / MDX / Marp**（落选理由与出处，见 [0003](./0003-why-not-quarto.md)），以及**一个可点开的编译产物链接**（自举示例，见 [0029](./0029-docs-site-with-self-compiled-examples.md)，要等编译器能出 HTML 之后才能补上）。

其余五段「技术边界」内容全部放文档站，不进第一版 README：

| 内容 | 来自 |
|---|---|
| 手机端打不开本地 HTML 的限制与绕行方式 | [0018](./0018-mobile-promise-narrowed.md) |
| 裸 HTML 的两个已知边界（`<style>` 会盖掉主题、内联 `<svg>` 不经消毒） | [0021](./0021-raw-html-passes-through-untouched.md) |
| 通配符不做默认排除的陷阱与正确写法 | [0023](./0023-explicit-file-paths-only.md) |
| 七个图表引擎都是可选依赖、PlantUML 需要 Java、Playwright 约 150MB | [0008](./0008-builtin-engines.md)、[0004](./0004-mermaid-via-headless-browser.md) |
| 0.x 只承诺修订号兼容 | [0006](./0006-versioning-promise.md) |

那五份 ADR 里原本写的「README 必须有」已同步改为「文档站必须有」，以保持 ADR 与现实一致。

## Consequences

**风险敞口必须记清楚**：README 是外部开发者的第一入口，而这五段各自对应一个「用户一定会撞上、且看起来完全像 bug」的行为——手机上打不开、粘贴 HTML 后主题坏了、编译了几百个 `node_modules` 里的文件、装完却画不出图、升级后文档编不动了。撞上时他们不一定会去文档站找答案，很可能直接判定为 bug。

缓解手段有两条，都不是 README：一是**诊断本身要够好**（[0027](./0027-diagnostic-codes-without-severity-prefix.md) 定的格式带修复建议与文档链接，那个链接正好可以指向文档站的对应页面）；二是文档站的这五页要有稳定的 URL，好让诊断直接链过去。

时间上没有冲突：文档站从第 2 周开始写（[0029](./0029-docs-site-with-self-compiled-examples.md)），和第一个 alpha 同期。

`CHANGELOG` 里的破坏性变更说明不受本决定影响——那本来就不属于 README。
