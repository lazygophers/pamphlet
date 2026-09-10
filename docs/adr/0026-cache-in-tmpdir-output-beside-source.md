# 缓存放系统临时目录，产物默认写在源文档旁边

图表渲染缓存放系统临时目录（`os.tmpdir()` 下的 Pamphlet 专属子目录）。产物默认写到源文档旁边、同名 `.html`：`docs/方案.md` → `docs/方案.html`。

## Considered Options

- **缓存放 `node_modules/.cache/pamphlet/`**：Node 生态既有约定（Babel、ESLint、Jest 都在那儿），已被所有 `.gitignore` 模板排除。落选。
- **缓存放项目根的 `.pamphlet-cache/`**：位置明确、好清理。落选——需要用户自己加进 `.gitignore`，否则第一次 `git status` 会看到一堆陌生文件。

## Consequences

**用户仓库永远干净**：缓存一个字节都不落在项目目录里，`git status` 不会因为 Pamphlet 多出任何东西，也不需要动用户的 `.gitignore`。

**代价是缓存不持久**：系统重启或临时目录被清理后缓存全失效。这让「第二次 `build` 会快很多」变得不可靠——跨天、跨重启的构建等于冷启动。

这个代价的实际影响比听起来小，因为缓存的主要价值落在 watch 模式：`serve` 会常驻一个浏览器实例、缓存在进程生命周期内一直有效，而「增量构建 < 500ms」这个目标本来就只针对 watch 模式下的连续编辑。真正受影响的是「一次性 `build` 跑两遍」这个场景。

CI 环境本来每次都是干净的，所以那里没有区别。

如果日后发现跨会话缓存确实重要，加一个 `--cache-dir` 参数即可，不需要改默认行为。
