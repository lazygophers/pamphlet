import { fileURLToPath } from 'node:url'
import { defineConfig } from '@rspress/core'

/**
 * 文档站配置。站点发到 https://lazygophers.github.io/pamphlet/，
 * 所以 `base` 必须是 `/pamphlet/`——它是仓库名，不是随便取的。
 *
 * 中文是默认语言，所以中文页面的路由不带语言前缀（`/reference/syntax`），
 * 英文带 `/en/`。这是 Rspress 的既定行为，不是这里配出来的。
 */

/**
 * 一句话说清这个项目是什么。两个地方共用：`locales` 里的站点描述，
 * 以及 `llms.txt` 顶上那句摘要。写两份必然有一天对不上。
 */
const DESCRIPTIONS = {
  zh: '把一份 Markdown 编译成一个能双击打开的 HTML 文件',
  en: 'Compile one Markdown file into one HTML file you can double-click',
} as const

export default defineConfig({
  root: 'docs',
  base: '/pamphlet/',
  siteOrigin: 'https://lazygophers.github.io',
  lang: 'zh',
  title: 'Pamphlet',
  icon: '/favicon.svg',
  locales: [
    {
      lang: 'zh',
      label: '简体中文',
      title: 'Pamphlet',
      description: DESCRIPTIONS.zh,
    },
    {
      lang: 'en',
      label: 'English',
      title: 'Pamphlet',
      description: DESCRIPTIONS.en,
    },
  ],
  /**
   * 给大语言模型读的那一份文档：`/llms.txt` 是目录，`/llms-full.txt` 是全文，
   * 每一页另存一份 `.md`（把地址里的 `.html` 换成 `.md` 就是）。
   *
   * 走 Rspress 内置的 SSG-MD 而不是 `@rspress/plugin-llms`：插件用 remark 处理 MDX 源文件，
   * **渲染不了 React 组件**——主题那一页的一览表和画廊正是组件，插件那条路会把它们整段丢掉。
   * SSG-MD 是从 React 渲染结果生成 Markdown，组件的内容照样在。
   * 官方文档也把插件定位成 SSG-MD 用不了时的退路：https://rspress.rs/guide/basic/ssg-md
   *
   * 多语言站点会额外产出 `/en/llms.txt`：中文是默认语言，落在根上。
   */
  llms: {
    /**
     * 缺省的 `llms.txt` 只有标题和目录，缺 llms.txt 规范里那句引用形式的摘要
     * （<https://llmstxt.org/> 的 Format 一节：标题之后是一段 `>` 开头的简短说明）。
     * 那一行恰恰是最该有的：模型看完它就知道这站是讲什么的，不必先点开一页。
     * 这里只补这一句，目录部分照抄默认的写法。
     *
     * 摘要取自 `DESCRIPTIONS` 而不是回调给的 `description`：站点级的 `description`
     * 这个配置里根本没写（描述是按语言写在 `locales` 里的），回调拿到的是 `undefined`。
     */
    llmsTxt: ({ title, lang, sections }) => {
      const description = DESCRIPTIONS[lang as keyof typeof DESCRIPTIONS] ?? DESCRIPTIONS.zh
      const toc = sections
        .map(
          (section) =>
            `## ${section.title}\n\n${section.pages
              .map((page) =>
                page.description
                  ? `- [${page.title}](${page.link}): ${page.description}`
                  : `- [${page.title}](${page.link})`,
              )
              .join('\n')}`,
        )
        .join('\n\n')
      return `# ${title}\n\n> ${description}\n\n${toc}\n`
    },
  },
  route: {
    // ADR 是内部设计记录，只在 GitHub 上留档，不进站点。
    // 不写这一条它们会被自动注册成 39 个页面（Rspress 的约定式路由）。
    // `components/` 里是给页面用的 React 组件，不是页面。约定式路由连 .tsx
    // 一起注册，注册进去 SSG 会当页面渲染它，然后拿不到页面元数据直接构建失败。
    exclude: ['adr/**/*', 'components/**/*'],
  },
  builderConfig: {
    resolve: {
      alias: {
        // 主题一览表直接从注册表生成（ADR-0047）。指到源码而不是 dist，
        // 否则建站前得先 build 主题包，忘了就悄悄用上一次的旧数据。
        '@nekoleapuki/pamphlet-themes': fileURLToPath(
          new URL('./packages/themes/src/index.ts', import.meta.url),
        ),
      },
    },
  },
  themeConfig: {
    socialLinks: [
      { icon: 'github', mode: 'link', content: 'https://github.com/lazygophers/pamphlet' },
    ],
    footer: {
      message: 'AGPL-3.0-or-later',
    },
  },
})
