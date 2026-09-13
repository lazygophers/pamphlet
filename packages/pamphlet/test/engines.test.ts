/**
 * 五个引擎包：真装真渲染。
 *
 * 每个引擎一份最小图源，盯三件事：画得出来、哨兵一个不漏、换不掉的颜色如实报出来。
 * 换色回归的第一道关就在这里——引擎升级后开始吐新的硬编码色，会在 `unmapped`
 * 里冒出来，而不是变成暗色主题下一处看不见的东西。
 *
 * 没装引擎就跳过并打印出来：跳过要看得见，否则它会被当成通过。
 */

import { describe, expect, it } from 'vitest'
import type { Engine } from '../src/diagrams/engine.js'
import { CSS_VARIABLE } from '../src/diagrams/tokens.js'

interface Case {
  name: string
  load: () => Promise<{ createEngine: () => Engine }>
  code: string
  /** 输出里必须出现的东西，用来确认画的是那张图而不是一个空壳 */
  contains: string[]
  /** 换不掉的颜色。空数组 = 一个都不许有 */
  unmapped: string[]
  /** 一段这个引擎真的画不出来的图源。每种语言各有各的写错法 */
  broken: string
}

const CASES: Case[] = [
  {
    name: 'mathjax',
    load: () => import('@nekoleapuki/pamphlet-engine-mathjax'),
    code: 'E = mc^2',
    contains: ['<svg', '<style'],
    // 这三个来自 MathJax 随图发的那份样式表：链接的蓝、错误框的红与黄。
    // 它们是语义色，按约定一视同仁地报出来（见 ADR-0016 的取舍）
    unmapped: ['blue', 'red', 'yellow'],
    // TeX 对没闭合的括号很宽容，真要它认错得用一个不存在的环境
    broken: '\\begin{根本没有这个环境} x \\end{根本没有这个环境}',
  },
  {
    name: 'bytefield',
    load: () => import('@nekoleapuki/pamphlet-engine-bytefield'),
    code: '(draw-column-headers)\n(draw-box "Address" {:span 4})\n(draw-gap "Payload")\n(draw-bottom)',
    contains: ['<svg', 'Address'],
    unmapped: [],
    broken: '(draw-box "没闭合的括号"',
  },
  {
    name: 'vega-lite',
    load: () => import('@nekoleapuki/pamphlet-engine-vega-lite'),
    code: JSON.stringify({
      data: { values: [{ a: 'A', b: 28 }, { a: 'B', b: 55 }] },
      mark: 'bar',
      encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } },
    }),
    contains: ['<svg', '<path'],
    unmapped: [],
    broken: '{ 这不是 JSON }',
  },
  {
    name: 'wavedrom',
    load: () => import('@nekoleapuki/pamphlet-engine-wavedrom'),
    code: '{ signal: [{ name: "clk", wave: "p...." }, { name: "data", wave: "x345x" }] }',
    contains: ['<svg', 'clk'],
    // 语义三色：警告黄、错误红、成功绿。红黄绿在深浅两种主题下本来就该是红黄绿
    unmapped: ['#00ab00', '#f60000', '#f6b900'],
    broken: '{ signal: [ 没闭合',
  },
  {
    name: 'd2',
    load: () => import('@nekoleapuki/pamphlet-engine-d2'),
    code: 'request -> cache: 先查\ncache -> db: 没命中',
    contains: ['<svg', 'cache'],
    unmapped: [],
    broken: 'a -> : 箭头右边什么都没有',
  },
]

for (const entry of CASES) {
  const loaded = await entry.load().then(
    (module) => module,
    () => undefined,
  )
  const probe = loaded === undefined ? undefined : await loaded.createEngine().probe()
  const available = probe?.available === true
  if (!available) {
    process.stderr.write(`跳过 ${entry.name} 引擎测试：没装那个包\n`)
  }

  describe.skipIf(!available)(`${entry.name} 引擎`, () => {
    const engine = (loaded as { createEngine: () => Engine }).createEngine()

    it('画得出图', async () => {
      const result = await engine.renderOne({ code: entry.code, line: 1 })
      if ('code' in result) throw new Error(`渲染失败：${result.message}`)
      for (const needle of entry.contains) expect(result.svg).toContain(needle)
      await engine.dispose?.()
    })

    it('哨兵一个都不许漏到产物里', async () => {
      const result = await engine.renderOne({ code: entry.code, line: 1 })
      if ('code' in result) throw new Error(`渲染失败：${result.message}`)
      // 漏了的话页面上就是一块刺眼的洋红
      expect(result.svg).not.toMatch(/#ff000[1-6]/)
      expect(result.svg).toContain('var(--pf-diagram-')
      await engine.dispose?.()
    })

    it('换不掉的颜色和约定的一样，多一个少一个都要知道', async () => {
      const result = await engine.renderOne({ code: entry.code, line: 1 })
      if ('code' in result) throw new Error(`渲染失败：${result.message}`)
      expect(result.unmapped).toEqual(entry.unmapped)
      await engine.dispose?.()
    })

    it('图源写错时给 DIAG-303，不炸掉进程', async () => {
      const result = await engine.renderOne({ code: entry.broken, line: 9 })
      expect('code' in result ? result.code : undefined).toBe('DIAG-303')
      expect('code' in result ? result.start?.line : undefined).toBe(9)
      await engine.dispose?.()
    })
  })
}

const mathjax = await import('@nekoleapuki/pamphlet-engine-mathjax').catch(() => undefined)

describe('MathJax 的样式表必须随图一起发', () => {
  it.skipIf(mathjax === undefined)('带框的矩阵要靠它才画得对', async () => {
    const engine = (mathjax as { createEngine: () => Engine }).createEngine()
    const result = await engine.renderOne({
      code: '\\begin{array}{|c|c|} \\hline a & b \\\\ \\hline \\end{array}',
      line: 1,
    })
    if ('code' in result) throw new Error(`渲染失败：${result.message}`)
    // 实测：漏掉这段样式表之后，带框矩阵变成一块实心方块把里面的字母整个盖住
    expect(result.svg).toContain('<style')
    expect(result.svg).toContain('mjx-container')
    expect(result.svg).toContain(`var(${CSS_VARIABLE.text}`)
  })
})
