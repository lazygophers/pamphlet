# doctor

逐个图表引擎打印装了没有、怎么装。

```bash
pamphlet doctor
```

装好了：

```
✓ mermaid（mermaid）
```

没装：

```
✗ mermaid（mermaid）：装一次就好：npm i -g mermaid-isomorphic playwright && npx playwright install chromium（首次约 150MB）
```

**缺任何一个引擎退出码是 `3`**（环境缺失），不是 `1`。分开是为了让 CI 能区分「文档写错了」和「机器上没装东西」。

## 本版本只有一行

只实现了 Mermaid 一个引擎，所以输出只有一行。其余七种见[其余七种图表](/write/diagrams/others)。

将来加上 PlantUML 时，`doctor` 会检测 `java -version` 并在缺失时给出清楚的诊断，而不是让底层 `spawn` 失败的原始错误冒到你面前。
