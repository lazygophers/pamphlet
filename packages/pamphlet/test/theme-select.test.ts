/**
 * 主题选择：CLI 参数 > frontmatter > 缺省（ADR-0046）。
 *
 * 这里还顺带钉住「主题包里的 token 名和组装器里的 ThemeTokens 一个字不差」——
 * 两边各写一份、悄悄对不上，是这种「纯数据包」最典型的失效方式。
 */

import { describe, expect, it } from 'vitest'
import { SEMANTIC_TOKENS, THEMES, BUILTIN_THEMES } from '@nekoleapuki/pamphlet-themes'
import { selectTheme } from '../src/theme-select.js'
import { LIGHT, DARK } from '../src/assemble/theme.js'

describe('token 清单两边一致', () => {
  it('主题包的 SEMANTIC_TOKENS 跟组装器的 ThemeTokens 相同', () => {
    expect([...SEMANTIC_TOKENS].sort()).toEqual(Object.keys(LIGHT).sort())
  })

  it('亮暗只换值不换键（ADR-0020）', () => {
    expect(Object.keys(DARK).sort()).toEqual(Object.keys(LIGHT).sort())
  })

  it('每一套内置主题的两份配色都是完整的 18 个 token', () => {
    for (const name of BUILTIN_THEMES) {
      const theme = THEMES[name]
      expect(Object.keys(theme.light).sort(), `${name} 的亮色`).toEqual([...SEMANTIC_TOKENS].sort())
      expect(Object.keys(theme.dark).sort(), `${name} 的暗色`).toEqual([...SEMANTIC_TOKENS].sort())
    }
  })

  // 说明是诊断和文档站共用的那一份数据（ADR-0047）。少一句，
  // 英文站上就会出现一个空格子，而那种缺失没人会去逐行核对
  it('每一套主题的中英说明都在，且不是同一句', () => {
    for (const name of BUILTIN_THEMES) {
      const theme = THEMES[name]
      expect(theme.purpose.zh.length, `${name} 的中文说明`).toBeGreaterThan(0)
      expect(theme.purpose.en.length, `${name} 的英文说明`).toBeGreaterThan(0)
      expect(theme.purpose.en, `${name} 的英文说明不该是中文那句`).not.toBe(theme.purpose.zh)
    }
  })
})

describe('选哪一套', () => {
  it('都不指定时用 default', () => {
    const result = selectTheme({})
    expect(result.theme.name).toBe('default')
    expect(result.diagnostics).toEqual([])
  })

  it('frontmatter 指定了就用它', () => {
    expect(selectTheme({ frontmatter: 'fiction' }).theme.name).toBe('fiction')
  })

  it('CLI 覆盖 frontmatter', () => {
    expect(selectTheme({ cli: 'incident', frontmatter: 'fiction' }).theme.name).toBe('incident')
  })

  it('名字不认识时报 DOC-106 并退回 default', () => {
    const result = selectTheme({ frontmatter: '不存在的主题' })
    expect(result.theme.name).toBe('default')
    expect(result.diagnostics.map((d) => d.code)).toEqual(['DOC-106'])
    expect(result.diagnostics[0]?.severity).toBe('error')
    // 提示里要把能用的名字列全，否则作者只知道错了不知道该写什么
    for (const name of BUILTIN_THEMES) expect(result.diagnostics[0]?.hint).toContain(name)
  })

  // 光有名字，作者还是得去翻文档才知道该挑哪个（ADR-0047）
  it('提示里每个名字后面跟着它那一句说明，一套一行', () => {
    const hint = selectTheme({ cli: 'zzz' }).diagnostics[0]!.hint!
    for (const name of BUILTIN_THEMES) {
      const line = hint.split('\n').find((row) => row.trimStart().startsWith(name))
      expect(line, `${name} 应该独占一行`).toBeDefined()
      expect(line).toContain(THEMES[name].purpose.zh)
    }
    // 一行标题 + 一套一行
    expect(hint.split('\n')).toHaveLength(BUILTIN_THEMES.length + 1)
  })

  it('CLI 传了不认识的名字同样报错', () => {
    expect(selectTheme({ cli: 'zzz' }).diagnostics.map((d) => d.code)).toEqual(['DOC-106'])
  })
})
