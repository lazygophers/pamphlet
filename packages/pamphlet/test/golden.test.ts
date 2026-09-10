/**
 * golden 快照：把正确的输出存成基准文件，以后每次改动自动比对。
 * 这一层第一天就要建（编译器一旦没有它，每次改解析器都是赌博）。
 *
 * 现在还没有 HTML 输出，所以快照分两段各存一份（ADR-0032 的分段思路）：
 *   1. 诊断（人类可读文本）——改诊断文案时只有这一段变
 *   2. AST 结构轮廓 + frontmatter——改解析器时只有这一段变
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from '../src/parse.js'
import { formatDiagnostic } from '../src/diagnostics.js'

const FIXTURES = join(import.meta.dirname, 'fixtures')
const files = readdirSync(FIXTURES).filter((name) => name.endsWith('.md')).sort()

/** 只留结构：节点类型的嵌套轮廓，不留正文内容 */
function outline(node: unknown, depth = 0): string[] {
  if (typeof node !== 'object' || node === null) return []
  const record = node as Record<string, unknown>
  const type = typeof record.type === 'string' ? record.type : undefined
  const rows: string[] = []
  if (type) {
    const extra: string[] = []
    if (typeof record.name === 'string') extra.push(`name=${record.name}`)
    if (typeof record.lang === 'string') extra.push(`lang=${record.lang}`)
    if (typeof record.depth === 'number') extra.push(`depth=${record.depth}`)
    const line = record.position as { start?: { line?: number } } | undefined
    const at = line?.start?.line !== undefined ? ` @${line.start.line}` : ''
    rows.push(`${'  '.repeat(depth)}${type}${extra.length ? `(${extra.join(' ')})` : ''}${at}`)
  }
  const children = record.children
  if (Array.isArray(children)) {
    for (const child of children) rows.push(...outline(child, type ? depth + 1 : depth))
  }
  return rows
}

describe('golden 快照', () => {
  it('固定装置目录不为空', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  for (const name of files) {
    describe(name, () => {
      const source = readFileSync(join(FIXTURES, name), 'utf8')
      const result = parse(source)

      it('诊断', () => {
        const text = result.diagnostics
          .map((d) => formatDiagnostic(d, { path: name, source, color: false }))
          .join('\n\n')
        expect(text).toMatchSnapshot()
      })

      it('AST 轮廓与 frontmatter', () => {
        expect({
          frontmatter: result.frontmatter,
          outline: outline(result.ast),
        }).toMatchSnapshot()
      })
    })
  }
})
