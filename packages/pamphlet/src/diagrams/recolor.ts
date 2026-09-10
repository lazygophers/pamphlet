/**
 * 把渲染出来的 SVG 里的颜色换成带兜底值的 CSS 变量（ADR-0016）。
 * 只处理十六进制写法——哨兵机制保证引擎输出里的颜色都是十六进制（见 tokens.ts）。
 */

import { diagnostic, type Diagnostic, type Point } from '../diagnostics.js'
import {
  CSS_VARIABLE,
  FALLBACK,
  HARDCODED_ALIASES,
  tokenOfSentinel,
  type DiagramToken,
} from './tokens.js'

const HEX = /#[0-9a-fA-F]{3,8}\b/g

export interface RecolorResult {
  svg: string
  /** 替换掉的处数 */
  replaced: number
  /** 引擎硬编码、且不在已知别名表里的色值 */
  unmapped: string[]
}

export function recolor(svg: string): RecolorResult {
  const unmapped = new Set<string>()
  let replaced = 0

  const out = svg.replace(HEX, (hex) => {
    const token: DiagramToken | undefined =
      tokenOfSentinel(hex) ?? HARDCODED_ALIASES[hex.toLowerCase()]
    if (!token) {
      unmapped.add(hex.toLowerCase())
      return hex
    }
    replaced += 1
    return `var(${CSS_VARIABLE[token]}, ${FALLBACK[token]})`
  })

  return { svg: out, replaced, unmapped: [...unmapped].sort() }
}

/**
 * 未映射的色值给一条警告。
 *
 * 这条警告是 ADR-0016 里「替换规则会随引擎升级静默失效」的解药：
 * 引擎某次升级引入了新的硬编码色，它会在这里冒出来，而不是变成暗色主题下
 * 一处看不见的文字。
 */
export function unmappedDiagnostic(
  engine: string,
  unmapped: string[],
  at?: Point,
): Diagnostic | undefined {
  if (unmapped.length === 0) return undefined
  const shown = unmapped.slice(0, 6).join(' ')
  const more = unmapped.length > 6 ? ` 等 ${unmapped.length} 个` : ''
  return diagnostic(
    'DIAG-304',
    'warning',
    `${engine} 输出里有 ${unmapped.length} 个硬编码色值没能换成主题变量：${shown}${more}`,
    {
      ...(at ? { start: at } : {}),
      hint: '这些颜色不会跟着主题变；切到暗色主题时留意这张图有没有看不清的地方',
    },
  )
}
