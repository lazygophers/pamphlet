/**
 * Graphviz 引擎包：真装真渲染。
 *
 * 这是第一个住在独立 npm 包里的引擎，所以这份测试盯的不只是「画得出图」，
 * 还有「引擎住在别的包里也能被主包找到、换色照样生效」。
 *
 * 它需要 `@hpcc-js/wasm-graphviz` 真的装着（WASM 2.1MB，不需要浏览器）。
 * 没装就整份跳过并打印出来——跳过要看得见，否则「跳过」会被当成「通过」。
 */

import { describe, expect, it } from 'vitest'
import { createEngine } from '@nekoleapuki/pamphlet-engine-graphviz'
import { CSS_VARIABLE } from '../src/diagrams/tokens.js'

// 问引擎自己装没装——它的 WASM 是引擎包的依赖，不是主包的，
// 在这里直接 import 那个 WASM 包会解析不到
const probe = await createEngine().probe()
if (!probe.available) {
  process.stderr.write(`跳过 Graphviz 引擎测试：${probe.hint}\n`)
}

describe.skipIf(!probe.available)('Graphviz 引擎', () => {
  const engine = createEngine()

  it('认领 dot 围栏', () => {
    expect(engine.langs).toEqual(['dot'])
    expect(engine.name).toBe('graphviz')
  })

  it('画得出图，颜色全换成主题变量', async () => {
    const [result] = await engine.render([{ code: 'digraph { a -> b [label="次"] }', line: 1 }])
    expect(result).toBeDefined()
    if (!result || 'code' in result) throw new Error('渲染失败')

    expect(result.svg).toContain('<svg')
    expect(result.svg).toContain('a')
    expect(result.svg).toContain(`var(${CSS_VARIABLE.line}`)
    expect(result.svg).toContain(`var(${CSS_VARIABLE.fill}`)
    // 哨兵一个都不许漏到产物里——漏了页面上就是一块刺眼的洋红
    expect(result.svg).not.toMatch(/#ff000[1-6]/)
  })

  it('注入哨兵不改作者写的内容——图源里的注释和花括号照样活着', async () => {
    const code = 'digraph "带 { 花括号 的名字" {\n  // 注释里也有 {\n  甲 -> 乙\n}'
    const [result] = await engine.render([{ code, line: 1 }])
    if (!result || 'code' in result) throw new Error('渲染失败')
    expect(result.svg).toContain('甲')
    expect(result.svg).toContain('乙')
  })

  it('作者自己写的颜色不会被静默丢掉', async () => {
    // 实测踩过：用 setDefault*Attr 那条 API 注入时，图源里只要有 [color=…]，
    // cgraph 就把已存在节点写成 color=""，描边回落成黑色
    const [result] = await engine.render([
      { code: 'digraph { a [color="#123456"]; a -> b }', line: 1 },
    ])
    if (!result || 'code' in result) throw new Error('渲染失败')
    expect(result.svg).toContain('#123456')
  })

  it('未知色名会被 Graphviz 静默变成黑色，所以黑要当红灯报出来', async () => {
    // ADR-0016 写的是「未知色名报 warning」——实测推翻了：WASM 里完全静默，
    // stderr 为空、不抛异常，颜色直接变 #000000。它落在别名表里映到文字色，
    // 所以至少会跟着主题走，不会变成暗色底上看不见的黑字
    const [result] = await engine.render([
      { code: 'digraph { a [fillcolor=nosuchcolor]; a -> b }', line: 1 },
    ])
    if (!result || 'code' in result) throw new Error('渲染失败')
    expect(result.svg).toContain(`var(${CSS_VARIABLE.text}`)
  })

  it('图源写错时给一条 DIAG-303，而不是把整个进程炸掉', async () => {
    const [result] = await engine.render([{ code: 'digraph { a -> }', line: 7 }])
    expect(result && 'code' in result ? result.code : undefined).toBe('DIAG-303')
    expect(result && 'code' in result ? result.start?.line : undefined).toBe(7)
  })

  it('引擎实例复用：连渲多张只加载一次 WASM', async () => {
    const started = Date.now()
    await engine.render([{ code: 'digraph { a -> b }', line: 1 }])
    const first = Date.now() - started
    const second = Date.now()
    await engine.render([{ code: 'digraph { c -> d }', line: 2 }])
    // 第二张不该再付一次 28ms 的 WASM 加载；给足余量只断言「没有更慢一个数量级」
    expect(Date.now() - second).toBeLessThanOrEqual(first + 50)
  })
})
