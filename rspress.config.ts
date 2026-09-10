import { defineConfig } from '@rspress/core'

/**
 * 文档站配置。站点发到 https://lazygophers.github.io/pamphlet/，
 * 所以 `base` 必须是 `/pamphlet/`——它是仓库名，不是随便取的。
 *
 * 中文是默认语言，所以中文页面的路由不带语言前缀（`/guide/syntax`），
 * 英文带 `/en/`。这是 Rspress 的既定行为，不是这里配出来的。
 */
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
      description: '把一份 Markdown 编译成一个能双击打开的 HTML 文件',
    },
    {
      lang: 'en',
      label: 'English',
      title: 'Pamphlet',
      description: 'Compile one Markdown file into one HTML file you can double-click',
    },
  ],
  route: {
    // ADR 是内部设计记录，只在 GitHub 上留档，不进站点。
    // 不写这一条它们会被自动注册成 39 个页面（Rspress 的约定式路由）。
    exclude: ['adr/**/*'],
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
