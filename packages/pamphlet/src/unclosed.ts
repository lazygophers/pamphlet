/**
 * 未闭合指令检测（ADR-0035）。
 *
 * 为什么要自己扫一遍源文本：解析器在文档末尾会静默地把没闭合的容器补上，
 * 而 ADR-0013 定了 Tab 用嵌套（外层更多冒号），嵌套之后「自动闭合」是一次猜测——
 * 猜错会产出结构和作者意图不同的文档，且不报错。所以这里在解析之前先判定。
 */

import { diagnostic, type Diagnostic } from './diagnostics.js'

interface OpenFence {
  colons: number
  name: string
  line: number
  column: number
}

const DIRECTIVE_FENCE = /^(\s{0,3})(:{3,})(.*)$/
const CODE_FENCE = /^(\s{0,3})(`{3,}|~{3,})(.*)$/

/**
 * 返回所有未闭合的容器指令。位置指向**开启**那一行——
 * 「文档末尾发现未闭合」对一份有二十个指令的文档毫无帮助。
 */
export function findUnclosedDirectives(source: string): Diagnostic[] {
  const lines = source.split('\n')
  const stack: OpenFence[] = []
  /** 已经确定关不上的：闭合栅栏跨过它、把它的外层先关掉了 */
  const unclosed: OpenFence[] = []
  let codeFence: { marker: string; length: number } | undefined

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? ''

    const code = CODE_FENCE.exec(line)
    if (code) {
      const marker = (code[2] ?? '')[0] ?? '`'
      const length = (code[2] ?? '').length
      const info = (code[3] ?? '').trim()
      if (codeFence === undefined) {
        codeFence = { marker, length }
        continue
      }
      // 闭合围栏：同种记号、不短于开启的、且后面没有语言标记
      if (codeFence.marker === marker && length >= codeFence.length && info === '') {
        codeFence = undefined
        continue
      }
    }
    // 代码块里的 ::: 是内容，不是指令
    if (codeFence !== undefined) continue

    const match = DIRECTIVE_FENCE.exec(line)
    if (!match) continue

    const indent = (match[1] ?? '').length
    const colons = (match[2] ?? '').length
    const rest = (match[3] ?? '').trim()

    if (rest === '') {
      // 闭合栅栏优先关掉冒号数完全相同的那一层；找不到才退而关最内层冒号数不多于它的。
      // 关掉一层时，它里面还开着的都永远关不上了——那才是作者真正漏写的那个。
      let target = -1
      for (let i = stack.length - 1; i >= 0; i -= 1) {
        if (stack[i]?.colons === colons) { target = i; break }
      }
      if (target === -1) {
        for (let i = stack.length - 1; i >= 0; i -= 1) {
          if ((stack[i]?.colons ?? Number.POSITIVE_INFINITY) <= colons) { target = i; break }
        }
      }
      if (target !== -1) {
        unclosed.push(...stack.splice(target + 1).reverse())
        stack.splice(target, 1)
      }
      continue
    }

    const name = /^[A-Za-z0-9][A-Za-z0-9_-]*/.exec(rest)?.[0] ?? ''
    stack.push({ colons, name, line: index + 1, column: indent + 1 })
  }

  return [...unclosed, ...stack]
    .sort((a, b) => a.line - b.line)
    .map((open) =>
    diagnostic('DIR-203', 'error', `指令 :::${open.name} 没有闭合`, {
      start: { line: open.line, column: open.column },
      end: { line: open.line, column: open.column + open.colons + open.name.length },
      hint: `在它的内容之后补一行 ${':'.repeat(open.colons)}（闭合的冒号数要不少于开启的）`,
    }),
  )
}
