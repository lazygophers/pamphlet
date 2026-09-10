# 乐谱 / 化学式 / 地图不进内置引擎清单

这三类不加进 [0008](./0008-builtin-engines.md) 的七个内置引擎里。要用的人走 [0007](./0007-declarative-custom-engines.md) 的声明式外部命令扩展点。

调研过的候选：

| 类别 | 候选 | 形态 |
|---|---|---|
| 乐谱 | abcjs（ABC 记谱 → SVG） | 浏览器库；官方 FAQ 明确说服务端渲染要推迟到客户端才能调（<https://docs.abcjs.net/overview/faq.html>），Node 里跑要自己搭 DOM 或无头浏览器 |
| 化学式 | SmilesDrawer（SMILES → 结构式） | 官方定位是「in the browser」「No server」（<https://reymond-group.github.io/smilesDrawer/>） |
| 地图 | — | 没做候选调研 |

## Considered Options

- **内置这三个**：落选。理由有三条，任何一条单独成立都够：
  1. **它们都要浏览器**，而 [0004](./0004-mermaid-via-headless-browser.md) 已经为 Mermaid 付过一次 Playwright + Chromium 约 150MB 的代价；再为受众更窄的三类各付一次维护成本不划算。
  2. **受众窄**。七个内置引擎补的都是「写技术方案时会撞上」的缺口（架构图、依赖图、公式、数据图、波形、位域、UML）。乐谱和化学式是专业领域文档，不是这个工具的主线。
  3. **扩展点已经覆盖了**：`pamphlet.config.yaml` 里描述一条「图源进 stdin、SVG 出 stdout」的命令即可，不需要改编译器。
- **只内置化学式**（它最接近纯函数：字符串进、SVG 出）：落选，理由 2 同样成立，而且省下的只是用户写四行配置。

## Consequences

**这是一条可以推翻的决定，代价很低。** 加一个内置引擎只是在引擎清单里多一项 + 一条缺失诊断，不动任何已有接口。真有人要用，先走扩展点，用起来了再谈内置。

**地图这一类连候选都没调研过**，因为「地图」在文档里通常指的是配图（一张 PNG），而不是一种可以从文本渲染的图表语言。真要做，得先说清输入是什么文本格式。
