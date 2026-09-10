/**
 * 诊断：编译器发给作者的一条消息，带位置、原因和修复建议。
 * 码不编码严重程度（ADR-0027）——严重程度是独立字段，可被 --fail-on-warn 改变。
 */

export type Severity = 'error' | 'warning'

/** 码段：DOC 文档与语法 · DIR 指令 · DIAG 图表引擎 · EMB 资源内嵌 */
export type DiagnosticCode =
  | 'DOC-101' // spec 高于编译器支持的版本
  | 'DOC-102' // frontmatter 里有未知字段
  | 'DOC-103' // frontmatter 不是合法 YAML
  | 'DOC-104' // frontmatter 字段值合法但本版本未实现
  | 'DIR-201' // 未知指令
  | 'DIR-202' // 指令用错了位置或形态
  | 'DIR-203' // 指令未闭合
  | 'DIR-204' // 指令缺少必需的部分
  | 'DIR-205' // 同一组里出现了多个只能有一个的标记
  | 'DIR-206' // 属性值不在允许的取值里
  | 'DIR-207' // 这个指令不认识这个属性
  | 'DIAG-301' // 渲染这种图表需要的引擎没装
  | 'DIAG-302' // 单张图的 SVG 过大
  | 'DIAG-303' // 渲染超时或失败
  | 'DIAG-304' // 引擎输出里有硬编码色值，换不成主题变量
  | 'EMB-401' // 单个资源超过字节上限
  | 'EMB-402' // 读不到这个资源
  | 'EMB-403' // 引用了远程资源，自包含不允许
  | 'EMB-404' // 这种字体格式不能子集化（.ttc 字体集合）

export interface Point {
  /** 1 起 */ line: number
  /** 1 起 */ column: number
}

export interface Diagnostic {
  code: DiagnosticCode
  severity: Severity
  message: string
  /** 修复建议：要么是一条能直接跑的命令，要么是一句能直接照做的话 */
  hint?: string
  start?: Point
  end?: Point
  docUrl?: string
}

export const DOC_BASE = 'https://pamphlet.dev/diagnostics/'

export function diagnostic(
  code: DiagnosticCode,
  severity: Severity,
  message: string,
  extra: Omit<Diagnostic, 'code' | 'severity' | 'message'> = {},
): Diagnostic {
  return { code, severity, message, docUrl: `${DOC_BASE}${code.toLowerCase()}`, ...extra }
}

const RESET = '[0m'
const BOLD = '[1m'
const DIM = '[2m'
const RED = '[31m'
const YELLOW = '[33m'
const BLUE = '[34m'

interface FormatOptions {
  /** 源文档路径，出现在 `--> path:line:col` 里 */
  path: string
  /** 源文档全文，用来切出出错那一行 */
  source: string
  color: boolean
}

/** 人类可读格式：带源码片段、修复建议、文档链接 */
export function formatDiagnostic(d: Diagnostic, options: FormatOptions): string {
  const { path, source, color } = options
  const paint = (code: string, text: string) => (color ? `${code}${text}${RESET}` : text)

  const severityColor = d.severity === 'error' ? RED : YELLOW
  const head = `${paint(severityColor + BOLD, `${d.severity}[${d.code}]`)} ${d.message}`
  const lines: string[] = [head]

  if (d.start) {
    const gutterWidth = String(d.start.line).length
    const pad = ' '.repeat(gutterWidth)
    const arrow = paint(BLUE + BOLD, '-->')
    lines.push(`${pad} ${arrow} ${path}:${d.start.line}:${d.start.column}`)

    const sourceLine = source.split('\n')[d.start.line - 1]
    if (sourceLine !== undefined) {
      const bar = paint(BLUE + BOLD, '|')
      const endColumn = d.end && d.end.line === d.start.line ? d.end.column : d.start.column + 1
      const caretCount = Math.max(1, endColumn - d.start.column)
      lines.push(`${pad} ${bar}`)
      lines.push(`${paint(BLUE + BOLD, String(d.start.line))} ${bar} ${sourceLine}`)
      lines.push(
        `${pad} ${bar} ${' '.repeat(d.start.column - 1)}${paint(severityColor, '^'.repeat(caretCount))}`,
      )
      lines.push(`${pad} ${bar}`)
    }
    if (d.hint) lines.push(`${pad} ${paint(BLUE + BOLD, '=')} ${d.hint}`)
    if (d.docUrl) lines.push(`${pad} ${paint(DIM, d.docUrl)}`)
  } else {
    if (d.hint) lines.push(`  = ${d.hint}`)
    if (d.docUrl) lines.push(`  ${paint(DIM, d.docUrl)}`)
  }

  return lines.join('\n')
}

/** 一份文档的诊断结果 */
export interface FileReport {
  path: string
  diagnostics: Diagnostic[]
}

export function countBySeverity(reports: FileReport[]): { errors: number; warnings: number } {
  let errors = 0
  let warnings = 0
  for (const report of reports) {
    for (const d of report.diagnostics) {
      if (d.severity === 'error') errors += 1
      else warnings += 1
    }
  }
  return { errors, warnings }
}
