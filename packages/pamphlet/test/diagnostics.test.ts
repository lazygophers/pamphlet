import { describe, expect, it } from 'vitest'
import { countBySeverity, diagnostic, formatDiagnostic } from '../src/diagnostics.js'

const source = ['第一行', '第二行有问题', '第三行'].join('\n')
const format = (d: Parameters<typeof formatDiagnostic>[0], color = false) =>
  formatDiagnostic(d, { path: 'a.md', source, color })

describe('诊断格式化', () => {
  it('带位置时给出源码片段与 caret', () => {
    const text = format(
      diagnostic('DIR-201', 'warning', '未知指令 zzz', {
        start: { line: 2, column: 1 },
        end: { line: 2, column: 4 },
        hint: '照这个改',
      }),
    )
    expect(text).toContain('warning[DIR-201]')
    expect(text).toContain('--> a.md:2:1')
    expect(text).toContain('第二行有问题')
    expect(text).toContain('^^^')
    expect(text).toContain('= 照这个改')
    expect(text).toContain('https://pamphlet.dev/diagnostics/dir-201')
  })

  it('没有位置时也能格式化（只给消息、建议、文档链接）', () => {
    const text = format(diagnostic('DOC-103', 'error', '整份 frontmatter 不合法', { hint: '看这里' }))
    expect(text).toContain('error[DOC-103]')
    expect(text).toContain('= 看这里')
    expect(text).not.toContain('-->')
  })

  it('没有建议时不打印建议那一行', () => {
    const text = format(diagnostic('DOC-102', 'warning', '只有消息'))
    expect(text).not.toContain('=')
  })

  it('end 跨行时 caret 至少一个', () => {
    const text = format(
      diagnostic('DIR-203', 'error', '跨行', {
        start: { line: 2, column: 3 },
        end: { line: 3, column: 1 },
      }),
    )
    expect(text).toContain('^')
  })

  it('位置指向不存在的行时不崩，只是没有源码片段', () => {
    const text = format(diagnostic('DOC-101', 'error', '越界', { start: { line: 99, column: 1 } }))
    expect(text).toContain('--> a.md:99:1')
    expect(text).not.toContain('第一行')
  })

  it('开色时带 ANSI 转义，关色时不带', () => {
    const d = diagnostic('DOC-101', 'error', '有色')
    expect(format(d, true)).toContain('[')
    expect(format(d, false)).not.toContain('[')
  })
})

describe('按严重程度计数', () => {
  it('分别数错误与警告', () => {
    const counts = countBySeverity([
      {
        path: 'a.md',
        diagnostics: [
          diagnostic('DOC-101', 'error', 'x'),
          diagnostic('DIR-201', 'warning', 'y'),
          diagnostic('DIR-203', 'error', 'z'),
        ],
      },
      { path: 'b.md', diagnostics: [] },
    ])
    expect(counts).toEqual({ errors: 2, warnings: 1 })
  })

  it('空清单是零', () => {
    expect(countBySeverity([])).toEqual({ errors: 0, warnings: 0 })
  })
})
