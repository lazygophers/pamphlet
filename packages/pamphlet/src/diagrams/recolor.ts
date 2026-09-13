/**
 * 把渲染出来的颜色换成带兜底值的 CSS 变量（ADR-0016）。
 *
 * 输入既可以是 SVG，也可以是**引擎随图一起发的 CSS**——MathJax 必须把它那份
 * 约 2KB 的样式表一起发出去（漏了 `\begin{array}{|c|}` 会变成一块实心方块盖住数字），
 * 而那份样式表里有 `fill:blue` / `fill:red`。两种输入走同一套规则。
 *
 * 认三种写法：十六进制、`rgb()` / `rgba()`、CSS 具名色。
 */

import { diagnostic, type Diagnostic, type Point } from '../diagnostics.js'
import {
  CSS_NAMED_COLORS,
  CSS_VARIABLE,
  FALLBACK,
  HARDCODED_ALIASES,
  NAMED_COLOR_ALIASES,
  NON_COLOR_KEYWORDS,
  tokenOfSentinel,
  type DiagramToken,
} from './tokens.js'

const HEX = /#[0-9a-fA-F]{3,8}\b/g
/**
 * `href="#000"` 里的 `#000` 是**元素编号**，不是颜色。
 *
 * WaveDrom 把每块波形做成 `<g id="000">`，再用 `<use xlink:href="#000">` 引用。
 * 不排除掉的话，`HEX` 会把这些编号当色值换成 `var(...)`，引用随之失效——
 * 实测 42 个引用毁掉 7 个，那几块波形在图上直接消失。
 */
const HREF = /\b(?:xlink:)?href\s*=\s*(["'])#[^"']*\1/g
/**
 * 具名色只在**颜色的位置**才算数：`fill="red"` 是颜色，正文里的「red」不是。
 * 所以按「颜色属性/属性名 + 分隔符 + 值」整体匹配，不单独去正文里抓单词。
 */
const NAMED = /\b(fill|stroke|color|stop-color|flood-color|lighting-color|background(?:-color)?)(\s*[:=]\s*["']?)([a-zA-Z]+)\b/g
/**
 * 哨兵也可能以 `rgb()` / `rgba()` 的形态出现——Mermaid 的某些图种把颜色算一遍再输出。
 * 只认**原样**的哨兵三元组：调亮调暗过的值落在这里会互相撞车
 * （`#ff0003` 调暗 20% 是 `rgb(204,0,2)`，和 `#ff0002` 分不开），认了反而换错色。
 * 真被算过的那些在源头钉死（见 mermaid.ts 的 pie1..pie12），不靠这里兜。
 */
const RGB = /\brgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)/g

export interface RecolorResult {
  svg: string
  /** 替换掉的处数 */
  replaced: number
  /** 引擎硬编码、且不在已知别名表里的色值 */
  unmapped: string[]
}

export function recolor(input: string): RecolorResult {
  const unmapped = new Set<string>()
  let replaced = 0

  const substitute = (token: DiagramToken): string => {
    replaced += 1
    return `var(${CSS_VARIABLE[token]}, ${FALLBACK[token]})`
  }

  // 先把 href 挖走换成占位，替换完再填回去——比在正则里写否定回顾好读，
  // 也不依赖各 JS 引擎对回顾语法的支持程度
  const hrefs: string[] = []
  const svg = input.replace(HREF, (whole) => {
    hrefs.push(whole)
    return `\u0000href${hrefs.length - 1}\u0000`
  })

  const hexDone = svg.replace(HEX, (hex) => {
    const token: DiagramToken | undefined =
      tokenOfSentinel(hex) ?? HARDCODED_ALIASES[hex.toLowerCase()]
    if (!token) {
      unmapped.add(hex.toLowerCase())
      return hex
    }
    return substitute(token)
  })

  const out = hexDone.replace(RGB, (whole, r: string, g: string, b: string, alpha?: string) => {
    const hex = `#${[r, g, b].map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`
    const sentinel = tokenOfSentinel(hex)

    // 哨兵不管带不带透明度都要换掉——它是我们自己喂进去的主题色，
    // 漏一个就是页面上一块刺眼的洋红。半透明的换成实色：这一层本来就是
    // 引擎自己调的，实色不影响可读性，而 `color-mix` 在老浏览器里会整条失效。
    if (sentinel) return substitute(sentinel)

    // 非哨兵的半透明**留着不动，也不报**：引擎拿它画阴影和高光，
    // 换成实色变量会把一层阴影变成一块实心色；而每次构建都为几处阴影报一条警告，
    // 结果是没有人再看 DIAG-304——那条警告本来是给「暗色下看不见的字」用的
    if (alpha !== undefined && Number(alpha) !== 1) return whole

    const token = HARDCODED_ALIASES[hex]
    if (!token) {
      unmapped.add(whole.toLowerCase())
      return whole
    }
    return substitute(token)
  })

  const named = out.replace(NAMED, (whole, property: string, separator: string, value: string) => {
    const lower = value.toLowerCase()
    if (NON_COLOR_KEYWORDS.has(lower)) return whole
    const token = NAMED_COLOR_ALIASES[lower]
    if (token) return `${property}${separator}${substitute(token)}`
    // 不在 CSS 具名色表里的（`fill:url(#x)` 的 url、`font-family` 的字体名之类）不算颜色
    if (!CSS_NAMED_COLORS.has(lower)) return whole
    unmapped.add(lower)
    return whole
  })

  const restored = named.replace(/\u0000href(\d+)\u0000/g, (_, index: string) => hrefs[Number(index)] ?? '')

  return { svg: restored, replaced, unmapped: [...unmapped].sort() }
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
