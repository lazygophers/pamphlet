# 自定义引擎只支持声明式外部命令，不公开 JS 接口

用户添加自己的图表引擎，只有一种方式：在 `pamphlet.config.yaml` 里描述一条外部命令（或一个 HTTP 端点），图源走标准输入进、SVG 走标准输出出。不公开 JS 层面的 `DiagramEngine` 接口，因此不存在第三方构建期 JS 执行、不需要插件沙箱、不需要 `--trust-plugins` 信任模型。配置文件保持纯数据。

```yaml
engines:
  my-engine:
    langs: [mylang]
    command: [my-renderer, --svg, -]   # 图源 → stdin，SVG ← stdout
```

第三方引擎的输出与内置引擎一样，必须过 SVG 消毒（见 [0005](./0005-css-only-animation-strict-svg-sanitisation.md)）。

## Considered Options

- **公开 JS 引擎接口**（用户写 npm 包实现 `render(code) => svg`）：表达力最强，且这个接口在项目内部本来就要被实现多次（见 [0008](./0008-builtin-engines.md)），公开它的边际成本主要是文档。落选，因为它必须同时引入构建期任意 JS 执行的安全边界和插件加载机制。
- **两种都做**：落选，一个人维护两套扩展机制的文档与测试矩阵，代价过高。

## Consequences

**代价必须写进文档**：想用 JavaScript 写一个新引擎的人，得先把它包成一个命令行程序。也就是说这个扩展点接的是「已经存在的外部程序」，而不是「让人在 npm 生态里写一个引擎」。npm 上那些「文本进 SVG 出」的纯 JS 包（例如各种 WASM 渲染器）无法直接挂上，必须自己套一层 CLI。

对应的收益：配置零代码执行这条原则得以完整保留，`pamphlet.config.yaml` 永远只是数据。对一个编译产物要发给别人打开的工具来说，这条边界很值。

内置引擎在项目内部仍然共享一个 `DiagramEngine` 形状的抽象，但它是**内部实现细节**，不导出、不写公共文档、不承担兼容承诺。将来若要公开，需要新开一份 ADR 取代本篇。
