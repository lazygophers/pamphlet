/**
 * 结构化图表指令的骨架解析器。
 *
 * 十七种图共用同一副骨架：**一个声明块加一个关系块**。块关键字按图种变
 * （流程图是 `nodes:` / `edges:`，时序图是 `participants:` / `messages:`），
 * 但「块名一行、条目缩进」这条结构对每一种图都一样——所以解析只写一次。
 *
 * 解析的是**源文档里的原文**，不是 mdast 解析后的节点：指令体会被当成
 * Markdown 解析，两个空格的缩进既不是代码块也不是列表，取回来的文本已经
 * 被折行规则改过一遍。拿原文才能保证「第几行」和作者看到的一致。
 */

import { diagnostic, type Diagnostic, type Point } from '../../diagnostics.js'

/** 块里的一条，带它在源文档里的行号（诊断要指到具体那一行） */
export interface Entry {
  text: string
  line: number
}

export interface StructuredBody {
  /** 块名 → 该块下的条目。块名保持作者写的顺序 */
  blocks: Map<string, Entry[]>
  diagnostics: Diagnostic[]
}

const BLOCK_HEADER = /^([A-Za-z][\w-]*)\s*:\s*$/

/**
 * 把指令体的原文切成若干块。
 *
 * ```text
 * nodes:
 *   request
 *   cache = diamond "in cache?"
 * edges:
 *   request -> cache
 * ```
 *
 * @param body 指令体原文，不含 `:::` 那两行
 * @param firstLine `body` 第一行在源文档里的行号
 */
export function parseStructuredBody(body: string, firstLine: number): StructuredBody {
  const blocks = new Map<string, Entry[]>()
  const diagnostics: Diagnostic[] = []
  let current: Entry[] | undefined

  body.split('\n').forEach((raw, index) => {
    const line = firstLine + index
    const trimmed = raw.trim()
    if (trimmed === '' || trimmed.startsWith('#')) return

    const header = BLOCK_HEADER.exec(trimmed)
    if (header) {
      const name = header[1] as string
      if (blocks.has(name)) {
        diagnostics.push(
          diagnostic('DIAG-305', 'error', `${name} 这个块写了不止一次`, {
            start: { line, column: 1 },
            hint: '同一个块只写一次，条目都放在它下面',
          }),
        )
      }
      current = []
      blocks.set(name, current)
      return
    }

    if (!current) {
      // 条目出现在任何块名之前：作者多半漏了那一行块名
      diagnostics.push(
        diagnostic('DIAG-305', 'error', '这一行不属于任何块', {
          start: { line, column: 1 },
          hint: '先写块名再写条目，例如 nodes: 独占一行，条目缩进写在它下面',
        }),
      )
      return
    }
    current.push({ text: trimmed, line })
  })

  if (blocks.size === 0 && body.trim() !== '') {
    diagnostics.push(
      diagnostic('DIAG-305', 'error', '这张图里一个块都没有', {
        start: { line: firstLine, column: 1 },
        hint: '至少要有一个块名（例如 nodes:），条目缩进写在它下面',
      }),
    )
  }

  return { blocks, diagnostics }
}

/** 取某个块；块不在时给一条指到指令开头的诊断 */
export function requireBlock(
  body: StructuredBody,
  name: string,
  at: Point,
): { entries: Entry[]; diagnostics: Diagnostic[] } {
  const entries = body.blocks.get(name)
  if (entries && entries.length > 0) return { entries, diagnostics: [] }
  return {
    entries: [],
    diagnostics: [
      diagnostic('DIAG-305', 'error', `缺少 ${name} 块`, {
        start: at,
        hint: `写一行 ${name}: ，条目缩进写在它下面`,
      }),
    ],
  }
}

/**
 * 声明行：`名字` 或 `名字 = 形状 "文字"` 或 `名字 = "文字"`。
 *
 * 形状名可省；引号里的文字可省，省了就用名字当文字。
 */
export interface Declaration {
  id: string
  /**
   * 等号后面、引号前面的那个词。叫「形状」是因为流程图里它就是形状，
   * 但每种图各自解释它：架构图当图标名、系统上下文图当角色类型、网络拓扑图当网段名。
   * 解析这一层不判断对错，认不认识由各自的翻译器说了算。
   */
  shape?: string
  text: string
  line: number
}

const QUOTED = /"([^"]*)"\s*$/

export function parseDeclaration(entry: Entry): Declaration {
  const eq = entry.text.indexOf('=')
  if (eq === -1) return { id: entry.text, text: entry.text, line: entry.line }

  const id = entry.text.slice(0, eq).trim()
  const rest = entry.text.slice(eq + 1).trim()
  const quoted = QUOTED.exec(rest)
  if (quoted) {
    const shape = rest.slice(0, quoted.index).trim()
    const text = quoted[1] as string
    return { id, text: text === '' ? id : text, line: entry.line, ...(shape !== '' && { shape }) }
  }
  return { id, text: rest === '' ? id : rest, line: entry.line }
}

/**
 * 关系行：`甲 -> 乙` 或 `甲 -> 乙 : 标签`。
 *
 * 箭头写法按图种可能不同（时序图有虚线回复），所以箭头的正则由调用方给。
 */
export interface Relation {
  from: string
  to: string
  arrow: string
  label?: string
  line: number
}

export function parseRelation(entry: Entry, arrows: readonly string[]): Relation | undefined {
  // 长的箭头先试，否则 `->` 会先匹配掉 `-->` 的后半截
  const sorted = [...arrows].sort((a, b) => b.length - a.length)
  for (const arrow of sorted) {
    const at = entry.text.indexOf(arrow)
    if (at === -1) continue
    const from = entry.text.slice(0, at).trim()
    let rest = entry.text.slice(at + arrow.length).trim()
    let label: string | undefined
    const colon = rest.indexOf(':')
    if (colon !== -1) {
      label = rest.slice(colon + 1).trim()
      rest = rest.slice(0, colon).trim()
    }
    if (from === '' || rest === '') return undefined
    return { from, to: rest, arrow, line: entry.line, ...(label !== undefined && { label }) }
  }
  return undefined
}

/**
 * 把整块关系行读出来；读不成一条关系的那行给诊断（各图种的说法不同，所以文案由调用方给）。
 */
export function parseRelations(
  entries: readonly Entry[],
  arrows: readonly string[],
  message: string,
  hint: string,
): { relations: Relation[]; diagnostics: Diagnostic[] } {
  const relations: Relation[] = []
  const diagnostics: Diagnostic[] = []
  for (const entry of entries) {
    const parsed = parseRelation(entry, arrows)
    if (!parsed) {
      diagnostics.push(
        diagnostic('DIAG-306', 'error', message, { start: { line: entry.line, column: 1 }, hint }),
      )
      continue
    }
    relations.push(parsed)
  }
  return { relations, diagnostics }
}

/** 关系行引用了没声明过的名字——最常见的写错法 */
export function unknownTargets(
  relations: readonly Relation[],
  declared: ReadonlySet<string>,
): Diagnostic[] {
  const out: Diagnostic[] = []
  for (const relation of relations) {
    for (const side of [relation.from, relation.to]) {
      if (declared.has(side)) continue
      out.push(
        diagnostic('DIAG-306', 'error', `连线里的 ${side} 没有声明过`, {
          start: { line: relation.line, column: 1 },
          hint: '先在声明块里写上它，或者检查是不是拼错了',
        }),
      )
    }
  }
  return out
}
