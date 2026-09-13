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
