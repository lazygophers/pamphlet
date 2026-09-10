# Pamphlet

Pamphlet（中文名：小册）是一个 Markdown 超集与编译器：写 Markdown，编译出单个自包含的交互式 HTML 文件。名字取「小册子」的隐喻——一份自包含、随手可分发的小出版物。

## Language

**Pamphlet**:
本项目的名称，同时也是它的产物的量词。
_Avoid_: DocD, 小册子, pamphlet.js

**小册**:
Pamphlet 的中文名。
_Avoid_: 文档 D, DocD

**一本 pamphlet**:
编译产物的称呼，即那一个自包含的 HTML 文件。
_Avoid_: 产物, output, 导出物

**源文档**:
作者编写的 UTF-8 Markdown 文件，后缀为 `.md`。任何合法的 CommonMark 文件都是合法源文档。
_Avoid_: .docd 文件, 输入文件, 稿件

**超集**:
Pamphlet 语法与 CommonMark 的关系：只新增语法，绝不改变既有语法的语义。
_Avoid_: 方言, 扩展版 Markdown, 变体

**自包含**:
一本 pamphlet 的核心性质：打开时不向网络请求任何东西，样式、脚本、图片、字体全在文件内。
_Avoid_: 单文件, 离线, self-contained, 内嵌

**逃生兼容**:
源文档在没有 Pamphlet 的环境里（GitHub、任意 Markdown 编辑器）仍能被有意义地阅读的性质。
_Avoid_: 向下兼容, 降级, fallback

**降级**:
一本 pamphlet 在能力受限的环境里（无 JavaScript、开启了「减少动效」）仍然内容完整可读的行为。区别于「逃生兼容」——那说的是源文档，这说的是产物。
_Avoid_: fallback, 兜底, 优雅退化

**指令**:
以 `:::name` 包裹的容器块，是扩展 Markdown 语法的唯一单元。
_Avoid_: 容器, block, 组件, 宏

**图表围栏**:
带语言标记的代码块（如 ` ```mermaid `），其内容是图表源码而非要展示的代码。
_Avoid_: 代码块, fence, 图表块

**图源**:
图表围栏里的那段文本，即用来描述一张图的源码。
_Avoid_: 图表代码, diagram source

**图表引擎**:
把图源变成矢量图的那个东西。Mermaid 是主引擎，d2 是可选第二引擎。
_Avoid_: 渲染器, 适配器, backend

**预渲染**:
在编译期就把图源变成静态矢量图，使产物不需要任何图表相关的 JavaScript。
_Avoid_: 构建期渲染, SSR, 静态化

**运行时**:
内嵌在一本 pamphlet 里的那段 JavaScript，只负责交互（切换、折叠、主题）。
_Avoid_: 脚本, client, bundle

**诊断**:
编译器发给作者的一条消息，带位置、原因和修复建议。错误和警告都是诊断。
_Avoid_: 报错, 日志, message, 校验结果

**占位框**:
一张图渲染失败时，产物里替代它的那个方框，内含出错原因与原始图源。
_Avoid_: 错误框, fallback, placeholder

## 语言表面

**callout**:
带底色和图标的提示框这一类块的统称。它**不是指令名**——四个指令名分别是 `info` / `tip` / `warn` / `danger`。
_Avoid_: admonition, 警告框, `:::callout`

**标题**:
指令的 `[label]` 部分，给读者看的那行字。区别于「属性」。
_Avoid_: label, 名称, 标签

**属性**:
指令的 `{attrs}` 部分，给编译器看的参数（`{default}`、`{effect=fade-up}`）。
_Avoid_: attrs, 参数, 配置

**步骤揭示**:
`:::steps` 指令：一串按顺序滚动进入视野的步骤，本体是一个原生有序列表。
_Avoid_: 步骤条, stepper, 时间线

**文本指令**:
单个冒号的行内指令（`:name[内容]`），指令系统里最短的一档。
_Avoid_: 行内指令, inline directive

## 主题

**语义层**:
按用途命名的那 17 个主题变量（`bg` / `fg` / `primary` / `danger`…），是整套主题的根。
_Avoid_: 全局 token, 基础色, palette

**元素层**:
按具体元素命名的那 30 多个主题变量，默认值全部从语义层派生。
_Avoid_: 组件 token, 细粒度变量

**归一化**:
比对 golden 快照之前，把 base64、哈希这类每次都变的内容替换成带信息的占位符。
_Avoid_: 清洗, 规范化, sanitize（那个词在本项目专指消毒）

## 扩展

**声明式引擎**:
在 frontmatter 里用一条外部命令描述的自定义图表引擎（图源走标准输入进、SVG 走标准输出出）。项目不提供 JS 层面的引擎接口。
_Avoid_: 插件, 自定义渲染器, engine plugin
