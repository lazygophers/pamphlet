/**
 * 外部命令引擎（ADR-0007）：图源走标准输入进、SVG 走标准输出出。
 *
 * 用 `node -e` 当假引擎来测——它一定装着，而且能精确地演出各种失败：
 * 吐非 SVG、退出码非 0、根本跑不起来、跑太久。
 */

import { describe, expect, it } from 'vitest'
import { createCommandEngine } from '../src/diagrams/command.js'
import { parse } from '../src/parse.js'
import { renderDiagrams } from '../src/diagrams/index.js'
import { CSS_VARIABLE } from '../src/diagrams/tokens.js'

/** 一个把 stdin 原样包进 SVG 的假引擎 */
const echoSvg = [
  'node',
  '-e',
  `let s='';process.stdin.on('data',c=>s+=c).on('end',()=>process.stdout.write('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><text fill="#000000">'+s.trim()+'</text></svg>'))`,
]

describe('外部命令引擎', () => {
  const engine = createCommandEngine({
    name: '假引擎',
    langs: ['plantuml'],
    command: echoSvg,
    probe: async () => ({ available: true }) as const,
  })

  it('图源走 stdin 进、SVG 走 stdout 出', async () => {
    const result = await engine.renderOne({ code: '甲到乙', line: 1 })
    if ('code' in result) throw new Error(result.message)
    expect(result.svg).toContain('甲到乙')
  })

  it('外部引擎的输出照样过换色，不搞特殊', async () => {
    const result = await engine.renderOne({ code: 'x', line: 1 })
    if ('code' in result) throw new Error(result.message)
    expect(result.svg).toContain(`var(${CSS_VARIABLE.text}`)
  })

  it('吐的不是 SVG 时说清约定，而不是把垃圾塞进产物', async () => {
    const broken = createCommandEngine({
      name: '假引擎',
      langs: ['plantuml'],
      command: ['node', '-e', 'process.stdout.write("这不是 SVG")'],
      probe: async () => ({ available: true }) as const,
    })
    const result = await broken.renderOne({ code: 'x', line: 3 })
    expect('code' in result ? result.code : undefined).toBe('DIAG-303')
    expect('code' in result ? result.hint : undefined).toContain('标准输入')
  })

  it('命令退出码非 0 时，把它 stderr 的第一行带给作者', async () => {
    const failing = createCommandEngine({
      name: '假引擎',
      langs: ['plantuml'],
      command: ['node', '-e', 'process.stderr.write("第 2 行语法错\\n剩下的很长");process.exit(1)'],
      probe: async () => ({ available: true }) as const,
    })
    const result = await failing.renderOne({ code: 'x', line: 1 })
    expect('code' in result ? result.message : '').toContain('第 2 行语法错')
    expect('code' in result ? result.message : '').not.toContain('剩下的很长')
  })

  it('程序根本不在 PATH 里时给能照做的提示', async () => {
    const absent = createCommandEngine({
      name: '假引擎',
      langs: ['plantuml'],
      command: ['这个程序一定不存在'],
      probe: async () => ({ available: true }) as const,
    })
    const result = await absent.renderOne({ code: 'x', line: 1 })
    expect('code' in result ? result.code : undefined).toBe('DIAG-303')
    expect('code' in result ? result.hint : undefined).toContain('PATH')
  })

  it('跑太久就杀掉——这是我们自己 spawn 的进程，杀得掉', async () => {
    const slow = createCommandEngine({
      name: '假引擎',
      langs: ['plantuml'],
      command: ['node', '-e', 'setTimeout(()=>{}, 60000)'],
      timeoutMs: 120,
      probe: async () => ({ available: true }) as const,
    })
    const result = await slow.renderOne({ code: 'x', line: 1 })
    expect('code' in result ? result.message : '').toContain('120ms')
  })
})

describe('frontmatter 里声明的自定义引擎', () => {
  it('作者自己声明一条命令，那种围栏就画得出来了', async () => {
    const source = [
      '---',
      'engines:',
      '  echo:',
      '    langs: [plantuml]',
      `    command: ${JSON.stringify(echoSvg)}`,
      '---',
      '',
      '# 标题',
      '',
      '```plantuml',
      '甲到乙',
      '```',
      '',
    ].join('\n')
    const parsed = parse(source)
    expect(parsed.diagnostics).toEqual([])

    const report = await renderDiagrams(parsed.ast, {
      ...(parsed.frontmatter.engines === undefined ? {} : { declared: parsed.frontmatter.engines }),
    })
    expect(report.diagnostics.filter((d) => d.severity === 'error')).toEqual([])
    expect(report.rendered + report.cached).toBe(1)
  })
})
