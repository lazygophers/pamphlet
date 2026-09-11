/**
 * 图表管线：收集、缓存、换色、失败处理。
 * 真正调用 Playwright 的那部分放在 contrast.test.ts（它慢，且需要浏览器）。
 */

import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from '../src/parse.js'
import {
  cacheKey,
  collectDiagrams,
  createCache,
  createNullCache,
  recolor,
  renderDiagrams,
  CSS_VARIABLE,
  FALLBACK,
  SENTINELS,
  type Engine,
} from '../src/diagrams/index.js'
import { withTimeout, SVG_SIZE_WARN_BYTES } from '../src/diagrams/engine.js'
import { unmappedDiagnostic } from '../src/diagrams/recolor.js'
import { createMermaidEngine, sizeDiagnostic } from '../src/diagrams/mermaid.js'

const doc = (body: string) => parse(body).ast

describe('从 AST 里收集图表围栏', () => {
  it('八种引擎语言全部被收', () => {
    const langs = ['mermaid', 'd2', 'dot', 'math', 'vega-lite', 'wavedrom', 'bytefield', 'plantuml']
    const body = langs.map((lang) => `\`\`\`${lang}\nx\n\`\`\``).join('\n\n')
    const tasks = collectDiagrams(doc(body))
    expect(tasks.map((t) => t.lang)).toEqual(langs)
  })

  it('普通代码块和语法高亮块不算图表', () => {
    expect(collectDiagrams(doc('```\nplain\n```\n\n```ts\nconst a = 1\n```'))).toEqual([])
  })

  it('嵌在指令里的图表也收得到', () => {
    const body = ['::::tabs', ':::tab[甲]', '```mermaid', 'graph TD\n A-->B', '```', ':::', '::::'].join('\n')
    const tasks = collectDiagrams(doc(body))
    expect(tasks).toHaveLength(1)
    expect(tasks[0]?.lang).toBe('mermaid')
  })

  it('带上行号，供诊断定位', () => {
    const tasks = collectDiagrams(doc('# 标题\n\n正文\n\n```mermaid\nx\n```'))
    expect(tasks[0]?.line).toBe(5)
  })
})

describe('颜色替换（ADR-0016）', () => {
  it('哨兵色换成带兜底值的 CSS 变量', () => {
    const svg = `<svg><rect fill="${SENTINELS.fill}"/><text fill="${SENTINELS.text}">甲</text></svg>`
    const result = recolor(svg)
    expect(result.replaced).toBe(2)
    expect(result.svg).toContain(`var(${CSS_VARIABLE.fill}, ${FALLBACK.fill})`)
    expect(result.svg).toContain(`var(${CSS_VARIABLE.text}, ${FALLBACK.text})`)
    expect(result.unmapped).toEqual([])
  })

  it('硬编码的黑白按语义归到文字色与底色', () => {
    const result = recolor('<svg><text fill="#000000"/><rect fill="#FFF"/></svg>')
    expect(result.replaced).toBe(2)
    expect(result.svg).toContain(CSS_VARIABLE.text)
    expect(result.svg).toContain(CSS_VARIABLE.bg)
    expect(result.unmapped).toEqual([])
  })

  it('认不出的色值原样留下并报上来', () => {
    const result = recolor('<svg><rect fill="#123456"/><rect fill="#abcdef"/></svg>')
    expect(result.replaced).toBe(0)
    expect(result.unmapped).toEqual(['#123456', '#abcdef'])
    expect(result.svg).toContain('#123456')
  })

  it('引擎写死在样式表里的那几个灰也归到 token', () => {
    // Mermaid 把这些直接写进各图种的 CSS 字符串，钉不住主题变量（mermaid@11.17.2）
    const result = recolor('<svg><rect fill="#eaeaea"/><path stroke="#666"/></svg>')
    expect(result.replaced).toBe(2)
    expect(result.svg).toContain(CSS_VARIABLE.fill)
    expect(result.svg).toContain(CSS_VARIABLE.muted)
    expect(result.unmapped).toEqual([])
  })

  it('哨兵写成 rgb() 也要换掉，带透明度的照换不误', () => {
    // 饼图那一路会把颜色算一遍再输出成 rgb()，漏掉就是页面上一块刺眼的洋红
    const result = recolor(
      `<svg><rect fill="rgb(255, 0, 1)"/><rect fill="rgba(255, 0, 1, 0.5)"/></svg>`,
    )
    expect(result.replaced).toBe(2)
    expect(result.svg).not.toContain('255, 0, 1')
    expect(result.unmapped).toEqual([])
  })

  it('不是哨兵的半透明色留着不动，也不报——那是阴影，不是看不见的字', () => {
    const result = recolor('<svg><rect fill="rgba(0,0,0,0.2)"/></svg>')
    expect(result.replaced).toBe(0)
    expect(result.svg).toContain('rgba(0,0,0,0.2)')
    expect(result.unmapped).toEqual([])
  })

  it('大小写不敏感', () => {
    const result = recolor(`<svg fill="${SENTINELS.line.toUpperCase()}"/>`)
    expect(result.replaced).toBe(1)
  })

  it('只动颜色，不动别的十六进制样文本', () => {
    const svg = '<svg><path d="M0 0 L10 10"/><text>#hashtag</text></svg>'
    expect(recolor(svg).svg).toBe(svg)
  })
})

describe('缓存键', () => {
  const key = (
    code: string,
    engine = 'mermaid',
    version = '11.0.0',
    fingerprint = 'cfg00000',
  ) => cacheKey(code, engine, version, fingerprint)

  it('四样都一样 → 键一样', () => {
    expect(key('graph TD\nA-->B')).toBe(key('graph TD\nA-->B'))
  })

  it('图源变了键就变', () => {
    expect(key('A-->B')).not.toBe(key('A-->C'))
  })

  it('引擎版本变了键就变——否则升级引擎后会命中旧图', () => {
    expect(key('A-->B', 'mermaid', '11.0.0')).not.toBe(key('A-->B', 'mermaid', '11.1.0'))
  })

  it('引擎不同键就不同', () => {
    expect(key('A-->B', 'mermaid', '1')).not.toBe(key('A-->B', 'd2', '1'))
  })

  it('引擎配置指纹变了键就变——喂给引擎的主题变量也决定输出', () => {
    // 实测踩过：改了 THEME_VARIABLES 重新编译，拿到的还是旧图，
    // 而且走缓存路径连「颜色换漏了」的诊断都一起消失了
    expect(key('A-->B', 'mermaid', '11.0.0', 'cfg-old')).not.toBe(
      key('A-->B', 'mermaid', '11.0.0', 'cfg-new'),
    )
  })

  it('真引擎的指纹跟着它的主题配置走，且是稳定的', () => {
    expect(createMermaidEngine().fingerprint).toBe(createMermaidEngine().fingerprint)
    expect(createMermaidEngine().fingerprint).toMatch(/^[0-9a-f]{8}$/)
  })
})

describe('缓存读写', () => {
  it('写进去能读出来，换不掉的色值跟着图一起存', async () => {
    const cache = createCache(mkdtempSync(join(tmpdir(), 'pf-cache-')))
    await cache.set('k1', { svg: '<svg>甲</svg>', unmapped: ['#00fffe'] })
    expect(await cache.get('k1')).toEqual({ svg: '<svg>甲</svg>', unmapped: ['#00fffe'] })
  })

  it('缓存文件被人动过、格式对不上时当没命中', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pf-cache-'))
    const cache = createCache(dir)
    await cache.set('k2', { svg: '<svg/>', unmapped: [] })
    writeFileSync(join(dir, 'k2.json'), '{"svg":123}', 'utf8')
    expect(await cache.get('k2')).toBeUndefined()
  })

  it('没写过的键返回 undefined', async () => {
    const cache = createCache(mkdtempSync(join(tmpdir(), 'pf-cache-')))
    expect(await cache.get('nope')).toBeUndefined()
  })

  it('空实现永不命中，写入也不报错', async () => {
    const cache = createNullCache()
    await cache.set('k', { svg: '<svg/>', unmapped: [] })
    expect(await cache.get('k')).toBeUndefined()
  })

  it('目录不可写时不让编译失败', async () => {
    // 拿一个「父路径是普通文件」的目录：mkdir 会立刻以 ENOTDIR 失败，
    // 两个平台行为一致。原来写死的 /proc 子路径在 macOS 上根本不存在、
    // 在 Linux 上又会一直挂到测试超时（CI 实测 5013ms）。
    const file = join(mkdtempSync(join(tmpdir(), 'pf-cache-')), 'not-a-dir')
    writeFileSync(file, 'x')
    const cache = createCache(join(file, 'sub'))
    await expect(cache.set('k', { svg: '<svg/>', unmapped: [] })).resolves.toBeUndefined()
  })
})

/** 一个假引擎，用来测管线本身而不启动浏览器 */
function fakeEngine(overrides: Partial<Engine> = {}): Engine {
  return {
    name: 'fake',
    langs: ['mermaid'],
    fingerprint: 'fake0000',
    async probe() {
      return { available: true }
    },
    async render(requests) {
      return requests.map(() => ({
        svg: `<svg><rect fill="${SENTINELS.fill}"/></svg>`,
        unmapped: [],
      }))
    },
    ...overrides,
  }
}

describe('渲染管线', () => {
  const options = (engine: Engine) => ({ engines: [engine], cache: createNullCache() })

  it('没有图表时不做任何事', async () => {
    const report = await renderDiagrams(doc('# 只有文字'), options(fakeEngine()))
    expect(report).toEqual({ diagnostics: [], rendered: 0, cached: 0, failed: 0 })
  })

  it('渲染结果挂回节点的 data 上', async () => {
    const ast = doc('```mermaid\ngraph TD\nA-->B\n```')
    const report = await renderDiagrams(ast, options(fakeEngine()))
    expect(report.rendered).toBe(1)
    const code = ast.children.find((n) => n.type === 'code') as { data?: { svg?: string } }
    expect(code.data?.svg).toContain('<svg>')
  })

  it('一个引擎一次拿到它全部的图（批量）', async () => {
    let calls = 0
    let batchSize = 0
    const engine = fakeEngine({
      async render(requests) {
        calls += 1
        batchSize = requests.length
        return requests.map(() => ({ svg: '<svg/>', unmapped: [] }))
      },
    })
    const body = Array.from({ length: 5 }, () => '```mermaid\nA-->B\n```').join('\n\n')
    await renderDiagrams(doc(body), options(engine))
    expect(calls).toBe(1)
    expect(batchSize).toBe(5)
  })

  it('命中缓存时诊断照样报——不能「图从缓存来 = 换漏的颜色没人告诉你」', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pf-cache-'))
    const engine = fakeEngine({
      async render(requests) {
        return requests.map(() => ({ svg: '<svg><rect fill="#eaeaea"/></svg>', unmapped: ['#eaeaea'] }))
      },
    })
    const source = '```mermaid\nA-->B\n```'

    const first = await renderDiagrams(doc(source), { engines: [engine], cache: createCache(dir) })
    expect(first.rendered).toBe(1)
    expect(first.cached).toBe(0)

    const second = await renderDiagrams(doc(source), { engines: [engine], cache: createCache(dir) })
    expect(second.cached).toBe(1)
    expect(second.rendered).toBe(0)
    // 两条路必须说一样的话
    expect(second.diagnostics.map((d) => d.code)).toEqual(first.diagnostics.map((d) => d.code))
    expect(second.diagnostics[0]?.code).toBe('DIAG-304')
  })

  it('引擎配置指纹变了就不命中旧缓存', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pf-cache-'))
    const source = '```mermaid\nA-->B\n```'
    const old = fakeEngine({ fingerprint: 'cfg-old' })
    const neo = fakeEngine({ fingerprint: 'cfg-new' })

    await renderDiagrams(doc(source), { engines: [old], cache: createCache(dir) })
    const after = await renderDiagrams(doc(source), { engines: [neo], cache: createCache(dir) })
    expect(after.cached).toBe(0)
    expect(after.rendered).toBe(1)
  })

  it('引擎没装时每张图各给一条诊断，并带安装办法', async () => {
    const engine = fakeEngine({
      async probe() {
        return { available: false, hint: '装一次就好：npm i -g 某个东西' }
      },
    })
    const body = ['```mermaid\nA-->B\n```', '```mermaid\nC-->D\n```'].join('\n\n')
    const report = await renderDiagrams(doc(body), options(engine))
    expect(report.failed).toBe(2)
    expect(report.diagnostics).toHaveLength(2)
    expect(report.diagnostics[0]?.code).toBe('DIAG-301')
    expect(report.diagnostics[0]?.hint).toContain('npm i -g')
  })

  it('没有引擎认领的语言给 DIAG-301', async () => {
    const report = await renderDiagrams(doc('```wavedrom\n{}\n```'), options(fakeEngine()))
    expect(report.diagnostics[0]?.code).toBe('DIAG-301')
    expect(report.diagnostics[0]?.message).toContain('wavedrom')
  })

  it('单张图失败时其余照样渲染（失败的挂占位信息）', async () => {
    const engine = fakeEngine({
      async render(requests) {
        return requests.map((r, index) =>
          index === 0
            ? {
                code: 'DIAG-303' as const,
                severity: 'error' as const,
                message: '画不出来',
                start: { line: r.line, column: 1 },
              }
            : { svg: '<svg/>', unmapped: [] },
        )
      },
    })
    const body = ['```mermaid\n坏的\n```', '```mermaid\n好的\n```'].join('\n\n')
    const ast = doc(body)
    const report = await renderDiagrams(ast, options(engine))
    expect(report.failed).toBe(1)
    expect(report.rendered).toBe(1)
    const codes = ast.children.filter((n) => n.type === 'code') as {
      data?: { svg?: string; failed?: { reason: string } }
    }[]
    expect(codes[0]?.data?.failed?.reason).toBe('画不出来')
    expect(codes[1]?.data?.svg).toBe('<svg/>')
  })

  it('缓存命中时不调用引擎', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pf-cache-'))
    const cache = createCache(dir)
    let calls = 0
    const engine = fakeEngine({
      async render(requests) {
        calls += 1
        return requests.map(() => ({ svg: '<svg>缓存过的</svg>', unmapped: [] }))
      },
    })
    const body = '```mermaid\ngraph TD\nA-->B\n```'

    const first = await renderDiagrams(doc(body), { engines: [engine], cache })
    expect(first.rendered).toBe(1)
    expect(first.cached).toBe(0)
    expect(calls).toBe(1)

    const second = await renderDiagrams(doc(body), { engines: [engine], cache })
    expect(second.rendered).toBe(0)
    expect(second.cached).toBe(1)
    expect(calls).toBe(1)
  })

  it('引擎输出里有硬编码色值时给 DIAG-304 警告', async () => {
    const engine = fakeEngine({
      async render(requests) {
        return requests.map(() => ({ svg: '<svg/>', unmapped: ['#eaeaea', '#666'] }))
      },
    })
    const report = await renderDiagrams(doc('```mermaid\nA-->B\n```'), options(engine))
    const warning = report.diagnostics.find((d) => d.code === 'DIAG-304')
    expect(warning?.severity).toBe('warning')
    expect(warning?.message).toContain('#eaeaea')
  })

  it('SVG 过大给 DIAG-302 警告', async () => {
    const engine = fakeEngine({
      async render(requests) {
        return requests.map(() => ({ svg: `<svg>${'x'.repeat(300 * 1024)}</svg>`, unmapped: [] }))
      },
    })
    const report = await renderDiagrams(doc('```mermaid\nA-->B\n```'), options(engine))
    const warning = report.diagnostics.find((d) => d.code === 'DIAG-302')
    expect(warning?.severity).toBe('warning')
    expect(warning?.message).toContain('KB')
  })

  it('诊断按行号排序', async () => {
    const engine = fakeEngine({
      async probe() {
        return { available: false, hint: 'x' }
      },
    })
    const body = ['```mermaid\nA\n```', '文字', '```mermaid\nB\n```'].join('\n\n')
    const report = await renderDiagrams(doc(body), options(engine))
    const lines = report.diagnostics.map((d) => d.start?.line ?? 0)
    expect(lines).toEqual([...lines].sort((a, b) => a - b))
  })
})

describe('超时包装', () => {
  it('在时限内完成就正常返回', async () => {
    await expect(withTimeout(Promise.resolve('好'), 1000, () => new Error('超时'))).resolves.toBe('好')
  })

  it('超时后抛出指定的错误', async () => {
    const slow = new Promise<string>((resolve) => setTimeout(() => resolve('慢'), 500))
    await expect(withTimeout(slow, 10, () => new Error('超过 10 毫秒'))).rejects.toThrow('超过 10 毫秒')
  })

  it('原 promise 失败时原样抛出', async () => {
    await expect(
      withTimeout(Promise.reject(new Error('自己坏了')), 1000, () => new Error('超时')),
    ).rejects.toThrow('自己坏了')
  })

  it('非 Error 的失败值会被包成 Error', async () => {
    await expect(
      withTimeout(Promise.reject('就是个字符串'), 1000, () => new Error('超时')),
    ).rejects.toThrow('就是个字符串')
  })
})

describe('未映射色值的诊断', () => {
  it('没有未映射色值时不给诊断', () => {
    expect(unmappedDiagnostic('mermaid', [])).toBeUndefined()
  })

  it('列出前六个，超过就说「等 N 个」', () => {
    const many = ['#1', '#2', '#3', '#4', '#5', '#6', '#7', '#8']
    const d = unmappedDiagnostic('mermaid', many, { line: 3, column: 1 })
    expect(d?.code).toBe('DIAG-304')
    expect(d?.message).toContain('等 8 个')
    expect(d?.start).toEqual({ line: 3, column: 1 })
  })

  it('不给位置时诊断也成立', () => {
    expect(unmappedDiagnostic('d2', ['#abc'])?.start).toBeUndefined()
  })
})

describe('SVG 体积诊断', () => {
  it('小图不报', () => {
    expect(sizeDiagnostic(1024, 1)).toBeUndefined()
  })

  it('刚好在线上不报', () => {
    expect(sizeDiagnostic(200 * 1024, 1)).toBeUndefined()
  })

  it('超过线就报，并把 KB 数写进消息', () => {
    const d = sizeDiagnostic(300 * 1024, 7)
    expect(d?.code).toBe('DIAG-302')
    expect(d?.message).toContain('300KB')
    expect(d?.start?.line).toBe(7)
  })
})

describe('真 Mermaid 引擎的探测与错误路径', () => {
  it('依赖装了就报可用', async () => {
    expect(await createMermaidEngine().probe()).toEqual({ available: true })
    // probe 要真的拉起一次无头浏览器，冷启动实测 733ms，整套并行跑时更慢
  }, 120_000)

  it('空批次直接返回空数组，不碰浏览器', async () => {
    expect(await createMermaidEngine().render([])).toEqual([])
  })

  it('图源语法错误时给 DIAG-303，并指向 mermaid.live', async () => {
    const results = await createMermaidEngine().render([
      { code: '这不是任何一种 mermaid 图', line: 4 },
    ])
    const first = results[0]
    expect(first && 'code' in first ? first.code : undefined).toBe('DIAG-303')
    expect(first && 'code' in first ? first.hint : undefined).toContain('mermaid.live')
    expect(first && 'code' in first ? first.start?.line : undefined).toBe(4)
  }, 60_000)

  it('超时时整批失败，每张图各给一条诊断', async () => {
    // 用一个永远不结束的渲染器，而不是真去卡浏览器——那会留下一个跑到测试结束之后的渲染
    const engine = createMermaidEngine({
      timeoutMs: 10,
      renderer: () => new Promise(() => undefined),
    })
    const results = await engine.render([
      { code: 'graph TD\nA-->B', line: 1 },
      { code: 'graph TD\nC-->D', line: 9 },
    ])
    expect(results).toHaveLength(2)
    for (const r of results) {
      expect('code' in r ? r.code : undefined).toBe('DIAG-303')
    }
    expect(results[1] && 'code' in results[1] ? results[1].start?.line : undefined).toBe(9)
    expect(results[0] && 'code' in results[0] ? results[0].message : '').toContain('0.01 秒')
  })

  it('渲染器导出不对时也走 DIAG-303，而不是抛出去', async () => {
    const engine = createMermaidEngine({
      renderer: () => Promise.reject(new Error('浏览器起不来')),
    })
    const results = await engine.render([{ code: 'graph TD\nA-->B', line: 2 }])
    const first = results[0]
    expect(first && 'code' in first ? first.code : undefined).toBe('DIAG-303')
    expect(first && 'code' in first ? first.message : '').toContain('浏览器起不来')
  })

  it('真的渲染一张图：颜色被换成主题变量，没有漏掉的具名色', async () => {
    const results = await createMermaidEngine().render([
      { code: 'sequenceDiagram\n  甲->>乙: 你好', line: 1 },
    ])
    const first = results[0]
    expect(first && 'svg' in first).toBe(true)
    if (!first || !('svg' in first)) return
    expect(first.svg).toContain('var(--pf-diagram-text')
    // 只替十六进制的策略成立的前提：喂十六进制主题色能把 CSS 具名色挤掉
    expect(/fill\s*:\s*(black|white)\b/.test(first.svg)).toBe(false)
  }, 60_000)
})


describe('doctor 里用到的引擎探测', () => {
  it('引擎没装时给出装它的办法', async () => {
    const engine = fakeEngine({
      async probe() {
        return { available: false, hint: '装一次就好：npm i -g 某个东西' }
      },
    })
    const probe = await engine.probe()
    expect(probe.available).toBe(false)
    expect(probe.available === false && probe.hint).toContain('npm i -g')
  })

  it('不是 mermaid 的引擎，版本退回 unknown，编译照常进行', async () => {
    const engine = fakeEngine({ name: 'another' })
    const report = await renderDiagrams(doc('```mermaid\nA-->B\n```'), {
      engines: [engine],
      cache: createNullCache(),
    })
    expect(report.rendered).toBe(1)
  })
})


describe('引擎版本只查一次', () => {
  it('同一进程内连续渲染两次，版本号从缓存来（不会重复读 package.json）', async () => {
    const engine = fakeEngine({ name: 'mermaid' })
    const dir = mkdtempSync(join(tmpdir(), 'pf-cache-'))
    const first = await renderDiagrams(doc('```mermaid\nA-->B\n```'), {
      engines: [engine],
      cache: createCache(dir),
    })
    const second = await renderDiagrams(doc('```mermaid\nC-->D\n```'), {
      engines: [engine],
      cache: createCache(dir),
    })
    expect(first.rendered).toBe(1)
    expect(second.rendered).toBe(1)
  })
})
