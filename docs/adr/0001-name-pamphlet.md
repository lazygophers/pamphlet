# 项目命名为 Pamphlet（小册）

项目原名 DocD，现定名 **Pamphlet**，中文名「小册」。理由是名字必须承载核心隐喻——「一份自包含、随手可分发的小出版物」——而 DocD 只是「Document + DSL」的缩写，说不出这个项目跟别的文档工具有什么不同。产物的量词也随之统一为「一本 pamphlet」。

## Considered Options

- **DocD**：原名。缩写，需要解释才懂，且 "D" 的含义（DSL）对读者毫无意义。
- **Pamphlet**：8 个字母作为 CLI 命令偏长，但拼读无歧义、输入容错高，且与仓库名 `pamphlet` 已经一致。

## Consequences

命名是这个项目里最难回退的决定之一，它同时锁定三样东西：npm scope `@pamphlet/*`、CLI 命令名 `pamphlet`、以及对外的品牌。既然定位是开源项目（见 [0002](./0002-source-extension-is-md.md) 的上下文），npm scope 一经发布就等于公共契约，改名意味着弃用整个包命名空间。

Slogan 方向：`Write once, ship one file.` / 「写 Markdown，出一本小册」。
