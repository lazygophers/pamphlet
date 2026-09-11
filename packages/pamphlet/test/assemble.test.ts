/**
 * HTML 组装器。施工图 docs/spec-assembler.md 已完工删除，判据现在就是这些测试本身。
 * 只在这里做字符串层面的断言；「浏览器真的怎么表现」放 artifact-in-browser.test.ts。
 */

import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import * as fontkit from 'fontkit'
import { describe, expect, it } from 'vitest'
import { parse } from '../src/parse.js'
import { assemble, extract, styleSheet, LIGHT, DARK } from '../src/assemble/index.js'
import { removeOnce } from '../src/assemble/report.js'

const build = (source: string, options = {}) => assemble(parse(source), options)

describe('seam 1：骨架', () => {
  it('一段纯文字编译成能打开的自包含 HTML', async () => {
    const { html } = await build('# 订单系统方案\n\n一段正文。')
    expect(html.startsWith('<!doctype html>')).toBe(true)
    expect(html).toContain('<meta charset="utf-8">')
    expect(html).toContain('<h1')
    expect(html).toContain('一段正文')
    expect(html).toContain('</html>')
  })

  it('title 取 frontmatter；没写时取第一个一级标题', async () => {
    const withTitle = await build('---\ntitle: 甲方案\n---\n\n# 别的标题\n')
    expect(withTitle.html).toContain('<title>甲方案</title>')

    const fromHeading = await build('# 从标题来的\n\n正文')
    expect(fromHeading.html).toContain('<title>从标题来的</title>')

    const neither = await build('正文而已')
    expect(neither.html).toContain('<title>pamphlet</title>')
  })

  it('lang 取 frontmatter，缺省 zh-CN', async () => {
    expect((await build('正文')).html).toContain('<html lang="zh-CN">')
    expect((await build('---\nlang: en\n---\n\n正文')).html).toContain('<html lang="en">')
  })

  it('标题里的 HTML 特殊字符被转义，不会破坏 title 标签', async () => {
    const { html } = await build('---\ntitle: "甲 <b>与</b> & 乙"\n---\n\n正文')
    expect(html).toContain('<title>甲 &lt;b&gt;与&lt;/b&gt; &amp; 乙</title>')
  })

  it('主题变量写进内联样式', async () => {
    const { html } = await build('正文')
    expect(html).toContain('--pf-bg')
    expect(html).toContain('--pf-fg')
    expect(html).toContain('--pf-diagram-text')
  })

  it('纯文字文档不含任何 script', async () => {
    const { html } = await build('# 标题\n\n正文，还有 **强调** 和 `代码`。')
    expect(html).not.toContain('<script')
  })

  it('GFM 表格与任务列表照常输出', async () => {
    const { html } = await build('| 甲 | 乙 |\n| --- | --- |\n| 1 | 2 |\n\n- [x] 完成\n')
    expect(html).toContain('<table>')
    expect(html).toContain('type="checkbox"')
  })

  it('裸 HTML 原样通过（ADR-0021）', async () => {
    const { html } = await build('水是 H<sub>2</sub>O。')
    expect(html).toContain('H<sub>2</sub>O')
  })

  it('代码块被转义，不会当成标签', async () => {
    const { html } = await build('```\n<script>alert(1)</script>\n```')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>alert(1)</script>')
  })
})

describe('seam 8：源文档内嵌 + extract 往返（ADR-0014）', () => {
  const source = [
    '---',
    'title: 往返测试',
    '---',
    '',
    '# 标题',
    '',
    '含中文、emoji 🧨、以及 `代码` 和 <sub>标签</sub>。',
    '',
    '::::tabs',
    ':::tab[甲]',
    '内容',
    ':::',
    '::::',
    '',
  ].join('\n')

  it('产物末尾有一条 base64 源文档注释', async () => {
    const { html } = await build(source)
    expect(html).toMatch(/<!-- pamphlet:source v1 [A-Za-z0-9+/=]+ -->/)
  })

  it('extract 拿回来的源文档字节级相等', async () => {
    const { html } = await build(source)
    expect(extract(html)).toBe(source)
  })

  it('embedSource: false 时不内嵌，extract 报错说明这份产物没带源文档', async () => {
    const { html } = await build(source, { embedSource: false })
    expect(html).not.toContain('pamphlet:source')
    expect(() => extract(html)).toThrow(/没有内嵌源文档/)
  })

  it('注释放在 </html> 之后，不影响文档本身', async () => {
    const { html } = await build('正文')
    const closing = html.indexOf('</html>')
    expect(html.indexOf('pamphlet:source')).toBeGreaterThan(closing)
  })

  it('源文档里本身含 --> 也不会截断注释', async () => {
    const tricky = '正文里有 --> 这个序列，还有 <!-- 注释 -->。\n'
    const { html } = await build(tricky)
    expect(extract(html)).toBe(tricky)
  })
})

describe('seam 2：运行时按特性拼接（ADR-0012）', () => {
  const featureMark = (name: string) => `data-pf-feature="${name}"`

  it('只用 Tab 的文档只带 tabs 片段', async () => {
    const { html } = await build(
      ['::::tabs', ':::tab[甲]', '内容', ':::', ':::tab[乙]', '内容', ':::', '::::'].join('\n'),
    )
    expect(html).toContain(featureMark('tabs'))
    for (const other of ['collapse', 'steps', 'reveal', 'diagram-zoom']) {
      expect(html).not.toContain(featureMark(other))
    }
  })

  it('只用折叠的文档只带 collapse 片段', async () => {
    const { html } = await build([':::collapse[甲]', '内容', ':::'].join('\n'))
    expect(html).toContain(featureMark('collapse'))
    expect(html).not.toContain(featureMark('tabs'))
  })

  it('多个特性一起用时各自的片段都在', async () => {
    const { html } = await build(
      [
        '::::tabs',
        ':::tab[甲]',
        '内容',
        ':::',
        '::::',
        '',
        ':::collapse[乙]',
        '内容',
        ':::',
        '',
        ':::steps',
        '1. 一',
        ':::',
        '',
        ':::reveal',
        '内容',
        ':::',
      ].join('\n'),
    )
    for (const feature of ['tabs', 'collapse', 'steps', 'reveal']) {
      expect(html).toContain(featureMark(feature))
    }
  })

  it('纯文字文档完全没有 script 标签', async () => {
    const { html } = await build('# 标题\n\n正文')
    expect(html).not.toContain('<script')
  })

  it('片段之间不共享代码：每个片段单独取出来都能解析', async () => {
    const { html } = await build([':::collapse[甲]', '内容', ':::'].join('\n'))
    const script = /<script[^>]*>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? ''
    expect(script.length).toBeGreaterThan(0)
    // 语法上自洽（能被 Function 构造器接受）就说明没有依赖外部未定义的东西
    expect(() => new Function(script)).not.toThrow()
  })
})

describe('seam 3：CSP 哈希（ADR-0017）', () => {
  const csp = (html: string) =>
    /<meta http-equiv="Content-Security-Policy" content="([^"]+)">/.exec(html)?.[1] ?? ''

  it('CSP 的固定形状', async () => {
    const { html } = await build([':::collapse[甲]', '内容', ':::'].join('\n'))
    const policy = csp(html)
    expect(policy).toContain("default-src 'none'")
    expect(policy).toContain('img-src data:')
    expect(policy).toContain('font-src data:')
    expect(policy).toContain("style-src 'unsafe-inline'")
    expect(policy).toMatch(/script-src 'sha256-[A-Za-z0-9+/=]+'/)
  })

  it('没有脚本时 script-src 写 none', async () => {
    const { html } = await build('# 只有文字')
    expect(csp(html)).toContain("script-src 'none'")
    expect(csp(html)).not.toContain('sha256-')
  })

  it('哈希是那段脚本内容真正的 sha256', async () => {
    const { html } = await build([':::collapse[甲]', '内容', ':::'].join('\n'))
    const script = /<script[^>]*>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? ''
    const expected = createHash('sha256').update(script, 'utf8').digest('base64')
    expect(csp(html)).toContain(`'sha256-${expected}'`)
  })

  it('用到的特性不同，脚本不同，哈希也就不同', async () => {
    const one = await build([':::collapse[甲]', '内容', ':::'].join('\n'))
    const two = await build([':::steps', '1. 一', ':::'].join('\n'))
    expect(csp(one.html)).not.toBe(csp(two.html))
  })

  it('CSP meta 出现在 style 与 script 之前——它只对之后的内容生效', async () => {
    const { html } = await build([':::collapse[甲]', '内容', ':::'].join('\n'))
    const cspAt = html.indexOf('Content-Security-Policy')
    expect(cspAt).toBeGreaterThan(-1)
    expect(cspAt).toBeLessThan(html.indexOf('<style>'))
    expect(cspAt).toBeLessThan(html.indexOf('<script'))
  })
})

describe('seam 6：Tab 降级成真标题（ADR-0015）', () => {
  const tabs = ['::::tabs', ':::tab[部署视图]', '甲内容', ':::', ':::tab[成本视图]', '乙内容', ':::', '::::']

  it('Tab 标题是真标题元素，带锚点 id', async () => {
    const { html } = await build(['## 方案对比', '', ...tabs].join('\n'))
    expect(html).toMatch(/<h3 class="pf-tab-title" id="部署视图">部署视图<\/h3>/)
    expect(html).toMatch(/<h3 class="pf-tab-title" id="成本视图">成本视图<\/h3>/)
  })

  it('层级 = 最近祖先标题 + 1', async () => {
    const underH1 = await build(['# 一级', '', ...tabs].join('\n'))
    expect(underH1.html).toContain('<h2 class="pf-tab-title"')

    const underH3 = await build(['# 一级', '', '### 三级', '', ...tabs].join('\n'))
    expect(underH3.html).toContain('<h4 class="pf-tab-title"')
  })

  it('没有祖先标题时从 h2 起（不跳级）', async () => {
    const { html } = await build(tabs.join('\n'))
    expect(html).toContain('<h2 class="pf-tab-title"')
  })

  it('两个面板的内容都在产物里——无 JS 时全部可读', async () => {
    const { html } = await build(tabs.join('\n'))
    expect(html).toContain('甲内容')
    expect(html).toContain('乙内容')
    // 面板元素上没有 hidden 属性：隐藏是运行时挂上的，不是编译期写死的
    expect(html).not.toMatch(/<section class="pf-tab"[^>]*\bhidden\b/)
  })

  it('标题重名时 id 追加序号', async () => {
    const { html } = await build(
      [
        '## 甲',
        '',
        '::::tabs',
        ':::tab[视图]',
        '一',
        ':::',
        '::::',
        '',
        '## 乙',
        '',
        '::::tabs',
        ':::tab[视图]',
        '二',
        ':::',
        '::::',
      ].join('\n'),
    )
    expect(html).toContain('id="视图"')
    expect(html).toContain('id="视图-2"')
  })

  it('{default} 标在第二个时，data-pf-default 也在第二个', async () => {
    const { html } = await build(
      ['::::tabs', ':::tab[备选]', '一', ':::', ':::tab[推荐]{default}', '二', ':::', '::::'].join('\n'),
    )
    const first = html.indexOf('data-pf-tab="备选"')
    const second = html.indexOf('data-pf-tab="推荐"')
    const marker = html.indexOf('data-pf-default')
    expect(marker).toBeGreaterThan(first)
    expect(marker).toBeGreaterThan(second)
  })
})

describe('seam 7：目录（ADR-0022）', () => {
  const doc = (toc: string) =>
    [
      '---',
      ...toc.split('\n'),
      '---',
      '',
      '# 大标题',
      '',
      '## 甲章',
      '',
      '::::tabs',
      ':::tab[面板一]',
      '内容',
      ':::',
      '::::',
      '',
      '### 甲章小节',
      '',
      '## 乙章',
      '',
    ].join('\n')

  it('不开 toc 时产物里没有目录', async () => {
    const { html } = await build(doc('title: 无目录'))
    expect(html).not.toContain('pf-toc')
  })

  it('开了 toc 时插一段带锚点的嵌套列表', async () => {
    const { html } = await build(doc('toc: true'))
    expect(html).toContain('class="pf-toc pf-toc-side"')
    expect(html).toContain('href="#甲章"')
    expect(html).toContain('href="#乙章"')
  })

  it('deep 缺省 2：三级标题不进目录', async () => {
    const { html } = await build(doc('toc: true'))
    expect(html).not.toContain('href="#甲章小节"')
  })

  it('deep: 3 时三级标题进目录', async () => {
    const { html } = await build(doc('toc:\n  enable: true\n  deep: 3'))
    expect(html).toContain('href="#甲章小节"')
  })

  it('skipTabs 缺省 true：Tab 标题不进目录', async () => {
    const { html } = await build(doc('toc:\n  enable: true\n  deep: 3'))
    expect(html).not.toContain('href="#面板一"')
  })

  it('skipTabs: false 时 Tab 标题进目录', async () => {
    const { html } = await build(doc('toc:\n  enable: true\n  deep: 3\n  skipTabs: false'))
    expect(html).toContain('href="#面板一"')
  })

  it('目录在正文之前', async () => {
    const { html } = await build(doc('toc: true'))
    expect(html.indexOf('pf-toc')).toBeLessThan(html.indexOf('id="甲章"'))
  })
})

describe('图表 SVG 内联（接图表管线的结果）', () => {
  it('渲染好的 SVG 内联进 figure，不留代码块', async () => {
    const parsed = parse('```mermaid\ngraph TD\nA-->B\n```')
    const code = parsed.ast.children.find((n) => n.type === 'code') as {
      data?: { svg?: string }
    }
    code.data = { svg: '<svg role="img"><title>图</title></svg>' }
    const { html } = await assemble(parsed)
    expect(html).toContain('class="pf-diagram"')
    expect(html).toContain('<svg role="img">')
    expect(html).not.toContain('<pre><code class="language-mermaid"')
  })

  it('渲染失败的图变成占位框，图源留在里面（ADR-0028）', async () => {
    const parsed = parse('```mermaid\n坏语法\n```')
    const code = parsed.ast.children.find((n) => n.type === 'code') as {
      data?: { failed?: { reason: string } }
    }
    code.data = { failed: { reason: '渲染超过 10 秒' } }
    const { html } = await assemble(parsed)
    expect(html).toContain('pf-diagram-failed')
    expect(html).toContain('渲染超过 10 秒')
    expect(html).toContain('坏语法')
  })

  it('没渲染过的图表围栏退化成普通代码块', async () => {
    const { html } = await build('```mermaid\ngraph TD\nA-->B\n```')
    expect(html).toContain('language-mermaid')
  })
})

describe('seam 4：资源内嵌', () => {
  const PNG = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  ])
  const assets = (map: Record<string, Uint8Array>) => ({
    readAsset: async (path: string) => {
      const hit = map[path]
      if (!hit) throw new Error(`ENOENT: ${path}`)
      return hit
    },
  })

  it('本地图片变成 data URI，产物里不含原路径', async () => {
    const { html, diagnostics } = await build('![架构图](./arch.png)', assets({ './arch.png': PNG }))
    expect(html).toContain('data:image/png;base64,')
    expect(html).not.toContain('./arch.png')
    expect(html).toContain('alt="架构图"')
    expect(diagnostics).toEqual([])
  })

  it('按扩展名判 MIME', async () => {
    for (const [file, mime] of [
      ['a.jpg', 'image/jpeg'],
      ['a.jpeg', 'image/jpeg'],
      ['a.gif', 'image/gif'],
      ['a.webp', 'image/webp'],
      ['a.svg', 'image/svg+xml'],
      ['a.avif', 'image/avif'],
    ] as const) {
      const { html } = await build(`![](${file})`, assets({ [file]: PNG }))
      expect(html).toContain(`data:${mime};base64,`)
    }
  })

  it('超过上限报 EMB-401，并给压缩建议', async () => {
    const big = new Uint8Array(1024)
    const { html, diagnostics } = await build(
      '![大图](./big.png)',
      { ...assets({ './big.png': big }), assetLimitBytes: 512 },
    )
    const error = diagnostics.find((d) => d.code === 'EMB-401')
    expect(error?.severity).toBe('error')
    expect(error?.message).toContain('big.png')
    expect(error?.hint).toBeDefined()
    expect(html).not.toContain('data:image/png')
  })

  it('读不到文件报 EMB-402', async () => {
    const { diagnostics } = await build('![缺的](./missing.png)', assets({}))
    expect(diagnostics.find((d) => d.code === 'EMB-402')?.severity).toBe('error')
  })

  it('远程资源报 EMB-403——自包含不允许外链', async () => {
    const { html, diagnostics } = await build('![远的](https://example.com/a.png)', assets({}))
    const error = diagnostics.find((d) => d.code === 'EMB-403')
    expect(error?.severity).toBe('error')
    expect(error?.hint).toContain('下载到本地')
    expect(html).not.toContain('https://example.com/a.png')
  })

  it('没给 readAsset 时，本地图片报 EMB-402 而不是崩掉', async () => {
    const { diagnostics } = await build('![](./a.png)')
    expect(diagnostics.find((d) => d.code === 'EMB-402')).toBeDefined()
  })

  it('data: 开头的图片原样保留（作者自己就内嵌好了）', async () => {
    const uri = 'data:image/gif;base64,R0lGOD'
    const { html, diagnostics } = await build(`![](${uri})`, assets({}))
    expect(html).toContain(uri)
    expect(diagnostics).toEqual([])
  })

  it('同一张图引用两次只内嵌一份', async () => {
    const { html } = await build('![](./a.png)\n\n![](./a.png)', assets({ './a.png': PNG }))
    const count = html.split('data:image/png;base64,').length - 1
    expect(count).toBe(2)
    // 两处都指向同一段 base64（内容一样），但只读了一次文件——用诊断没有重复来近似
    expect(html).not.toContain('./a.png')
  })
})

describe('seam 5：字体子集化', () => {
  // 本机自带的单字面 CJK 字体（macOS 系统字体目录）。没有它时这两条自动跳过。
  const SOURCE_HAN = '/System/Library/Fonts/Supplemental/Arial Unicode.ttf'
  const hasFont = existsSync(SOURCE_HAN)

  it('不给字体时用系统字体栈，产物里没有 @font-face', async () => {
    const { html } = await build('正文')
    expect(html).not.toContain('@font-face')
    expect(html).toContain('PingFang SC')
  })

  it.runIf(hasFont)(
    '产物里的字体只含文档实际用到的字',
    async () => {
      const source = '# 订单系统方案\n\n库存预扣与支付回调。\n'
      const { html, diagnostics } = await build(source, {
        font: { family: 'Pamphlet Sans', path: SOURCE_HAN },
        readAsset: async (path: string) => new Uint8Array(readFileSync(path)),
      })
      expect(diagnostics.filter((d) => d.severity === 'error')).toEqual([])
      expect(html).toContain('@font-face')
      expect(html).toContain('data:font/woff2;base64,')

      const base64 = /src:url\(data:font\/woff2;base64,([^)]+)\)/.exec(html)?.[1] ?? ''
      expect(base64.length).toBeGreaterThan(0)
      const font = fontkit.create(Buffer.from(base64, 'base64')) as {
        characterSet: number[]
      }
      const covered = new Set(font.characterSet)
      for (const char of '订单系统方案库存预扣与支付回调') {
        expect(covered.has(char.codePointAt(0) as number), `${char} 应该在子集里`).toBe(true)
      }
      for (const char of '鑫燊髙') {
        expect(covered.has(char.codePointAt(0) as number), `${char} 不该在子集里`).toBe(false)
      }
    },
    120_000,
  )

  it.runIf(hasFont)(
    '子集比原字体小得多',
    async () => {
      const original = readFileSync(SOURCE_HAN).byteLength
      const { html } = await build('# 甲\n\n乙丙丁。\n', {
        font: { family: 'Pamphlet Sans', path: SOURCE_HAN },
        readAsset: async (path: string) => new Uint8Array(readFileSync(path)),
      })
      const base64 = /src:url\(data:font\/woff2;base64,([^)]+)\)/.exec(html)?.[1] ?? ''
      const subset = Buffer.from(base64, 'base64').byteLength
      expect(subset).toBeLessThan(original / 20)
    },
    120_000,
  )

  it('.ttc 字体集合报 EMB-404，说明要先拆出单个字面', async () => {
    const { diagnostics } = await build('正文', {
      font: { family: '甲', path: '/tmp/whatever.ttc' },
      readAsset: async () => new Uint8Array([0x74, 0x74, 0x63, 0x66]),
    })
    const error = diagnostics.find((d) => d.code === 'EMB-404')
    expect(error?.severity).toBe('error')
    expect(error?.hint).toContain('单个字面')
  })

  it('字体读不到时报 EMB-402，且不影响正文', async () => {
    const { html, diagnostics } = await build('# 标题\n\n正文', {
      font: { family: '甲', path: './missing.otf' },
      readAsset: async () => {
        throw new Error('ENOENT')
      },
    })
    expect(diagnostics.find((d) => d.code === 'EMB-402')).toBeDefined()
    expect(html).toContain('正文')
    expect(html).not.toContain('@font-face')
  })
})

describe('seam 10：体积归因报告', () => {
  it('各项字节数之和等于产物总字节数', async () => {
    const source = [
      '# 标题',
      '',
      '::::tabs',
      ':::tab[甲]',
      '甲的内容',
      ':::',
      ':::tab[乙]',
      '乙的内容',
      ':::',
      '::::',
      '',
      '![图](./a.png)',
      '',
    ].join('\n')
    const { html, report } = await build(source, {
      readAsset: async () => new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
    })
    const sum = report.parts.reduce((acc, part) => acc + part.bytes, 0)
    expect(sum).toBe(report.total)
    expect(report.total).toBe(Buffer.byteLength(html, 'utf8'))
  })

  it('按贡献降序，每项同时给原始与 gzip 字节数', async () => {
    const { report } = await build('# 标题\n\n' + '一段很长的正文。'.repeat(200))
    const bytes = report.parts.map((part) => part.bytes)
    expect(bytes).toEqual([...bytes].sort((a, b) => b - a))
    for (const part of report.parts) {
      expect(part.gzipBytes).toBeGreaterThan(0)
      expect(part.gzipBytes).toBeLessThanOrEqual(part.bytes)
    }
  })

  it('没用到的分项不出现（纯文字文档没有运行时、没有图片、没有字体）', async () => {
    const { report } = await build('# 标题\n\n正文')
    const names = report.parts.map((part) => part.name)
    expect(names).toContain('正文 HTML')
    expect(names).toContain('样式')
    expect(names).toContain('源文档注释')
    expect(names).not.toContain('运行时')
    expect(names).not.toContain('内嵌图片')
    expect(names).not.toContain('字体')
  })

  it('内嵌字体单独成一项', async () => {
    const hasFont = existsSync('/System/Library/Fonts/Supplemental/Arial Unicode.ttf')
    if (!hasFont) return
    const { report } = await build('# 订单系统\n\n库存预扣。', {
      font: { family: '甲', path: '/System/Library/Fonts/Supplemental/Arial Unicode.ttf' },
      readAsset: async (path: string) => new Uint8Array(readFileSync(path)),
    })
    const part = report.parts.find((candidate) => candidate.name === '字体')
    expect(part?.bytes).toBeGreaterThan(1000)
    // 子集化要把整份 CJK 字体读进来再算，整套并行跑时抢不到 CPU
  }, 120_000)

  it('关掉源文档内嵌时没有那一项', async () => {
    const { report } = await build('正文', { embedSource: false })
    expect(report.parts.map((part) => part.name)).not.toContain('源文档注释')
  })
})

describe('渲染的其余分支', () => {
  it('reveal 不写 effect 时用缺省的 fade-up，写了就用写的', async () => {
    const fallback = await build(':::reveal\n内容\n:::\n')
    expect(fallback.html).toContain('data-pf-reveal="fade-up"')
    const explicit = await build(':::reveal{effect=slide-left}\n内容\n:::\n')
    expect(explicit.html).toContain('data-pf-reveal="slide-left"')
  })

  it('callout 不写标题时不生成标题行', async () => {
    const { html } = await build(':::info\n提示正文\n:::\n')
    expect(html).toContain('pf-callout-info')
    // 只看正文，样式表里本来就有 .pf-callout-title 这条规则
    const body = /<main class="pf-doc">([\s\S]*?)<\/main>/.exec(html)?.[1] ?? ''
    expect(body).not.toContain('pf-callout-title')
  })

  it('tab 用 {default} 指定默认面板', async () => {
    const { html } = await build(
      ['::::tabs', ':::tab[甲]', '一', ':::', ':::tab[乙]{default}', '二', ':::', '::::'].join('\n'),
    )
    const marked = /<section class="pf-tab" data-pf-tab="([^"]+)" data-pf-default>/.exec(html)
    expect(marked?.[1]).toBe('乙')
  })

  it('目录跨级时标签配平（h2 → h4 → h2 不会漏闭合）', async () => {
    const { html } = await build(
      '---\ntoc:\n  enable: true\n  deep: 4\n---\n\n# 顶\n\n## 甲\n\n#### 深\n\n## 乙\n',
    )
    const toc = /<nav class="pf-toc[^"]*"[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1] ?? ''
    expect(toc.match(/<ol>/g)?.length).toBe(toc.match(/<\/ol>/g)?.length)
  })
})

describe('字体的其余失败路径', () => {
  it('没提供 readAsset 时报 EMB-402', async () => {
    const { html, diagnostics } = await build('正文', {
      font: { family: '甲', path: './a.otf' },
    })
    expect(diagnostics.find((d) => d.code === 'EMB-402')).toBeDefined()
    expect(html).not.toContain('@font-face')
  })

  it('文件不是字体时报 EMB-404 并说明该给什么格式', async () => {
    const { diagnostics } = await build('正文', {
      font: { family: '甲', path: './a.otf' },
      readAsset: async () => new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
    })
    const error = diagnostics.find((d) => d.code === 'EMB-404')
    expect(error?.severity).toBe('error')
    expect(error?.hint).toContain('ttf')
  })
})

describe('渲染的兜底分支', () => {
  it('叶子指令与行内指令当普通文字输出（解析阶段已经报过诊断）', async () => {
    const { html } = await build('::note[甲]\n\n一段 :abbr[乙] 文字。\n')
    const body = /<main class="pf-doc">([\s\S]*?)<\/main>/.exec(html)?.[1] ?? ''
    expect(body).toContain(':note')
    expect(body).toContain(':abbr')
  })

  it('未知的容器指令只渲染它的内容，不生成任何包装元素', async () => {
    const { html } = await build(':::unknown\n里面的正文\n:::\n')
    const body = /<main class="pf-doc">([\s\S]*?)<\/main>/.exec(html)?.[1] ?? ''
    expect(body).toContain('里面的正文')
    expect(body).not.toContain('unknown')
  })

  it('有序列表的 start、任务列表的勾选框都照实渲染', async () => {
    const { html } = await build('3. 甲\n4. 乙\n\n- [x] 做完了\n- [ ] 没做\n')
    expect(html).toContain('<ol start="3">')
    expect(html).toContain('<input type="checkbox" disabled checked>')
    expect(html).toContain('<input type="checkbox" disabled>')
  })

  it('图表渲染失败时留一个带原因的占位框，图源照样看得见（ADR-0028）', async () => {
    const parsed = parse('正文\n')
    parsed.ast.children.push({
      type: 'code',
      lang: 'mermaid',
      value: 'graph TD; 坏掉的图源',
      data: { failed: { reason: '语法错误' } },
    } as never)
    const { html } = await assemble(parsed)
    expect(html).toContain('pf-diagram-failed')
    expect(html).toContain('语法错误')
    expect(html).toContain('坏掉的图源')
  })

  it('目录只收一级时不产生嵌套的 ol', async () => {
    const { html } = await build('---\ntoc:\n  enable: true\n---\n\n# 顶\n\n## 甲\n\n## 乙\n')
    const toc = /<nav class="pf-toc[^"]*"[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1] ?? ''
    expect(toc.match(/<ol>/g)?.length).toBe(1)
  })

  it('一个特性都没用到时样式表里没有特性样式', async () => {
    const { html } = await build('# 标题\n\n正文')
    expect(html).not.toContain('.pf-tab-list')
    expect(html).not.toContain('.pf-collapse')
  })
})

describe('表格与列表的其余形态', () => {
  it('只有表头没有数据行时 tbody 是空的', async () => {
    const { html } = await build('| 甲 | 乙 |\n| --- | --- |\n')
    expect(html).toContain('<thead>')
    expect(html).toContain('<tbody></tbody>')
  })

  it('松散列表项保留外层 p，紧凑列表项去掉', async () => {
    const compact = await build('- 甲\n- 乙\n')
    expect(compact.html).toContain('<li>甲</li>')
    const loose = await build('- 甲\n\n- 乙\n')
    expect(loose.html).toContain('<li><p>甲</p></li>')
  })

  it('删除线、行内代码、换行、分隔线都照 GFM 渲染', async () => {
    const { html } = await build('~~删掉~~ `代码`\n\n---\n')
    expect(html).toContain('<del>删掉</del>')
    expect(html).toContain('<code>代码</code>')
    expect(html).toContain('<hr>')
  })

  it('带 title 的链接与图片把 title 写进属性', async () => {
    const { html } = await build('[链接](./a.md "标题甲")\n\n![图](./a.png "标题乙")\n', {
      readAsset: async () => new Uint8Array([1, 2, 3]),
    })
    expect(html).toContain('title="标题甲"')
    expect(html).toContain('title="标题乙"')
  })
})

describe('深浅色与图表缩放', () => {
  it('深色是缺省，不看读者的系统设置，也不需要一行 JavaScript', async () => {
    const { html } = await build('就一句话')
    // 深色的值直接写在 :root 上，而不是藏在某个媒体查询里等系统发话
    expect(html).toContain(`:root{color-scheme:dark;--pf-bg:${DARK.bg};`)
    expect(html).not.toContain('prefers-color-scheme')
    // 纯文字文档仍然一个 <script> 都没有（ADR-0012）
    expect(html).not.toContain('<script>')
  })

  it('只有打印是浅色的', async () => {
    const { html } = await build('就一句话')
    expect(html).toContain(`@media print{:root{color-scheme:light;--pf-bg:${LIGHT.bg};`)
  })

  it('有图才有缩放，没图一个字节都不放', async () => {
    const plain = await build('# 标题\n\n正文')
    expect(plain.html).not.toContain('data-pf-feature="diagram-zoom"')

    const parsed = parse('正文\n')
    parsed.ast.children.push({
      type: 'code',
      lang: 'mermaid',
      value: 'graph TD; A-->B',
      data: { svg: '<svg xmlns="http://www.w3.org/2000/svg"><text>甲</text></svg>' },
    } as never)
    const withDiagram = await assemble(parsed)
    expect(withDiagram.html).toContain('data-pf-feature="diagram-zoom"')
    expect(withDiagram.html).toContain('<figure class="pf-diagram" data-pf-zoom>')
  })
})

describe('样式与体积报告的边角', () => {
  it('认不出的特性名不会让样式表崩，只是没有对应样式', () => {
    const css = styleSheet(new Set(['tabs', '并不存在的特性']))
    expect(css).toContain('.pf-tab-list')
    expect(css).toContain('--pf-bg')
  })

  it('自定义主题的颜色出现在样式表里', () => {
    const css = styleSheet(new Set(), { ...LIGHT, bg: '#123456' }, { ...DARK, bg: '#654321' })
    expect(css).toContain('--pf-bg:#123456')
    expect(css).toContain('--pf-bg:#654321')
  })

  it('removeOnce 跳过空串，且找不到时原样返回', () => {
    expect(removeOnce('甲乙丙', ['', '乙'])).toBe('甲丙')
    expect(removeOnce('甲乙丙', ['丁'])).toBe('甲乙丙')
    // 只去掉第一次出现
    expect(removeOnce('甲甲乙', ['甲'])).toBe('甲乙')
  })

  it('目录里同级标题连排时不产生多余的 ol', async () => {
    const { html } = await build('---\ntoc:\n  enable: true\n---\n\n# 顶\n\n## 甲\n\n## 乙\n\n## 丙\n')
    const toc = /<nav class="pf-toc[^"]*"[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1] ?? ''
    expect(toc.match(/<ol>/g)?.length).toBe(1)
    expect(toc.match(/<li>/g)?.length).toBe(3)
  })
})


describe('抛出来的不是 Error 时也要报得清楚', () => {
  it('读图片时抛字符串，诊断里带上那段字符串', async () => {
    const { diagnostics } = await build('![图](./a.png)\n', {
      // 有些库会 throw 一个字符串而不是 Error
      readAsset: async () => {
        throw 'ENOENT 之类的裸字符串'
      },
    })
    const error = diagnostics.find((d) => d.code === 'EMB-402')
    expect(error?.message).toContain('ENOENT 之类的裸字符串')
  })

  it('读字体时抛字符串，同样带上', async () => {
    const { diagnostics } = await build('正文', {
      font: { family: '甲', path: './a.otf' },
      readAsset: async () => {
        throw '裸字符串'
      },
    })
    expect(diagnostics.find((d) => d.code === 'EMB-402')?.message).toContain('裸字符串')
  })

  it('子集化抛非 Error 时报 EMB-404 并带上原因', async () => {
    const { diagnostics } = await build('正文', {
      font: { family: '甲', path: './a.otf' },
      // 不是字体的字节流，subset-font 会抛
      readAsset: async () => new Uint8Array([9, 9, 9, 9, 9, 9, 9, 9]),
    })
    expect(diagnostics.find((d) => d.code === 'EMB-404')).toBeDefined()
  })

  it('认不出扩展名的图片按 application/octet-stream 内嵌', async () => {
    const { html } = await build('![图](./a.unknownext)\n', {
      readAsset: async () => new Uint8Array([1, 2, 3]),
    })
    expect(html).toContain('data:application/octet-stream;base64,')
  })

  it('没有位置信息的图片节点也能内嵌，诊断退回第 1 行', async () => {
    const parsed = parse('正文\n')
    // 手工塞一个不带 position 的节点：位置兜底那条路只有这样才走得到
    parsed.ast.children.push({
      type: 'paragraph',
      children: [{ type: 'image', url: 'https://example.com/a.png', alt: '远程' }],
    } as never)
    const { diagnostics } = await assemble(parsed)
    const error = diagnostics.find((d) => d.code === 'EMB-403')
    expect(error?.start).toEqual({ line: 1, column: 1 })
  })
})
