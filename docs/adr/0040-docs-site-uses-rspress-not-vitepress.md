# 文档站用 Rspress 而不是 VitePress，ADR 不进站点

[0029](./0029-docs-site-with-self-compiled-examples.md) 定的是「用常规多页站点生成器」，括号里举的例子是 VitePress。实际落地时换成了 [Rspress](https://rspress.rs/)。0029 的实质决定（常规生成器 + 示例产物由 Pamphlet 自己编译 + CI 里重编，失败即构建失败）全部不变，本决定只改生成器和三件配套。

## 为什么换

不是「VitePress 不行」——它完全能做这件事。换的理由是**技术栈一致性**：

- Pamphlet 本身是 npm 生态里的 Node 工具链，没有 Vue 也没有 Vite 之外的理由引入 Vue 生态。VitePress 的主题层是 Vue 组件；Rspress 的主题层是 React 组件（<https://rspress.rs/guide/basic/custom-theme>）。两者对这个项目都不是加分项，但 Rspress 至少不要求再学一套模板语法。
- Rspress 的约定式路由把「目录里有什么 `.md` 就有什么页面」做成默认（<https://rspress.rs/guide/basic/conventional-route>），这正好匹配「文档就是一堆 Markdown」的现状，不需要为导航写一份配置。
- 官方部署文档直接给出 GitHub Pages 的完整 workflow（<https://rspress.rs/guide/basic/deploy>），少一次自己拼装的机会。

这三条都不强。**如果日后有人要换回 VitePress，本决定不构成障碍**——内容全在普通 Markdown 里，换生成器的成本只有配置文件和几个 `_meta.json`。

## 三件配套

### 一、Pages 的发布方式从「分支目录」改成 GitHub Actions

原先是 `{"build_type":"legacy","source":{"branch":"master","path":"/docs"}}`——GitHub 把 `master:/docs` 原样当网站发。

Rspress 要读 `docs/` 当源文件、把成品吐到 `doc_build/`，同一个目录不能既是源又是成品。落选项是「源文件挪到 `website/`、成品编译进 `docs/` 并提交」，这样不用改仓库设置，但**每改一个字 diff 里就多出几十个编译产物**，review 和 blame 全废。

代价是这条路要改一次仓库设置（Settings → Pages → Source 改成 GitHub Actions），而且这是一个影响线上站点的不可逆操作。

### 二、示例产物挪到 `/demo/`

Rspress 占掉站点首页放介绍页，所以 `examples/demo.md` 编出来的那份单文件 HTML 从 `/` 挪到 `/demo/`，放在 Rspress 的 `public/` 目录里（该目录原样复制、不被加工——单文件 HTML 正好需要「不被加工」）。首页最显眼的位置放一个链过去的按钮。

产物本身不提交进 Git：CI 里由 `pamphlet build examples/demo.md` 现编一份。这正是 0029 要的那层免费集成测试。

### 三、39 份 ADR 不进站点

用 `route.exclude: ['adr/**/*']` 排掉。不写这一条它们会被自动注册成 39 个页面。

ADR 是内部设计记录，留在 GitHub 上存档即可，不面向使用者。README 里指向 `docs/adr/` 的链接一并删掉。

代价是**外部开发者搜不到 ADR**，「为什么这么设计」只能靠翻仓库。接受这个代价：ADR 的读者是维护者，不是使用者；把 39 份内部记录摆进使用者的导航里，会让文档站看起来比它实际能帮到人的部分大得多。

## Consequences

**文档站是中英双语的。** 中文是默认语言（路由不带前缀），英文在 `/en/`。这翻倍了内容维护成本，而且双语站几乎一定会不同步——这个代价是明知的。缓解方式只有一条纪律：改中文页时同一次改英文页，不留「回头补」。

**编译器的诊断链接指向文档站的稳定 URL。** 0037 要求过这一点，但代码里写的是 `https://pamphlet.dev/diagnostics/`——那个域名不存在，于是每条诊断底下都挂着一个必然 404 的链接。本次改成 `https://lazygophers.github.io/pamphlet/reference/diagnostics.html#<code>`，诊断码表那一页每个码是一个锚点。

**诊断消息本身还是中文的**，只有码是语言中立的。英文站的诊断页面显式说明了这一点，而不是假装它是双语的。
