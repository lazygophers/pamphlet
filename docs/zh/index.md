---
pageType: home

hero:
  name: Pamphlet
  text: 一份 Markdown，一个 HTML 文件
  tagline: 不联网、不带依赖、图是提前画好的静态 SVG、面板可以点、关掉 JavaScript 照样从头读到尾
  actions:
    - theme: brand
      text: 快速开始
      link: /start/quickstart
    - theme: alt
      text: 看一眼产物
      link: /demo/

features:
  - title: 双击就能打开
    details: 产物是单个 HTML 文件。发微信、塞 U 盘、断网打开都一样，它不向网络要任何东西。
    icon: 📄
  - title: 图是提前画好的
    details: Mermaid 在编译时把图渲染成静态 SVG 内联进产物。读者那边不跑任何图表库。
    icon: 📊
  - title: 没有 JavaScript 也能读全
    details: Tab 降级成全部展开，折叠块降级成原生 details。一个字都不会丢。
    icon: ♿
  - title: 语法是 CommonMark 严格超集
    details: 源文档沿用 .md，直接丢上 GitHub 仍然能读。九个容器指令全部是标准的 directive 语法。
    icon: 📝
  - title: 跟随系统深浅色
    details: 连图里的线和字一起变。纯 CSS，没有一行 JavaScript 参与。
    icon: 🌗
  - title: 产物里内嵌源文档
    details: pamphlet extract 能从产物原样吐回那份 .md。产物即备份。
    icon: 🔁
---
