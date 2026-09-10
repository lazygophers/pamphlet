/**
 * 主题包是纯数据，但它跟组装器里那份 token 清单必须**一个字不差**——
 * 两边各写一份、悄悄对不上，是这种「纯数据包」最典型的失效方式。
 */

import { describe, expect, it } from 'vitest'
import { BUILTIN_THEMES, SEMANTIC_TOKENS } from '../src/index.js'
import { LIGHT, DARK } from '@pamphlet/cli'

describe('语义层 token', () => {
  it('跟组装器里的 ThemeTokens 完全一致', () => {
    expect([...SEMANTIC_TOKENS].sort()).toEqual(Object.keys(LIGHT).sort())
  })

  it('亮暗两套定义的 token 名相同——只换值不换键（ADR-0020）', () => {
    expect(Object.keys(DARK).sort()).toEqual(Object.keys(LIGHT).sort())
  })

  it('没有重名', () => {
    expect(new Set(SEMANTIC_TOKENS).size).toBe(SEMANTIC_TOKENS.length)
    expect(new Set(BUILTIN_THEMES).size).toBe(BUILTIN_THEMES.length)
  })
})
