/**
 * 引擎住在独立的包里，主包怎么找到它。
 *
 * 这一层测的是**发现机制**，不是某个引擎画得好不好：装了就用、没装就给一条
 * 能直接粘贴的安装命令。后者尤其要紧——缺引擎会让整次构建失败，那条提示是
 * 作者唯一的出路。
 */

import { describe, expect, it } from 'vitest'
import { FENCE_LANGUAGES } from '../src/ast.js'
import { parse } from '../src/parse.js'
import { renderDiagrams } from '../src/diagrams/index.js'
import { renderAll } from '../src/diagrams/engine.js'
import {
  ENGINE_PACKAGES,
  installCommand,
  loadEnginePackages,
} from '../src/diagrams/packages.js'

describe('引擎包的发现', () => {
  it('除 mermaid 外，每种围栏语言都指向一个引擎包', () => {
    for (const lang of FENCE_LANGUAGES) {
      if (lang === 'mermaid') {
        expect(ENGINE_PACKAGES[lang], 'mermaid 内置在主包，不该出现在表里').toBeUndefined()
        continue
      }
      expect(ENGINE_PACKAGES[lang], lang).toMatch(/^@nekoleapuki\/pamphlet-engine-/)
    }
  })

  it('装了的引擎包能被加载出来', async () => {
    const { engines, missing } = await loadEnginePackages(['dot'])
    expect(missing).toEqual([])
    expect(engines.map((e) => e.name)).toEqual(['graphviz'])
  })

  it('没装的引擎包不抛错，而是带着安装命令回来', async () => {
    const { engines, missing } = await loadEnginePackages(['plantuml'])
    expect(engines).toEqual([])
    expect(missing).toEqual([
      {
        lang: 'plantuml',
        package: ENGINE_PACKAGES.plantuml,
        install: installCommand(ENGINE_PACKAGES.plantuml as string),
      },
    ])
  })

  it('一次把缺的都说完，不让作者装一个编一次', async () => {
    const { missing } = await loadEnginePackages(['plantuml', 'wavedrom', 'plantuml'])
    expect(missing.map((m) => m.lang)).toEqual(['plantuml', 'wavedrom'])
  })

  it('没用到的语言连 import 都不发生', async () => {
    const { engines, missing } = await loadEnginePackages([])
    expect(engines).toEqual([])
    expect(missing).toEqual([])
  })
})

describe('引擎接口的两层', () => {
  it('只实现基础层的引擎照样能被批量调用', async () => {
    const calls: string[] = []
    const engine = {
      name: '假引擎',
      langs: ['dot'],
      fingerprint: 'x',
      probe: async () => ({ available: true }) as const,
      renderOne: async (request: { code: string; line: number }) => {
        calls.push(request.code)
        return { svg: `<svg>${request.code}</svg>`, unmapped: [] }
      },
    }
    const results = await renderAll(engine, [
      { code: '甲', line: 1 },
      { code: '乙', line: 2 },
    ])
    expect(calls).toEqual(['甲', '乙'])
    expect(results).toHaveLength(2)
  })

  it('实现了批量的引擎走批量那条路，不被逐张拆开', async () => {
    let batched = 0
    const engine = {
      name: '假引擎',
      langs: ['mermaid'],
      fingerprint: 'x',
      probe: async () => ({ available: true }) as const,
      renderOne: async () => ({ svg: '', unmapped: [] }),
      renderBatch: async (requests: { code: string; line: number }[]) => {
        batched += 1
        return requests.map((r) => ({ svg: `<svg>${r.code}</svg>`, unmapped: [] }))
      },
    }
    await renderAll(engine, [
      { code: '甲', line: 1 },
      { code: '乙', line: 2 },
    ])
    expect(batched).toBe(1)
  })

  it('一张都没有时不惊动引擎', async () => {
    const engine = {
      name: '假引擎',
      langs: ['dot'],
      fingerprint: 'x',
      probe: async () => ({ available: true }) as const,
      renderOne: async () => {
        throw new Error('不该被调用')
      },
    }
    expect(await renderAll(engine, [])).toEqual([])
  })
})

describe('缺引擎时作者看到什么', () => {
  it('DIAG-301 的提示里是能直接粘贴的安装命令', async () => {
    const { ast } = parse('# 标题\n\n```plantuml\n@startuml\nA -> B\n@enduml\n```\n')
    const report = await renderDiagrams(ast)
    const missing = report.diagnostics.find((d) => d.code === 'DIAG-301')
    expect(missing?.severity).toBe('error')
    expect(missing?.hint).toContain('npm i -D @nekoleapuki/pamphlet-engine-plantuml')
  })

  it('装了引擎的那种语言照常画出来', async () => {
    const { ast } = parse('# 标题\n\n```dot\ndigraph { a -> b }\n```\n')
    const report = await renderDiagrams(ast)
    expect(report.diagnostics.filter((d) => d.severity === 'error')).toEqual([])
    expect(report.rendered + report.cached).toBe(1)
  })
})
